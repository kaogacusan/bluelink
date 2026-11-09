// Production server: serves the built app and the API on one port.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApi } from './api.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(root, '..', 'dist')
const port = Number(process.env.PORT) || 3000

const api = createApi({
  dataDir: process.env.DATA_DIR || path.join(root, '..', '.data'),
  // Dev mode shows sign-in codes on screen, seeds fake people, and opens the admin page to everyone.
  // It must never run on the real site, so NODE_ENV=production always turns it off.
  dev: process.env.SHOW_DEV_CODES === '1' && process.env.NODE_ENV !== 'production',
})

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return api.handle(req, res)
  const url = decodeURIComponent(req.url.split('?')[0])
  let file = path.join(dist, path.normalize(url).replace(/^(\.\.[/\\])+/, ''))
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html')
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream')
  if (url.startsWith('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  fs.createReadStream(file).pipe(res)
})

server.listen(port, () => console.log(`blueLink is running on http://localhost:${port}`))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => (api.close(), process.exit(0)))
