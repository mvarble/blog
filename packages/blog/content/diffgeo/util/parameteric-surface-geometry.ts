import { BufferGeometry, DynamicDrawUsage, Float32BufferAttribute } from 'three';

export type SurfaceComponentFunction = (u: number, v: number) => number;

export interface ParametricSurfaceGeometryParams {
    x: SurfaceComponentFunction;
    y: SurfaceComponentFunction;
    z: SurfaceComponentFunction;
    uDomain?: [number, number];
    uCount?: number;
    uWrap?: boolean;
    vDomain?: [number, number];
    vCount?: number;
    vWrap?: boolean;
}

export class ParametricSurfaceGeometry extends BufferGeometry {
    private x: SurfaceComponentFunction;
    private y: SurfaceComponentFunction;
    private z: SurfaceComponentFunction;
    private uDomain: [number, number];
    private uCount: number;
    private uWrap: boolean;
    private vDomain: [number, number];
    private vCount: number;
    private vWrap: boolean;
    private positions: Float32BufferAttribute;

    constructor(obj: ParametricSurfaceGeometryParams) {
        super();

        this.x = obj.x;
        this.y = obj.y;
        this.z = obj.z;
        this.uDomain = obj.uDomain || [0, 1];
        this.uCount = typeof obj.uCount == 'number' && obj.uCount > 1 ? obj.uCount : 100;
        this.uWrap = typeof obj.uWrap == 'boolean' ? obj.uWrap : false;
        this.vDomain = obj.vDomain || [0, 1];
        this.vCount = typeof obj.vCount == 'number' && obj.vCount > 1 ? obj.vCount : 100;
        this.vWrap = typeof obj.vWrap == 'boolean' ? obj.vWrap : false;

        this.positions = this.createPositions();
        this.setAttribute('position', this.positions);
        this.setIndex(this.calculateIndices());
        this.computeVertexNormals();
        this.computeBoundingSphere();
    }

    update(obj?: Partial<ParametricSurfaceGeometry>) {
        let vertexCountUpdated = false;
        let wrapUpdated = false;
        if (obj) {
            if ('x' in obj && typeof obj.x) {
                // @ts-expect-error: no way to check signature as far as I know...
                this.x = obj.x;
            }
            if ('y' in obj && obj.y) {
                // @ts-expect-error: no way to check signature as far as I know...
                this.y = obj.y;
            }
            if ('z' in obj && obj.z) {
                // @ts-expect-error: no way to check signature as far as I know...
                this.z = obj.z;
            }
            if (
                'uDomain' in obj &&
                Array.isArray(obj.uDomain) &&
                obj.uDomain.length == 2 &&
                obj.uDomain.every(Number.isFinite)
            ) {
                this.uDomain = [obj.uDomain[0], obj.uDomain[1]];
            }
            if ('uCount' in obj && typeof obj.uCount == 'number' && obj.uCount > 1) {
                vertexCountUpdated = vertexCountUpdated || this.uCount != obj.uCount;
                this.uCount = obj.uCount;
            }
            if ('uWrap' in obj && typeof obj.uWrap == 'boolean') {
                wrapUpdated = wrapUpdated || this.uWrap != obj.uWrap;
                this.uWrap = obj.uWrap;
            }
            if (
                'vDomain' in obj &&
                Array.isArray(obj.vDomain) &&
                obj.vDomain.length == 2 &&
                obj.vDomain.every(Number.isFinite)
            ) {
                this.vDomain = [obj.vDomain[0], obj.vDomain[1]];
            }
            if ('vCount' in obj && typeof obj.vCount == 'number' && obj.vCount > 1) {
                vertexCountUpdated = vertexCountUpdated || this.vCount != obj.vCount;
                this.vCount = obj.vCount;
            }
            if ('vWrap' in obj && typeof obj.vWrap == 'boolean') {
                wrapUpdated = wrapUpdated || this.vWrap != obj.vWrap;
                this.vWrap = obj.vWrap;
            }
        }

        if (vertexCountUpdated) {
            this.positions = this.createPositions();
            this.positions.needsUpdate = true;
            this.setAttribute('position', this.positions);
        } else {
            this.updatePositions();
        }

        if (vertexCountUpdated || wrapUpdated) {
            this.setIndex(this.calculateIndices());
        }
        this.computeVertexNormals();
        this.computeBoundingSphere();
    }

    private calculateIndices(): number[] {
        const uIndices = this.uWrap ? this.uCount : this.uCount - 1;
        const vIndices = this.vWrap ? this.vCount : this.vCount - 1;
        const indices = Array.from({ length: 6 * uIndices * vIndices });
        let k = 0;
        for (let j = 0; j < vIndices; j++) {
            for (let i = 0; i < uIndices; i++) {
                const index = this.uCount * j + i;
                if (j < this.vCount - 1 && i < this.uCount - 1) {
                    indices[6 * k + 0] = index;
                    indices[6 * k + 1] = index + 1;
                    indices[6 * k + 2] = index + this.uCount + 1;
                    indices[6 * k + 3] = index;
                    indices[6 * k + 4] = index + this.uCount + 1;
                    indices[6 * k + 5] = index + this.uCount;
                } else if (j < this.vCount - 1) {
                    indices[6 * k + 0] = index;
                    indices[6 * k + 1] = index - this.uCount + 1;
                    indices[6 * k + 2] = index + 1;
                    indices[6 * k + 3] = index;
                    indices[6 * k + 4] = index + 1;
                    indices[6 * k + 5] = index + this.uCount;
                } else if (i < this.uCount - 1) {
                    indices[6 * k + 0] = index;
                    indices[6 * k + 1] = index + 1;
                    indices[6 * k + 2] = i + 1;
                    indices[6 * k + 3] = index;
                    indices[6 * k + 4] = i + 1;
                    indices[6 * k + 5] = i;
                } else {
                    indices[6 * k + 0] = index;
                    indices[6 * k + 1] = index - this.uCount + 1;
                    indices[6 * k + 2] = 0;
                    indices[6 * k + 3] = index;
                    indices[6 * k + 4] = 0;
                    indices[6 * k + 5] = this.uCount - 1;
                }
                k++;
            }
        }
        return indices as number[];
    }

    private createPositions(): Float32BufferAttribute {
        const positions = new Float32BufferAttribute(this.calculatePositions(), 3);
        positions.setUsage(DynamicDrawUsage);
        return positions;
    }

    private updatePositions() {
        const positions = this.calculatePositions();
        for (let i = 0; i < positions.length; i++) {
            this.positions.array[i] = positions[i];
        }
        this.positions.needsUpdate = true;
    }

    private calculatePositions(): number[] {
        const positions = Array.from({ length: 3 * this.uCount * this.vCount });
        const [u0, u1] = this.uDomain;
        const [v0, v1] = this.vDomain;
        for (let j = 0; j < this.vCount; j++) {
            const v = v0 + (v1 - v0) * (j / (this.vCount - 1));
            for (let i = 0; i < this.uCount; i++) {
                const u = u0 + (u1 - u0) * (i / (this.uCount - 1));
                const x = this.x(u, v);
                const y = this.y(u, v);
                const z = this.z(u, v);
                const index = this.uCount * j + i;
                positions[3 * index + 0] = x;
                positions[3 * index + 1] = y;
                positions[3 * index + 2] = z;
            }
        }
        return positions as number[];
    }
}
