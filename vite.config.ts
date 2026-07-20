import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy 3D libraries into separate chunks
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'physics-vendor': ['@dimforge/rapier3d'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    allowedHosts: ['.monkeycode-ai.online'],
  },
})
