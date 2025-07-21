import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import remarkMath from 'remark-math';
import remarkFrontmatter from 'remark-frontmatter';
import { remarkCms, rehypeCms } from 'cms';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [
        vitePreprocess(),
        mdsvex({
            remarkPlugins: [remarkFrontmatter, remarkMath, remarkCms],
            rehypePlugins: [rehypeCms],
        }),
    ],
    kit: {
        adapter: adapter(),
    },
    extensions: ['.svelte', '.svx'],
};

export default config;
