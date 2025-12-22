import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { cmsSource, cmsInjection } from 'cms/vite';

export default defineConfig({
    plugins: [cmsSource(), sveltekit(), cmsInjection()],
    assetsInclude: ['**/*.glb'],
    server: {
        fs: { allow: [path.join(process.cwd(), 'katex.js')] },
    },
    optimizeDeps: {
        exclude: ['cms'],
    },
});
