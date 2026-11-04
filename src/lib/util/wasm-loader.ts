import { dev, browser } from '$app/environment';
import { error } from '@sveltejs/kit';

function raiseError(obj: { loading: boolean }, err: unknown) {
    obj.loading = false;
    if (dev) {
        console.error('Cannot build WASM examples for probability sequence.\n', err);
    } else {
        error(500, `Cannot build WASM examples for probability sequence.\n${err}`);
    }
}

export default async function wasmLoader<const S extends readonly string[]>(
    metaGlob: Record<string, () => Promise<unknown>>,
    fields: S,
    obj: Partial<Record<S[number], unknown>> & { loading: boolean },
) {
    if (browser) {
        try {
            // run the loader
            const loader = Object.values(metaGlob)[0];
            const mod = await loader();

            // WASM needs initialization
            if (
                typeof mod != 'object' ||
                !mod ||
                !('default' in mod) ||
                typeof mod.default != 'function'
            ) {
                throw 'WASM module is not an object containing a default initialization output.';
            }
            await mod.default();

            // load all the functions
            for (const field of fields) {
                if (
                    field in mod &&
                    typeof (mod as Record<typeof field, unknown>)[field] == 'function'
                ) {
                    // @ts-expect-error: the type is unknown from WASM
                    obj[field] = mod[field];
                } else {
                    raiseError(obj, `\`${field}\` does not exist in WASM.`);
                }
            }
        } catch (e) {
            raiseError(obj, e);
        }
        obj.loading = false;
    }
}
