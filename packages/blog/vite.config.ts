import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import cms from 'cms/plugin';

export default defineConfig({
	plugins: [cms(), sveltekit()],
	optimizeDeps: {
		exclude: ['cms'],
	},
});
