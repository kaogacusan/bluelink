// Moves the owner's local account to the live site, so localhost and bluelinkph.com show the same profile.
// The two sites have different secrets, so the same email has a different uid on each. We match by email.
//
//   node server/owner.js export <localDataDir> <bundleDir>   (on your computer)
//   node server/owner.js import <liveDataDir> <bundleDir>    (on the server, with the app stopped)
//
// It copies the profile, photo, banner, portfolio, and the businesses and orgs you run.
// It skips demo people, links, messages, posts, and payments. Those stay where they are.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const OWNER = 'prince.alpherson.wagan@student.ateneo.edu'
// Fields that belong to the live site, not to the profile.
const KEEP_LIVE = ['createdAt', 'seenAt']

// Same as uidFor in api.js.
const uidIn = (dataDir, email) => {
  const secret = fs.readFileSync(path.join(dataDir, 'secret'), 'utf8').trim()
  return crypto.createHmac('sha256', secret).update('uid:' + email).digest('base64url').slice(0, 20)
}
const readDb = (dataDir) => JSON.parse(fs.readFileSync(path.join(dataDir, 'db.json'), 'utf8'))
const copy = (from, to) => {
  if (!fs.existsSync(from)) return
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}
const isDemo = (uid) => String(uid).startsWith('demo-')

function exportOwner(dataDir, out) {
  const uid = uidIn(dataDir, OWNER)
  const db = readDb(dataDir)
  const user = db.users[uid]
  if (!user?.name) throw new Error(`No local account for ${OWNER}.`)
  const orgs = Object.values(db.orgs).filter((o) => o.members.some((m) => m.uid === uid && m.role === 'admin'))

  fs.rmSync(out, { recursive: true, force: true })
  const file = (...p) => path.join(out, 'files', ...p)
  copy(path.join(dataDir, 'photos', `${uid}.jpg`), file('photo.jpg'))
  copy(path.join(dataDir, 'banners', `${uid}.jpg`), file('banner.jpg'))
  for (const g of user.gallery || []) copy(path.join(dataDir, 'gallery', `${uid}-${g.id}.jpg`), file('gallery', `${g.id}.jpg`))
  for (const o of orgs) {
    copy(path.join(dataDir, 'logos', `${o.id}.jpg`), file('logos', `${o.id}.jpg`))
    copy(path.join(dataDir, 'covers', `${o.id}.jpg`), file('covers', `${o.id}.jpg`))
    for (const g of o.gallery || []) copy(path.join(dataDir, 'gallery', 'orgs', `${o.id}-${g.id}.jpg`), file('orgs', `${o.id}-${g.id}.jpg`))
  }
  const following = Object.values(db.orgs).filter((o) => o.followers.includes(uid)).map((o) => o.id)
  fs.writeFileSync(path.join(out, 'owner.json'), JSON.stringify({ email: OWNER, uid, user, orgs, following }))
  console.log(`Exported ${user.name}: ${(user.gallery || []).length} portfolio items, ${orgs.length} orgs or businesses.`)
}

function importOwner(dataDir, from) {
  const { email, uid: oldUid, user, orgs, following } = JSON.parse(fs.readFileSync(path.join(from, 'owner.json'), 'utf8'))
  const uid = uidIn(dataDir, email)
  const dbFile = path.join(dataDir, 'db.json')
  const db = fs.existsSync(dbFile) ? readDb(dataDir) : {}
  db.users ||= {}
  db.orgs ||= {}
  if (fs.existsSync(dbFile)) fs.copyFileSync(dbFile, `${dbFile}.before-owner`)

  const live = db.users[uid] || {}
  const next = { ...user }
  for (const k of KEEP_LIVE) if (k in live) next[k] = live[k]
  next.uid = uid
  next.payment = live.payment ?? null
  // Never cut a membership short.
  next.until = Math.max(live.until || 0, user.until || 0)
  if ((live.until || 0) > (user.until || 0)) next.via = live.via
  db.users[uid] = next

  const file = (...p) => path.join(from, 'files', ...p)
  copy(file('photo.jpg'), path.join(dataDir, 'photos', `${uid}.jpg`))
  copy(file('banner.jpg'), path.join(dataDir, 'banners', `${uid}.jpg`))
  for (const g of user.gallery || []) copy(file('gallery', `${g.id}.jpg`), path.join(dataDir, 'gallery', `${uid}-${g.id}.jpg`))

  const swap = (x) => (x === oldUid ? uid : x)
  for (const o of orgs) {
    const prev = db.orgs[o.id]
    // Keep real people who joined on the live site. Drop demo people.
    const members = [
      ...o.members.filter((m) => !isDemo(m.uid)).map((m) => ({ ...m, uid: swap(m.uid) })),
      ...(prev?.members || []).filter((m) => m.uid !== uid && !o.members.some((x) => swap(x.uid) === m.uid)),
    ]
    db.orgs[o.id] = {
      ...o,
      members,
      applications: prev?.applications || [],
      followers: [...new Set([...(prev?.followers || []), ...o.followers.filter((x) => !isDemo(x)).map(swap)])],
      createdBy: swap(o.createdBy),
      createdAt: prev?.createdAt || o.createdAt,
    }
    copy(file('logos', `${o.id}.jpg`), path.join(dataDir, 'logos', `${o.id}.jpg`))
    copy(file('covers', `${o.id}.jpg`), path.join(dataDir, 'covers', `${o.id}.jpg`))
    for (const g of o.gallery || []) copy(file('orgs', `${o.id}-${g.id}.jpg`), path.join(dataDir, 'gallery', 'orgs', `${o.id}-${g.id}.jpg`))
  }
  for (const id of following) if (db.orgs[id] && !db.orgs[id].followers.includes(uid)) db.orgs[id].followers.push(uid)

  const tmp = dbFile + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db))
  fs.renameSync(tmp, dbFile)
  console.log(`Imported ${user.name} into the live site.`)
}

const [cmd, dataDir, bundle] = process.argv.slice(2)
if (cmd === 'export' && dataDir && bundle) exportOwner(dataDir, bundle)
else if (cmd === 'import' && dataDir && bundle) importOwner(dataDir, bundle)
else {
  console.error('Use: node server/owner.js export|import <dataDir> <bundleDir>')
  process.exit(1)
}
