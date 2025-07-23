import { error, type Load } from '@sveltejs/kit';
import type { Component } from 'svelte';

export const loaders = Object.fromEntries(
    Object.entries(import.meta.glob('../content/**/*.svx')).map(([relfilename, loader]) => {
        const filename = relfilename.replace('..', 'src');
        return [filename, loader];
    }),
) as Record<string, () => Promise<{ default: Component }>>;

export async function getComponent(filename: string): Promise<Component | undefined> {
    const loader = loaders[filename];
    if (!loader) return;
    const module = await loader();
    return module.default;
}

export const load: Load = async ({ data }) => {
    const filename = (data as { filename: string }).filename;
    const component = await getComponent(filename);
    if (!component) {
        error(404, { message: `Not found ${filename}` });
    }
    return { ...data, component };
};
