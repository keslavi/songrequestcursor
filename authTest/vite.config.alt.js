import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alternative configuration using port 8080
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true
  }
}) 