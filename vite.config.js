import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/pollinations-api': {
        target: 'https://text.pollinations.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pollinations-api/, ''),
        secure: true,
      },
    },
  },
})
