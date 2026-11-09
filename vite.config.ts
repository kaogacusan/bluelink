import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { createApi } from './server/api.js'

// Runs the API inside the Vite dev server, so one command starts everything.
function blueLinkServer(): Plugin {
  return {
    name: 'bluelink-server',
    configureServer(server) {
      const api = createApi({ dataDir: path.resolve(process.env.DATA_DIR || '.data'), dev: true })
      server.middlewares.use((req, res, next) => (req.url?.startsWith('/api/') ? api.handle(req, res) : next()))
      server.httpServer?.on('close', () => api.close())
    },
  }
}

export default defineConfig({
  plugins: [react(), blueLinkServer()],
  server: { host: '127.0.0.1' },
})
