import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In the browser (no Tauri), the editor talks to `report-cli serve` through /api.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  // Inline (empty) PostCSS config: stops Vite from picking up the legacy web app's
  // Tailwind config in the repo root, whose dependencies aren't installed here.
  css: { postcss: {} },
  server: {
    port: 1420,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:7878' },
  },
  build: { target: 'es2022', outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1500 },
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'] },
} as never)
