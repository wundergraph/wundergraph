import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ['@wundergraph/sdk', '@wundergraph/sdk/internal', '@wundergraph/sdk/client'],
	},
	build: {
		commonjsOptions: {
			include: [/sdk\/dist\//, /node_modules/, /@wundergraph/],
		},
	},
});
