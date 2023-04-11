import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: {
    include: ['@wundergraph/svelte-query', '@wundergraph/sdk/client'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
})
