import { error, type Load } from '@sveltejs/kit';
import type { Component } from 'svelte';

export const svxLoaders = Object.fromEntries(
    // Root-relative, so the keys are the content layer's filenames once the
    // leading slash goes: `/content/x.svx` is `content/x.svx`.
    Object.entries(import.meta.glob('/content/**/*.svx')).map(([path, loader]) => [
        path.slice(1),
        loader,
    ]),
) as Record<string, () => Promise<{ default: Component }>>;

export async function getComponent(filename: string): Promise<Component | undefined> {
    const loader = svxLoaders[filename];
    if (!loader) return;
    const module = await loader();
    return module.default;
}

export const imgLoaders = Object.fromEntries(
    Object.entries(import.meta.glob('/content/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}')).map(
        ([path, loader]) => [path.slice(1), loader],
    ),
) as Record<string, () => Promise<{ default: string }>>;

export async function getImg(filename: string): Promise<string | undefined> {
    const loader = imgLoaders[filename];
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
