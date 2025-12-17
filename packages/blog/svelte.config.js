import path from 'node:path';
import fs from 'node:fs';
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

// This will parse an `importString` of one of the following forms.
//  - ../path/to/file
//  - ../path/to/file:start..
//  - ../path/to/file:..end
//  - ../path/to/file:start..end
// The returned value is a tuple of the following.
//  - the resolved file in the prefix of `importString`, relative to `filename`
//  - a number `start` if provided; null otherwise.
//  - a number `end` if provided; null otherwise.
// If the resolution fails, an error is thrown
function parseImportString(importString, filename) {
    let importedFilename = importString;
    let startLine = null;
    let endLine = null;
    if (importString.includes(':')) {
        const parts = importString.split(':');
        if (parts.length > 2) {
            throw 'A fenced import cannot contain multiple characters `:`.';
        }
        importedFilename = parts[0];
        const linesString = parts[1];
        if (linesString.startsWith('..')) {
            endLine = Number(linesString.slice(2));
            if (!Number.isFinite(endLine)) {
                throw `\`${linesString}\` is not a valid specification of a range ..$end`;
            }
        } else if (linesString.endsWith('..')) {
            startLine = Number(linesString.slice(0, -2));
            if (!Number.isFinite(startLine)) {
                throw `\`${linesString}\` is not a valid specification of a range $start..`;
            }
        } else {
            const match = /^([0-9]+)\.\.([0-9]+)$/.exec(linesString);
            let passed = match || false;
            if (passed) {
                startLine = Number(match[1]);
                endLine = Number(match[2]);
                passed = Number.isFinite(startLine) && Number.isFinite(endLine);
            }
            if (!passed) {
                throw `\`${linesString}\` is not a valid specification of a range $start..$end`;
            }
        }
    }
    return [path.resolve(path.dirname(filename), importedFilename), startLine, endLine];
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [
        vitePreprocess(),
        mdsvex({
            remarkPlugins: [remarkFrontmatter, remarkMath, remarkCms],
            rehypePlugins: [[rehypeCms, katex], rehypeKatexBox],
            highlight: {
                highlighter: async (code, lang, _, filename) => {
                    if (!code.includes('\n') && code.startsWith('{') && code.endsWith('}')) {
                        const [importedFilename, startLine, endLine] = parseImportString(
                            code.slice(1, -1),
                            filename,
                        );
                        const promise = new Promise((resolve, reject) =>
                            fs.readFile(importedFilename, { encoding: 'utf8' }, (err, data) =>
                                err ? reject(err) : resolve(data),
                            ),
                        );
                        code = await promise;
                        if (typeof startLine == 'number' && typeof endLine == 'number') {
                            code = code
                                .split('\n')
                                .slice(startLine, endLine + 1)
                                .join('\n');
                        } else if (typeof startLine == 'number') {
                            code = code.split('\n').slice(startLine).join('\n');
                        } else if (typeof endLine == 'number') {
                            code = code
                                .split('\n')
                                .slice(0, endLine + 1)
                                .join('\n');
                        }
                        lang = path.extname(importedFilename).slice(1);
                    }
                    const html = escapeSvelte(
                        highlighter.codeToHtml(code, {
                            lang: lang || 'text',
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
