import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// STRATA runs on its own port so it never collides with other local projects.
// Two entries: the production experience (/) and the Behance case study (/behance/).
export default defineConfig({
  plugins: [react()],
  server: { port: 5288, strictPort: true, open: true },
  preview: { port: 5289, strictPort: true, open: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        behance: resolve(import.meta.dirname, 'behance/index.html'),
      },
    },
  },
})
