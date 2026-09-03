// Round-trips the two directions of the chart correspondence against the real
// asset: raycast a chart's surface to get (point, uv), feed the uv back through
// `manifoldPointAt`, and measure how far the reconstructed point landed from
// where the ray actually hit.
//
// Worth re-running after any re-export of `manifold.glb`. The correspondence
// relies on every `chart.NN` mesh being a submesh of `manifold` carrying its own
// UVs; decimating one without the other would break that, and this is what says
// so. Run from `packages/blog`:
//
//     node scripts/chart-roundtrip.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    MeshBasicMaterial,
    Raycaster,
    Uint32BufferAttribute,
    Vector3,
} from 'three';

import { buildChart, manifoldPointAt } from '../src/content/diffgeo/util/glb-manifold.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const GLB = path.join(here, '..', 'src', 'content', 'diffgeo', 'static', 'manifold.glb');

const buf = fs.readFileSync(GLB);
const jsonLength = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLength));
const binStart = 20 + jsonLength + 8;

const COMPONENT = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const ITEMS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function accessor(i) {
    const a = gltf.accessors[i];
    const view = gltf.bufferViews[a.bufferView];
    const Arr = COMPONENT[a.componentType];
    const offset = binStart + (view.byteOffset || 0) + (a.byteOffset || 0);
    return new Arr(buf.buffer, buf.byteOffset + offset, a.count * ITEMS[a.type]);
}

// The same meshes GLTFLoader would hand us, built without a GPU.
function meshOf(node) {
    const primitive = gltf.meshes[node.mesh].primitives[0];
    const geometry = new BufferGeometry();
    geometry.setAttribute(
        'position',
        new Float32BufferAttribute(accessor(primitive.attributes.POSITION).slice(), 3),
    );
    if (primitive.attributes.TEXCOORD_0 != null) {
        geometry.setAttribute(
            'uv',
            new Float32BufferAttribute(accessor(primitive.attributes.TEXCOORD_0).slice(), 2),
        );
    }
    geometry.setIndex(new Uint32BufferAttribute(Uint32Array.from(accessor(primitive.indices)), 1));
    const mesh = new Mesh(geometry, new MeshBasicMaterial({ side: 2 }));
    mesh.name = node.name;
    if (node.scale) mesh.scale.fromArray(node.scale);
    if (node.translation) mesh.position.fromArray(node.translation);
    mesh.updateMatrixWorld(true);
    return mesh;
}

const charts = gltf.nodes
    .filter((n) => n.name.startsWith('chart'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => buildChart(meshOf(n)));

const manifold = meshOf(gltf.nodes.find((n) => n.name == 'manifold'));
manifold.geometry.computeBoundingSphere();
const extent = 2 * manifold.geometry.boundingSphere.radius * manifold.scale.x;

// Fire rays at each chart from all around, and round-trip every hit.
const raycaster = new Raycaster();
const errors = [];
const guidedErrors = [];
let misses = 0;
const reconstructed = new Vector3();

for (const chart of charts) {
    chart.surface.geometry.computeBoundingSphere();
    const centre = chart.surface.geometry.boundingSphere.center
        .clone()
        .applyMatrix4(chart.surface.matrixWorld);
    const radius = chart.surface.geometry.boundingSphere.radius * chart.surface.scale.x;

    for (let i = 0; i < 900; i++) {
        // A ray aimed at a random point of the chart's bounding sphere, from
        // outside it, so hits land all over the patch.
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = 2 * Math.PI * Math.random();
        const direction = new Vector3(
            Math.sin(theta) * Math.cos(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(theta),
        );
        const jitter = new Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
        ).multiplyScalar(radius);
        const target = centre.clone().add(jitter);
        const from = target.clone().addScaledVector(direction, 4 * radius);
        raycaster.set(from, direction.clone().negate());

        const hit = raycaster.intersectObject(chart.surface, false)[0];
        if (!hit || !hit.uv) continue;

        // Without a continuity hint first, then with one. A chart whose UV
        // layout folds over itself assigns two points to one coordinate, and
        // the hint is what keeps the marker on the branch it was already on.
        const blind = manifoldPointAt(chart, hit.uv, reconstructed);
        if (!blind) {
            misses++;
            continue;
        }
        errors.push(blind.distanceTo(hit.point));

        const guided = manifoldPointAt(chart, hit.uv, reconstructed, hit.point);
        if (guided) guidedErrors.push(guided.distanceTo(hit.point));
    }
}

function report(label, sample) {
    sample.sort((a, b) => a - b);
    const at = (q) => sample[Math.min(sample.length - 1, Math.floor(q * sample.length))];
    const max = sample[sample.length - 1];
    const bad = sample.filter((e) => e > 1e-6).length;
    console.log(`${label}`);
    console.log(`  median          ${at(0.5).toExponential(2)}`);
    console.log(`  99.9th          ${at(0.999).toExponential(2)}`);
    console.log(
        `  max             ${max.toExponential(2)}  (${((100 * max) / extent).toFixed(2)}% of extent)`,
    );
    console.log(
        `  worse than 1e-6 ${bad} of ${sample.length}  (${((100 * bad) / sample.length).toFixed(2)}%)`,
    );
}

console.log(`manifold extent   ${extent.toFixed(3)} world units`);
console.log(`round-trips       ${errors.length} (${misses} coordinates not recovered)\n`);
report('reconstruction error, no continuity hint:', errors);
console.log('');
report('reconstruction error, with continuity hint:', guidedErrors);
