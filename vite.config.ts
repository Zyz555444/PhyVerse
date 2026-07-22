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
        manualChunks(id) {
          // Core 3D rendering engine (largest single dependency)
          if (id.includes('three') || id.includes('@react-three/fiber')) {
            return 'three-core'
          }
          // Utility 3D helpers (orbit controls, shaders, etc)
          if (id.includes('@react-three/drei')) {
            return 'three-drei'
          }
          // Post-processing effects (bloom, SSAO, etc)
          if (id.includes('@react-three/postprocessing')) {
            return 'three-postprocessing'
          }
          // Physics engine WASM
          if (id.includes('@dimforge/rapier3d')) {
            return 'physics-vendor'
          }
          // Charts (only used in data panels)
          if (id.includes('recharts')) {
            return 'charts-vendor'
          }
          // Animation library
          if (id.includes('framer-motion')) {
            return 'motion-vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    allowedHosts: ['.monkeycode-ai.online'],
  },
})
