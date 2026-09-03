import {
    Box3,
    type BufferAttribute,
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    MeshBasicMaterial,
    Raycaster,
    Sphere,
    Triangle,
    Vector2,
    Vector3,
    type Material,
    type MeshStandardMaterial,
    type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

// The manifold and its atlas, as authored in `static/manifold.glb`.
//
// The file holds a `manifold` mesh and ten `chart.NN` meshes covering it,
// overlapping generously. Only the charts carry UVs, and those UVs are exactly
// the identification with a subset of R^2 that the figure is about.
//
// That is what makes both directions of the correspondence cheap. A chart's
// triangles can be indexed from the surface or from the plane, so the same
// index buffer serves both: raycast the surface and the interpolated UV falls
// out; raycast the plane and the same triangle's vertex positions give the
// point back. Neither direction needs a spatial index of its own, and nothing
// here depends on the charts sharing vertices with the manifold -- only on each
// chart carrying its own positions alongside its own UVs.
//
// The charts are expected to arrive already displaced along their normals, far
// enough to clear the manifold. They are decimated separately from it, so they
// are no longer quite the same surface: without the displacement about half of
// every chart sits *inside* the manifold and would be mottled by it. A depth
// bias is not a substitute -- `polygonOffset` reorders coplanar geometry, it
// does not raise geometry that is genuinely behind.
export interface Chart {
    name: string;
    // Sits on the manifold, with the node transform from the file.
    surface: Mesh;
    // The same triangles laid flat, with position (u, v, 0). Kept at the
    // identity transform so that a hit on it is already in chart coordinates.
    domain: Mesh;
    // Vertex index pairs tracing the outline of the domain: the edges belonging
    // to exactly one triangle. Used to clamp a coordinate that falls outside.
    boundary: Uint32Array;
}

export interface Atlas {
    // The whole loaded scene, so that node transforms are left where the file
    // put them rather than being flattened on reparenting.
    root: Object3D;
    manifold: Mesh;
    charts: Chart[];
    // A sphere containing the manifold, for framing a camera.
    bounds: Sphere;
    dispose(): void;
}

export async function loadAtlas(url: string): Promise<Atlas> {
    const gltf = await new GLTFLoader().loadAsync(url);
    const root = gltf.scene;
    root.updateMatrixWorld(true);

    let manifold: Mesh | undefined = undefined;
    const surfaces: Mesh[] = [];
    root.traverse((object) => {
        if (!(object as Mesh).isMesh) return;
        const mesh = object as Mesh;
        if (mesh.name == 'manifold') manifold = mesh;
        else if (mesh.name.startsWith('chart')) surfaces.push(mesh);
    });
    if (!manifold) throw new Error(`${url} has no mesh named 'manifold'.`);
    if (surfaces.length == 0) throw new Error(`${url} has no meshes named 'chart...'.`);

    // Reading order, so that the charts are numbered the way they are named.
    surfaces.sort((a, b) => a.name.localeCompare(b.name));
    const charts = surfaces.map(buildChart);

    const bounds = new Box3().setFromObject(manifold).getBoundingSphere(new Sphere());

    return {
        root,
        manifold,
        charts,
        bounds,
        dispose() {
            root.traverse((object) => {
                const mesh = object as Mesh;
                if (!mesh.isMesh) return;
                mesh.geometry.dispose();
                for (const material of materialsOf(mesh)) material.dispose();
            });
            // The domain geometries share their index with the surface they came
            // from, which the traversal above has already released; only the flat
            // positions are theirs alone.
            for (const chart of charts) {
                chart.domain.geometry.dispose();
                for (const material of materialsOf(chart.domain)) material.dispose();
            }
        },
    };
}

// The flat counterpart of one chart: the same triangles, drawn in the plane at
// the coordinates the chart assigns them.
export function buildChart(surface: Mesh): Chart {
    const uv = surface.geometry.getAttribute('uv');
    const index = surface.geometry.getIndex();
    if (!uv) throw new Error(`Chart '${surface.name}' has no uv attribute.`);
    if (!index) throw new Error(`Chart '${surface.name}' is not indexed.`);

    const flat = new Float32Array(uv.count * 3);
    for (let i = 0; i < uv.count; i++) {
        flat[3 * i] = uv.getX(i);
        flat[3 * i + 1] = uv.getY(i);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(flat, 3));
    // Shared, deliberately: it is the same triangle on either side, and that
    // correspondence is the whole mechanism.
    geometry.setAttribute('uv', uv);
    geometry.setIndex(index);
    geometry.computeBoundingSphere();

    // Double-sided because a chart's UVs may wind either way, and a ray dropped
    // onto the plane has to hit the triangle whichever way it faces.
    const domain = new Mesh(geometry, new MeshBasicMaterial({ side: 2 }));
    domain.name = `${surface.name}.domain`;
    domain.updateMatrixWorld();

    return { name: surface.name, surface, domain, boundary: outlineOf(index) };
}

// The edges of the outline: those belonging to exactly one triangle. A chart is
// one patch with no vertices split within it, so this is precisely the border of
// its domain in the plane.
function outlineOf(index: BufferAttribute): Uint32Array {
    const seen = new Map<number, number>();
    const once = (a: number, b: number) => {
        const key = a < b ? a * 0x100000000 + b : b * 0x100000000 + a;
        seen.set(key, (seen.get(key) ?? 0) + 1);
    };
    for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i);
        const b = index.getX(i + 1);
        const c = index.getX(i + 2);
        once(a, b);
        once(b, c);
        once(c, a);
    }
    const edges: number[] = [];
    for (const [key, count] of seen) {
        if (count != 1) continue;
        edges.push(Math.floor(key / 0x100000000), key % 0x100000000);
    }
    return Uint32Array.from(edges);
}

