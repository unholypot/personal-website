import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        classic: resolve(import.meta.dirname, 'classic/index.html'),
        portfolio: resolve(import.meta.dirname, 'portfolio/index.html'),
      },
    },
  },
})
