import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All frontend API calls go through the API Gateway.
      '/api': { target: 'http://localhost:8088', changeOrigin: true },
    },
  },
})
