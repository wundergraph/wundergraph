import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ['@wundergraph/swr', '@wundergraph/sdk/client'],
		esbuildOptions: {
			target: 'es2020',
		},
	},
});
