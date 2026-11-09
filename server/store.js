import fs from 'node:fs'
import path from 'node:path'

const empty = () => ({ users: {}, orgs: {}, posts: [], payments: [], codes: {}, settings: {}, links: {}, messages: {}, reads: {}, blocks: {}, reports: [] })

// A small JSON file database. Good for the first few thousand users; swap for Postgres later.
export function openStore(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  let data = empty()
  try {
    data = { ...data, ...JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch {}

  let timer = null
  function flush() {
    clearTimeout(timer)
    timer = null
    const tmp = file + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data))
    fs.renameSync(tmp, file)
  }

  return {
    data,
    save() {
      if (!timer) timer = setTimeout(flush, 250)
    },
    flush,
  }
}
