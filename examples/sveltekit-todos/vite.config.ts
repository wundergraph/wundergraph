import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { nodeLoaderPlugin } from '@vavite/node-loader/plugin';

export default defineConfig({
	plugins: [sveltekit(), nodeLoaderPlugin()],	
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
