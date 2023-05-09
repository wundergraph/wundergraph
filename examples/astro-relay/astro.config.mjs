import { defineConfig } from 'astro/config';
import relay from 'vite-plugin-relay';

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [relay],
	},
});
