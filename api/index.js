// Vercel entry: runs the same API as server/prod.js inside one serverless function.
// Vercel only lets functions write to /tmp, so data lives there and resets when the function restarts.
import { createApi } from '../server/api.js'

const api = createApi({ dataDir: process.env.DATA_DIR || '/tmp/bluelink', dev: false })

export default function handler(req, res) {
  return api.handle(req, res)
}
