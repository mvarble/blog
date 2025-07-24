import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { cmsSource, cmsInjection } from 'cms/vite';

export default defineConfig({
    plugins: [cmsSource(), sveltekit(), cmsInjection()],
    optimizeDeps: {
        exclude: ['cms'],
    },
});
