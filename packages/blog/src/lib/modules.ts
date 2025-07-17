import type { Component } from 'svelte';

export default Object.fromEntries(
    Object.entries(import.meta.glob('../content/**/*.svx')).map(([relfilename, loader]) => {
        const filename = relfilename.replace('..', 'src');
        return [filename, loader];
    }),
) as Record<string, () => Promise<{ default: Component }>>;
