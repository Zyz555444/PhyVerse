import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['node_modules', 'e2e', 'dist'],
  },
  ssr: {
    noExternal: ['@dimforge/rapier3d'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dimforge/rapier3d': path.resolve(
        __dirname,
        './node_modules/@dimforge/rapier3d/rapier.js'
      ),
    },
  },
})
