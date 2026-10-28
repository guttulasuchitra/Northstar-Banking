import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local development, send API requests to the two Spring Boot services.
// If you run the backend in Docker with different host ports, update these targets.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/customers': { target: 'http://localhost:8081', changeOrigin: true },
      '/api/accounts': { target: 'http://localhost:8082', changeOrigin: true },
    },
  },
})
