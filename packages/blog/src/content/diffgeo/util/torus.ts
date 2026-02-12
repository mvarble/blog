import { BufferGeometry, Float32BufferAttribute, Matrix3, Vector2, Vector3, Group } from 'three';
import { ParametricSurfaceGeometry } from './parameteric-surface-geometry';

export const TORUS_X = (u: number, v: number) => Math.cos(u) * (2.0 + Math.cos(v));
export const TORUS_Y = (u: number, v: number) => Math.sin(u) * (2.0 + Math.cos(v));
export const TORUS_Z = (_: number, v: number) => Math.sin(v);
export const TORUS = (u: number, v: number) =>
    new Vector3(TORUS_X(u, v), TORUS_Y(u, v), TORUS_Z(u, v));

const SCALE = 1.03;
const SCALED_TORUS_X = (u: number, v: number) => Math.cos(u) * (2.0 + SCALE * Math.cos(v));
const SCALED_TORUS_Y = (u: number, v: number) => Math.sin(u) * (2.0 + SCALE * Math.cos(v));
const SCALED_TORUS_Z = (_: number, v: number) => SCALE * Math.sin(v);

function solveTorusUV(point: Vector3): Vector2 {
    const xy = new Vector2(point.x, point.y);
    const asinz = Math.asin(point.z);
    const xyl = xy.length();
    const v = xyl > 2.0 ? asinz : Math.sign(asinz) * Math.PI - asinz;
    const u = Math.atan2(xy.y, xy.x);
    return new Vector2(u, v);
}

export function torus(): ParametricSurfaceGeometry {
    const count = 100;
    return new ParametricSurfaceGeometry({
        x: TORUS_X,
        y: TORUS_Y,
        z: TORUS_Z,
        uDomain: [-Math.PI, Math.PI - (2.0 * Math.PI) / (count - 1)],
        uCount: count,
        uWrap: true,
        vDomain: [-Math.PI, Math.PI - (2.0 * Math.PI) / (count - 1)],
        vCount: count,
        vWrap: true,
    });
}

export interface CoordinateDomain {
    center: Vector2;
    radius: number;
}

export interface CoordinateComposition {
    matrix: Matrix3;
    matrixInv: Matrix3;
}

export interface ChartCoordinates {
    domain: CoordinateDomain;
    composition: CoordinateComposition;
}

export interface Chart {
    ambientCenter: Vector3;
    coordinates: ChartCoordinates;
}

function wrap(x: number): number {
    while (x < -Math.PI) {
        x += 2.0 * Math.PI;
    }
    while (x > Math.PI) {
        x -= 2.0 * Math.PI;
    }
    return x;
}

export class Charts extends Group {
    private charts: Chart[];
    private current: number[];

    geometry3d: BufferGeometry;
    geometry2d: BufferGeometry;

    constructor(current?: number | number[]) {
        super();

        const N = 10;
        const DELTA = (2.0 * Math.PI) / N;
        this.charts = Array.from({ length: N }).flatMap((_, j) =>
            Array.from({ length: N }).map((_, i) => {
                const radius = DELTA * (Math.SQRT1_2 + 0.25 * Math.random());
                const u = DELTA * i;
                const v = DELTA * j;
                const scaleu = 1.25 * Math.random() + 0.5;
                const scalev = 1.25 * Math.random() + 0.5;
                const rotation = 2.0 * Math.PI * Math.random();
                const matrix = new Matrix3()
                    .identity()
                    .scale(scaleu / radius, scalev / radius)
                    .rotate(rotation);
                return {
                    ambientCenter: new Vector3(TORUS_X(u, v), TORUS_Y(u, v), TORUS_Z(u, v)),
                    coordinates: {
                        domain: {
                            center: new Vector2(u, v),
                            radius,
                        },
                        composition: {
                            matrix,
                            matrixInv: new Matrix3().copy(matrix).invert(),
                        },
                    },
                };
            }),
        );

        if (Array.isArray(current) && current.every(Number.isFinite)) {
            this.current = current;
        } else if (typeof current == 'number') {
            this.current = [current];
        } else {
            this.current = [];
        }
        this.geometry3d = new BufferGeometry();
        this.geometry2d = new BufferGeometry();
        this.updateAttributes();
    }

    dispose() {
        this.geometry3d.dispose();
        this.geometry2d.dispose();
    }

    getCurrent(): Chart[] {
        return this.current.map((current) => {
            const chart = this.charts[current];
            return {
                ambientCenter: new Vector3().copy(chart.ambientCenter),
                coordinates: {
                    domain: {
                        center: new Vector2().copy(chart.coordinates.domain.center),
                        radius: chart.coordinates.domain.radius,
                    },
                    composition: {
                        matrix: new Matrix3().copy(chart.coordinates.composition.matrix),
                        matrixInv: new Matrix3().copy(chart.coordinates.composition.matrixInv),
                    },
                },
            };
        });
    }

    updateCharts(current?: number | number[]) {
        if (Array.isArray(current)) {
            this.current = current.filter(
                (x) =>
                    Number.isFinite(x) && Number.isInteger(x) && 0 <= x && x < this.charts.length,
            );
        } else if (
            typeof current == 'number' &&
            Number.isFinite(current) &&
            Number.isInteger(current) &&
            0 <= current &&
            current < this.charts.length
        ) {
            this.current = [current];
        } else {
            this.current = [];
        }
        this.updateAttributes();
    }

