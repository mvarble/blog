import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { createCms } from '@mvarble/mesearch-cms';
import { blogPreset } from '@mvarble/mesearch-cms/presets/blog';
import { markdownPreprocessors } from '@mvarble/mesearch-markdown';

// The content layer: every post, sequence, statement and citation under
// `src/content`, kept current while the dev server runs. Routes query it
// through `$cms`; the markdown pipeline asks it for references and macros.
const cms = createCms({ preset: blogPreset(), virtualId: '$cms', label: 'cms' });

export default defineConfig({
    plugins: [
        ...cms.vite(),
        sveltekit({
            compilerOptions: {
                // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
            },
            adapter: adapter(),
            preprocess: markdownPreprocessors({
                remarkPlugins: [cms.remark],
                // Macros fold from the base table down the tree of documents:
                // sequence, chapter, page, statement.
                katex: { macros: cms.macrosFor, label: 'cms' },
                mathBox: { liftTags: true },
            }),
            extensions: ['.svelte', '.svx', '.md'],
        }),
    ],
    assetsInclude: ['**/*.glb'],
});
