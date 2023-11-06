import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		name: 'default-testapp',
		root: './test',
		environment: 'node',
	},
});
