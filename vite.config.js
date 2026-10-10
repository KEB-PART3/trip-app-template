import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// DEMO BUILD — the PWA plugin is deliberately absent. A service worker on a
// hosted demo would cache the bundle and serve a stale app after every update.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true }
})
