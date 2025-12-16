import { mdsvex, escapeSvelte } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import { createHighlighter } from 'shiki';

import remarkMath from 'remark-math';
import remarkFrontmatter from 'remark-frontmatter';
import { remarkCms, rehypeCms, rehypeKatexBox } from 'cms/mdsvex';

import katex from './katex.js';

const highlighter = await createHighlighter({
    themes: ['vitesse-light', 'vitesse-dark'],
    langs: ['rust'],
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [
        vitePreprocess(),
        mdsvex({
            remarkPlugins: [remarkFrontmatter, remarkMath, remarkCms],
            rehypePlugins: [[rehypeCms, katex], rehypeKatexBox],
            highlight: {
                highlighter: async (code, lang = 'text') => {
                    const html = escapeSvelte(
                        highlighter.codeToHtml(code, {
                            lang,
                            themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
                        }),
                    );
                    return `{@html \`${html}\` }`;
                },
            },
        }),
    ],
    kit: {
        adapter: adapter(),
    },
    extensions: ['.svelte', '.svx'],
};

export default config;