// Reused across calls: this runs on every pointer move.
const raycaster = new Raycaster();
const origin = new Vector3();
const down = new Vector3(0, 0, -1);
const corner = { a: new Vector3(), b: new Vector3(), c: new Vector3() };
const barycentric = new Vector3();
const vertex = new Vector3();
const candidate = new Vector3();
const edgeEnd = new Vector2();

// The point of the manifold whose chart coordinate is `uv`, in world space, or
// undefined when `uv` lies outside this chart's domain.
//
// Found by dropping a ray onto the flattened chart: the triangle it lands in is
// the triangle the point belongs to, and the barycentric weights that place the
// coordinate inside it place the point inside its counterpart on the surface.
//
// A chart ought to assign each coordinate to exactly one point, and nine of the
// ten do. `chart.09` folds over itself across roughly two percent of its domain,
// so a ray there meets two triangles and the coordinate names two points. `near`
// breaks that tie by continuity -- pass the point last shown, and the marker
// follows the branch it was already on rather than jumping to the other sheet.
export function manifoldPointAt(
    chart: Chart,
    uv: Vector2,
    target = new Vector3(),
    near?: Vector3,
): Vector3 | undefined {
    origin.set(uv.x, uv.y, 1);
    raycaster.set(origin, down);
    const hits = raycaster.intersectObject(chart.domain, false);
    if (hits.length == 0) return undefined;

    let best: Vector3 | undefined = undefined;
    let bestDistance = Infinity;
    for (const hit of hits) {
        if (!hit.face) continue;
        if (!reconstruct(chart, hit.face, hit.point, candidate)) continue;
        if (!near) return target.copy(candidate);
        const distance = candidate.distanceToSquared(near);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = target.copy(candidate);
        }
    }
    return best;
}

export interface ChartPoint {
    // The coordinate actually used: the one asked for when it lies in the
    // chart's domain, and the nearest one the chart does cover otherwise.
    uv: Vector2;
    // The point of the manifold that coordinate names, in world space.
    point: Vector3;
    inside: boolean;
}

// Where `uv` lands on the manifold, falling back to the nearest coordinate the
// chart covers when `uv` is outside its domain.
//
// The fallback needs no raycast and carries no tolerance: the nearest coordinate
// is a point some fraction along an outline edge, and because that edge is the
// same edge in both meshes, the manifold point is the same fraction along its
// counterpart. Interpolating the two endpoints is exact.
export function nearestOnChart(chart: Chart, uv: Vector2, near?: Vector3): ChartPoint | undefined {
    const inside = manifoldPointAt(chart, uv, new Vector3(), near);
    if (inside) return { uv: uv.clone(), point: inside, inside: true };
    if (chart.boundary.length == 0) return undefined;

    const flat = chart.domain.geometry.getAttribute('position');
    let bestEdge = 0;
    let bestT = 0;
    let bestDistance = Infinity;
    for (let e = 0; e < chart.boundary.length; e += 2) {
        const a = chart.boundary[e];
        const b = chart.boundary[e + 1];
        const ax = flat.getX(a);
        const ay = flat.getY(a);
        const dx = flat.getX(b) - ax;
        const dy = flat.getY(b) - ay;
        const lengthSq = dx * dx + dy * dy;
        const t =
            lengthSq > 0
                ? Math.min(1, Math.max(0, ((uv.x - ax) * dx + (uv.y - ay) * dy) / lengthSq))
                : 0;
        const ox = ax + t * dx - uv.x;
        const oy = ay + t * dy - uv.y;
        const distance = ox * ox + oy * oy;
        if (distance < bestDistance) {
            bestDistance = distance;
            bestEdge = e;
            bestT = t;
        }
    }

    const a = chart.boundary[bestEdge];
    const b = chart.boundary[bestEdge + 1];
    const positions = chart.surface.geometry.getAttribute('position');
    const point = new Vector3()
        .fromBufferAttribute(positions, a)
        .lerp(vertex.fromBufferAttribute(positions, b), bestT);
    return {
        uv: new Vector2(flat.getX(a), flat.getY(a)).lerp(
            edgeEnd.set(flat.getX(b), flat.getY(b)),
            bestT,
        ),
        point: chart.surface.localToWorld(point),
        inside: false,
    };
}

function reconstruct(
    chart: Chart,
    face: { a: number; b: number; c: number },
    point: Vector3,
    target: Vector3,
): Vector3 | undefined {
    const flat = chart.domain.geometry.getAttribute('position');
    corner.a.fromBufferAttribute(flat, face.a);
    corner.b.fromBufferAttribute(flat, face.b);
    corner.c.fromBufferAttribute(flat, face.c);
    if (!Triangle.getBarycoord(point, corner.a, corner.b, corner.c, barycentric)) return undefined;

    const positions = chart.surface.geometry.getAttribute('position');
    target.set(0, 0, 0);
    target.addScaledVector(vertex.fromBufferAttribute(positions, face.a), barycentric.x);
    target.addScaledVector(vertex.fromBufferAttribute(positions, face.b), barycentric.y);
    target.addScaledVector(vertex.fromBufferAttribute(positions, face.c), barycentric.z);
    return chart.surface.localToWorld(target);
}

function materialsOf(mesh: Mesh): Material[] {
    return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

// The chart texture as authored, reused for the flat copy so that both views
// show the same coordinate grid.
export function chartTexture(chart: Chart) {
    const material = materialsOf(chart.surface)[0] as MeshStandardMaterial;
    return material?.map ?? null;
}
