import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// STRATA runs on its own port so it never collides with other local projects
export default defineConfig({
  plugins: [react()],
  server: { port: 5288, strictPort: true, open: true },
  preview: { port: 5289, strictPort: true, open: true },
})
