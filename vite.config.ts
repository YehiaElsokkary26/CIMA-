import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        // 127.0.0.1 rather than localhost: avoids Node trying IPv6 (::1) first on Windows.
        target: `http://127.0.0.1:${process.env.PORT || 3001}`,
        changeOrigin: true,
        configure: (proxy) => {
          // When the API isn't running, answer with a clear 503 instead of a bare 500.
          proxy.on('error', (_err, _req, res) => {
            const out = res as import('http').ServerResponse
            if (out.headersSent || typeof out.writeHead !== 'function') return
            out.writeHead(503, { 'Content-Type': 'application/json' })
            out.end(JSON.stringify({
              message: 'The Klaket API isn’t running. Start it with `npm run dev` (it runs the app and the API together).',
              code: 'API_DOWN',
            }))
          })
        },
      },
    },
  },
})
