import type { Group } from 'three';

interface Disposable {
    dispose(): void;
}

function isDisposable(obj: unknown): obj is Disposable {
    return (
        typeof obj == 'object' &&
        obj != null &&
        'dispose' in obj &&
        typeof obj.dispose == 'function'
    );
}

export default function disposeGLTF(root: Group) {
    const geometries = new Set<Disposable>();
    const materials = new Set<Disposable>();
    const textures = new Set<Disposable>();

    root.traverse((obj) => {
        if (!('isMesh' in obj) || !obj.isMesh) return;

        if ('geometry' in obj && isDisposable(obj.geometry)) {
            geometries.add(obj.geometry);
        }

        if ('material' in obj) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of mats) {
                materials.add(mat);
                for (const key in mat) {
                    const value = mat[key];
                    if (value && value.isTexture) {
                        textures.add(value);
                    }
                }
            }
        }
    });

    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
}