    chartsCoords(point: Vector3): Vector2[] {
        const uv = solveTorusUV(point);
        return this.current.map((current) => {
            const coordinates = this.charts[current].coordinates;
            const st = new Vector2().copy(uv).sub(coordinates.domain.center);
            st.x = wrap(st.x);
            st.y = wrap(st.y);
            st.applyMatrix3(coordinates.composition.matrix);
            return st;
        });
    }

    updateChartsFromNearest(point: Vector3) {
        if (this.charts.length == 0) return;
        const pair = this.charts.reduce(
            ([minIndex, minl2], chart, index) => {
                const l2 = new Vector3().copy(chart.ambientCenter).sub(point).lengthSq();
                return (l2 < minl2 ? [index, l2] : [minIndex, minl2]) as [number, number];
            },
            [-1, Infinity] as [number, number],
        );
        this.current = [pair[0]];
        this.updateAttributes();
    }

    private updateAttributes() {
        const EDGES = 128;
        const RINGS = 3;
        const VERTICES = 1 + EDGES * RINGS;
        const FACES = EDGES * (1 + (RINGS - 1) * 2);

        const positions3d = Array.from({ length: 3 * this.current.length * VERTICES });
        const positions2d = Array.from({ length: 3 * this.current.length * VERTICES });
        const indices = Array.from({ length: 3 * this.current.length * FACES });
        for (let k = 0; k < this.current.length; k++) {
            const startIndex = k * VERTICES;
            const startFaceIndex = k * FACES;
            const current = this.current[k];
            const chart = this.charts[current];
            const uv = chart.coordinates.domain.center;
            const radius = chart.coordinates.domain.radius;
            const matrix = chart.coordinates.composition.matrix;

            positions3d[3 * startIndex + 0] = SCALED_TORUS_X(uv.x, uv.y);
            positions3d[3 * startIndex + 1] = SCALED_TORUS_Y(uv.x, uv.y);
            positions3d[3 * startIndex + 2] = SCALED_TORUS_Z(uv.x, uv.y);

            positions2d[3 * startIndex + 0] = 0.0;
            positions2d[3 * startIndex + 1] = 0.0;
            positions2d[3 * startIndex + 2] = 0.0;

            for (let ring = 0; ring < RINGS; ring++) {
                const r = (radius * (ring + 1)) / RINGS;
                for (let edge = 0; edge < EDGES; edge++) {
                    const theta = (2.0 * Math.PI * edge) / EDGES;
                    const du = r * Math.cos(theta);
                    const dv = r * Math.sin(theta);
                    const u = uv.x + du;
                    const v = uv.y + dv;
                    const st = new Vector2(du, dv).applyMatrix3(matrix);

                    const vertexIndex = 1 + startIndex + EDGES * ring + edge;

                    positions3d[3 * vertexIndex + 0] = SCALED_TORUS_X(u, v);
                    positions3d[3 * vertexIndex + 1] = SCALED_TORUS_Y(u, v);
                    positions3d[3 * vertexIndex + 2] = SCALED_TORUS_Z(k, v);

                    positions2d[3 * vertexIndex + 0] = st.x;
                    positions2d[3 * vertexIndex + 1] = st.y;
                    positions2d[3 * vertexIndex + 2] = 0.0;

                    if (ring == 0) {
                        const edgeIndex = startFaceIndex + edge;
                        if (edge < EDGES - 1) {
                            indices[3 * edgeIndex + 0] = vertexIndex;
                            indices[3 * edgeIndex + 2] = 0;
                            indices[3 * edgeIndex + 1] = vertexIndex + 1;
                        } else {
                            indices[3 * edgeIndex + 0] = vertexIndex;
                            indices[3 * edgeIndex + 2] = 0;
                            indices[3 * edgeIndex + 1] = vertexIndex - EDGES + 1;
                        }
                    } else {
                        const edgeIndex = startFaceIndex + (1 + (ring - 1) * 2) * EDGES + 2 * edge;
                        if (edge < EDGES - 1) {
                            indices[3 * edgeIndex + 0] = vertexIndex;
                            indices[3 * edgeIndex + 1] = vertexIndex - EDGES + 1;
                            indices[3 * edgeIndex + 2] = vertexIndex - EDGES;
                            indices[3 * edgeIndex + 3] = vertexIndex;
                            indices[3 * edgeIndex + 4] = vertexIndex + 1;
                            indices[3 * edgeIndex + 5] = vertexIndex - EDGES + 1;
                        } else {
                            indices[3 * edgeIndex + 0] = vertexIndex;
                            indices[3 * edgeIndex + 1] = vertexIndex - 2 * EDGES + 1;
                            indices[3 * edgeIndex + 2] = vertexIndex - EDGES;
                            indices[3 * edgeIndex + 3] = vertexIndex;
                            indices[3 * edgeIndex + 4] = vertexIndex - EDGES + 1;
                            indices[3 * edgeIndex + 5] = vertexIndex - 2 * EDGES + 1;
                        }
                    }
                }
            }
        }
        this.geometry3d.setAttribute(
            'position',
            new Float32BufferAttribute(positions3d as number[], 3),
        );
        this.geometry3d.setIndex(indices as number[]);
        this.geometry3d.computeVertexNormals();
        this.geometry3d.computeBoundingSphere();
        this.geometry2d.setAttribute(
            'position',
            new Float32BufferAttribute(positions2d as number[], 3),
        );
        this.geometry2d.setIndex(indices as number[]);
        this.geometry2d.computeVertexNormals();
        this.geometry2d.computeBoundingSphere();
    }
}
