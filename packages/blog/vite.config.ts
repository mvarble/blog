import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { cms, cmsInjection } from 'cms/plugin';

export default defineConfig({
    plugins: [cms(), sveltekit(), cmsInjection()],
    optimizeDeps: {
        exclude: ['cms'],
    },
});
