import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { canSignUp, signupRole } from '../shared/school.js'
import { BANNERS, KINDS, LEVELS, OPEN_TO, ORG_CATEGORIES, REPORT_REASONS, ROLES, schoolOf } from '../shared/options.js'
import { FREE_ROLES, MEMBERSHIP, LIFETIME_UNTIL, PLANS, planById, isLifetime, earlyAccessOpen } from '../shared/membership.js'
import { LEGAL } from '../shared/legal.js'
import { openStore } from './store.js'
import { createDemo } from './seed.js'
import { CLUSTERS, STATUSES, TEAM, TEMPLATE, byPriority, followUpOn, pickOwner, slug, syncOutreach } from './outreach.js'

const CODE_TTL = 10 * 60_000
const HOUR = 60 * 60_000
const DAY = 24 * HOUR
const REPORTS_TO_HIDE = 3

const OPEN_IDS = new Set(OPEN_TO.map((o) => o.id))
const OPEN_MATCH = Object.fromEntries(OPEN_TO.map((o) => [o.id, o.match]))
const BANNER_IDS = new Set(BANNERS.map((b) => b.id))
const ROLE_IDS = new Set(ROLES.map((r) => r.id))
const LEVEL_IDS = new Set(LEVELS.map((l) => l.id))
const KIND_IDS = new Set(KINDS.map((k) => k.id))
const REASON_IDS = new Set(REPORT_REASONS.map((r) => r.id))
const CATEGORY_IDS = new Set(ORG_CATEGORIES.map((c) => c.id))

const line = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const block = (v, max) =>
  String(v ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
const pairKey = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`)
const newId = () => crypto.randomBytes(9).toString('base64url')
// juan.dela.cruz@student.ateneo.edu -> "Juan Dela Cruz". Only a starting guess; people can fix it.
const nameFromEmail = (email) =>
  String(email)
    .split('@')[0]
    .split(/[._-]+/)
    .filter((w) => /^[a-z]+$/i.test(w))
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

class Fail extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function createApi({ dataDir, dev = false }) {
  fs.mkdirSync(dataDir, { recursive: true })
  const photoDir = path.join(dataDir, 'photos')
  const logoDir = path.join(dataDir, 'logos')
  const coverDir = path.join(dataDir, 'covers')
  const bannerDir = path.join(dataDir, 'banners')
  const galleryDir = path.join(dataDir, 'gallery')
  const orgGalleryDir = path.join(galleryDir, 'orgs')
  fs.mkdirSync(photoDir, { recursive: true })
  fs.mkdirSync(orgGalleryDir, { recursive: true })
  fs.mkdirSync(logoDir, { recursive: true })
  fs.mkdirSync(coverDir, { recursive: true })
  fs.mkdirSync(bannerDir, { recursive: true })

  const secretFile = path.join(dataDir, 'secret')
  let secret
  try {
    secret = fs.readFileSync(secretFile, 'utf8').trim()
  } catch {
    secret = crypto.randomBytes(32).toString('hex')
    fs.writeFileSync(secretFile, secret, { mode: 0o600 })
  }

  const store = openStore(path.join(dataDir, 'db.json'))
  const db = store.data
  const save = store.save

  // Old "open to" tags move to the new ones. "Internships" meant seeking for students and hiring for everyone else.
  const OLD_OPEN = { mentor: ['seek-mentor'], mentoring: ['advice'], recruit: ['hire-job'], hiring: ['hire-intern', 'hire-job'] }
  for (const u of Object.values(db.users)) {
    const ids = (u.openTo || []).flatMap((id) => (id === 'intern' ? [u.role === 'student' ? 'seek-intern' : 'hire-intern'] : OLD_OPEN[id] || [id]))
    // Drop ids we no longer offer, so old profiles do not show raw ids.
    u.openTo = [...new Set(ids)].filter((id) => OPEN_IDS.has(id))
  }
  // Asks are gone. Old asks become plain posts.
  for (const p of db.posts) if (p.kind === 'ask') p.kind = 'post'
  // The school comes from the course, so fill it in for people who never picked one.
  for (const u of Object.values(db.users)) if (schoolOf(u.course)) u.school = schoolOf(u.course)
  // ADVO is a company, so it lives under Businesses, not Orgs.
  if (db.orgs.advo) db.orgs.advo.type = 'business'
  if (db.orgs.advo?.name === 'ADVO') db.orgs.advo.name = 'ADVO Technologies'

  // ---- identity: we keep a keyed hash of the email, never the email itself
  const hmac = (value) => crypto.createHmac('sha256', secret).update(value).digest('base64url')
  const uidFor = (email) => hmac('uid:' + email).slice(0, 20)
  const tokenFor = (uid) => `${uid}.${hmac('tok:' + uid).slice(0, 32)}`
  // Admins come from ADMIN_EMAILS. In dev anyone can open the admin page, but still has to pay.
  const adminUids = new Set(
    String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .map(uidFor),
  )
  const isSiteAdmin = (uid) => dev || adminUids.has(uid)
  // Prince keeps the space banner he had. Everyone else starts plain gray.
  const spaceBanner = new Set(['prince.alpherson.wagan@student.ateneo.edu'].map(uidFor))
  const googleClientId = process.env.GOOGLE_CLIENT_ID || ''

  const uidFromToken = (token) => {
    const [uid, sig] = String(token || '').split('.')
    if (!uid || !sig) return null
    const expected = Buffer.from(hmac('tok:' + uid).slice(0, 32))
    const given = Buffer.from(sig)
    return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? uid : null
  }

  // ---- Google sign-in: check the ID token against Google's public keys
  let googleCerts = { at: 0, keys: [] }
  async function googleKeys() {
    if (googleCerts.keys.length && Date.now() - googleCerts.at < HOUR) return googleCerts.keys
    const r = await fetch('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(5000) })
    googleCerts = { at: Date.now(), keys: (await r.json()).keys || [] }
    return googleCerts.keys
  }

  async function verifyGoogle(idToken) {
    const bad = new Fail(400, 'Google sign-in did not work. Try again.')
    if (!googleClientId) throw new Fail(400, 'Google sign-in is not set up yet.')
    const parts = String(idToken || '').split('.')
    if (parts.length !== 3) throw bad
    const [h, p, s] = parts
    let header, payload
    try {
      header = JSON.parse(Buffer.from(h, 'base64url').toString())
      payload = JSON.parse(Buffer.from(p, 'base64url').toString())
    } catch {
      throw bad
    }
    const jwk = header.alg === 'RS256' && (await googleKeys()).find((k) => k.kid === header.kid)
    if (!jwk) throw bad
    const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), crypto.createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'))
    const issuer = ['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)
    if (!ok || !issuer || payload.aud !== googleClientId || payload.exp * 1000 < Date.now() || !payload.email_verified) throw bad
    return payload
  }

  // A new person's Google photo becomes their first profile photo.
  const googlePictures = new Map()
  async function savePicture(uid, url) {
    googlePictures.delete(uid)
    try {
      if (!new URL(url).hostname.endsWith('.googleusercontent.com')) return
      const r = await fetch(url.replace(/=s\d+(-c)?$/, '') + '=s400-c', { signal: AbortSignal.timeout(5000) })
      const bytes = Buffer.from(await r.arrayBuffer())
      if (bytes.length > 400_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return
      fs.writeFileSync(path.join(photoDir, `${uid}.jpg`), bytes)
      db.users[uid].photo = Date.now()
      save()
    } catch {}
  }

  // ---- live updates (server-sent events). The app refetches when it hears about a change.
  const streams = new Map()
  function notify(uid, type, extra = {}) {
    const data = `data: ${JSON.stringify({ type, ...extra })}\n\n`
    for (const res of streams.get(uid) || []) res.write(data)
  }
  const beat = setInterval(() => {
    for (const set of streams.values()) for (const res of set) res.write(': hi\n\n')
  }, 25_000)

  // ---- rate limits
  const hits = new Map()
  function limit(key, max, windowMs) {
    const now = Date.now()
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs)
    if (list.length >= max) throw new Fail(429, 'Slow down a little, then try again.')
    list.push(now)
    hits.set(key, list)
  }

  // ---- views
  const isBlocked = (a, b) => db.blocks[a]?.includes(b) || db.blocks[b]?.includes(a)
  const visible = (viewer, u) => !!u?.name && !isBlocked(viewer, u.uid)
  const linkOf = (a, b) => db.links[pairKey(a, b)]

  function statusOf(viewer, other) {
    if (viewer === other) return 'self'
    const l = linkOf(viewer, other)
    if (!l) return 'none'
    if (l.status === 'accepted') return 'connected'
    return l.from === viewer ? 'sent' : 'received'
  }

  const connectionsOf = (uid) =>
    Object.values(db.links)
      .filter((l) => l.status === 'accepted' && (l.from === uid || l.to === uid))
      .map((l) => (l.from === uid ? l.to : l.from))
      .filter((o) => db.users[o]?.name)

  function card(u) {
    return {
      uid: u.uid,
      name: u.name,
      role: u.role,
      school: u.school,
      course: u.course,
      level: u.level || '',
      year: u.year,
      headline: u.headline,
      openTo: u.openTo,
      photo: u.photo ? `/api/photo/${u.uid}?v=${u.photo}` : null,
    }
  }

  const galleryItem = (uid) => (g) => ({ id: g.id, title: g.title, caption: g.caption, link: g.link, featured: !!g.featured, url: `/api/gallery/${uid}/${g.id}?v=${g.at}` })
  // How a portfolio looks. The owner picks the style and the title.
  const PORTFOLIO_STYLES = ['gallery', 'stage', 'list']
  const lookOf = (x) => ({ style: PORTFOLIO_STYLES.includes(x.portfolio?.style) ? x.portfolio.style : 'gallery', title: x.portfolio?.title || '' })
  // The profile banner: a picture's URL, a drawn banner's id, or null for plain gray.
  // u.banner is a time when they added a picture, a drawn banner's id, or '' for none.
  function bannerOf(u) {
    const b = u.banner ?? (spaceBanner.has(u.uid) ? 'space' : '')
    return typeof b === 'number' ? `/api/banner/${u.uid}?v=${b}` : BANNER_IDS.has(b) ? b : null
  }
  // highlight: the org or business shown first and biggest on the profile.
  const full = (u) => ({ ...card(u), banner: bannerOf(u), about: u.about, skills: u.skills, highlight: u.highlight || '', gallery: (u.gallery || []).map(galleryItem(u.uid)), portfolio: lookOf(u), createdAt: u.createdAt })

  // ---- membership: two plans, one tier. Everyone inside gets the same app.
  function membershipOf(uid) {
    const u = db.users[uid]
    const last = u?.payment ? db.payments.find((p) => p.id === u.payment) : null
    const admin = adminUids.has(uid)
    const free = admin || FREE_ROLES.includes(u?.role)
    return {
      active: free || (u?.until || 0) > Date.now(),
      until: u?.until || 0,
      via: admin ? 'admin' : free ? 'free' : u?.via || null,
      status: last?.status || null,
      ref: last?.ref || '',
      lifetime: !free && isLifetime(u?.until),
    }
  }

  // ---- orgs
  const orgRole = (o, uid) => o.members.find((m) => m.uid === uid)?.role ?? null
  const isAdmin = (o, uid) => orgRole(o, uid) === 'admin'
  const orgLogo = (o) => (o.logo ? `/api/logo/${o.id}?v=${o.logo}` : null)
  const orgCover = (o) => (o.cover ? `/api/cover/${o.id}?v=${o.cover}` : null)
  const orgGalleryItem = (oid) => (g) => ({ id: g.id, title: g.title, caption: g.caption, link: g.link, featured: !!g.featured, url: `/api/org-gallery/${oid}/${g.id}?v=${g.at}` })
  const orgMini = (o) => ({ id: o.id, name: o.name, short: o.short, type: o.type === 'business' ? 'business' : 'org', logo: orgLogo(o), cover: orgCover(o), verified: !!o.verified })

  function orgCard(o, viewer) {
    return {
      ...orgMini(o),
      category: o.category,
      about: o.about,
      recruiting: o.recruiting,
      members: o.members.filter((m) => db.users[m.uid]?.name).length,
      followers: o.followers.length,
      myRole: orgRole(o, viewer),
      following: o.followers.includes(viewer),
      applied: o.applications.some((a) => a.uid === viewer),
    }
  }

  function orgFull(o, viewer) {
    const admin = isAdmin(o, viewer)
    return {
      ...orgCard(o, viewer),
      links: o.links,
      question: o.question,
      gallery: (o.gallery || []).map(orgGalleryItem(o.id)),
      portfolio: lookOf(o),
      createdAt: o.createdAt,
      people: o.members
        .filter((m) => visible(viewer, db.users[m.uid]) || m.uid === viewer)
        .map((m) => ({ ...card(db.users[m.uid]), orgRole: m.role, title: m.title || '' })),
      applications: admin
        ? o.applications.filter((a) => visible(viewer, db.users[a.uid])).map((a) => ({ user: card(db.users[a.uid]), answer: a.answer, at: a.at }))
        : [],
    }
  }

  const orgsOf = (uid) =>
    Object.values(db.orgs)
      .filter((o) => orgRole(o, uid))
      .map((o) => ({ ...orgMini(o), category: o.category, myRole: orgRole(o, uid), title: o.members.find((m) => m.uid === uid).title || '' }))

  function postView(p, viewer) {
    const org = p.org ? db.orgs[p.org] : null
    return {
      id: p.id,
      kind: p.kind,
      org: org ? orgMini(org) : null,
      canDelete: p.uid === viewer || (org ? isAdmin(org, viewer) : false),
      text: p.text,
      event: p.event || null,
      at: p.at,
      author: card(db.users[p.uid]),
      mine: p.uid === viewer,
      likes: p.likes.length,
      liked: p.likes.includes(viewer),
      going: p.going.length,
      isGoing: p.going.includes(viewer),
      comments: p.comments
        .filter((c) => visible(viewer, db.users[c.uid]))
        .map((c) => ({ id: c.id, text: c.text, at: c.at, author: card(db.users[c.uid]), mine: c.uid === viewer })),
    }
  }

  // How good a match someone is: a want that meets their give counts most, then same course and school.
  function score(me, u) {
    let s = 0
    for (const id of u.openTo) if (OPEN_MATCH[id].some((m) => me.openTo.includes(m))) s += 2
    if (me.school && me.school === u.school) s += 1
    if (me.course && u.course && me.course.toLowerCase() === u.course.toLowerCase()) s += 2
    if (Date.now() - (u.seenAt || 0) < 7 * 24 * HOUR) s += 1
    return s
  }

  function inboxOf(uid) {
    const requests = []
    const sent = []
    const threads = []
    for (const [key, l] of Object.entries(db.links)) {
      if (l.from !== uid && l.to !== uid) continue
      const other = db.users[l.from === uid ? l.to : l.from]
      if (!visible(uid, other)) continue
      if (l.status === 'pending') {
        ;(l.from === uid ? sent : requests).push({ user: card(other), note: l.note, at: l.at })
        continue
      }
      const msgs = db.messages[key] || []
      const last = msgs[msgs.length - 1]
      const readAt = db.reads[uid]?.[key] || 0
      threads.push({
        user: card(other),
        last: last ? { text: last.text, at: last.at, mine: last.from === uid } : null,
        unread: msgs.filter((m) => m.from !== uid && m.at > readAt).length,
        at: last?.at || l.acceptedAt,
      })
    }
    requests.sort((a, b) => b.at - a.at)
    sent.sort((a, b) => b.at - a.at)
    threads.sort((a, b) => b.at - a.at)
    return { requests, sent, threads }
  }

  // ---- actions the demo people also use
  function acceptLink(l) {
    l.status = 'accepted'
    l.acceptedAt = Date.now()
    const key = pairKey(l.from, l.to)
    // The note they sent with the request becomes the first message.
    if (l.note) db.messages[key] = [{ id: newId(), from: l.from, text: l.note, at: l.at }, ...(db.messages[key] || [])]
    save()
    notify(l.from, 'inbox')
    notify(l.to, 'inbox')
  }

  function sendMessage(from, to, text) {
    const key = pairKey(from, to)
    const msg = { id: newId(), from, text, at: Date.now() }
    ;(db.messages[key] ||= []).push(msg)
    if (db.messages[key].length > 2000) db.messages[key] = db.messages[key].slice(-2000)
    save()
    notify(to, 'message', { from })
    notify(to, 'inbox')
    return msg
  }

  function requestLink(from, to, note) {
    db.links[pairKey(from, to)] = { from, to, status: 'pending', note, at: Date.now() }
    save()
    notify(to, 'inbox')
  }

  const demo = dev ? createDemo({ db, save, newId, acceptLink, sendMessage, requestLink, uidFor, photoDir, logoDir, coverDir, galleryDir, orgGalleryDir }) : null
  demo?.seed()

  // ---- profile input
  function readProfile(body, prev = {}) {
    const name = line(body.name ?? prev.name, 60)
    if (name.length < 2) throw new Fail(400, 'Add your name.')
    const role = ROLE_IDS.has(body.role) ? body.role : prev.role || 'student'
    const year = Number(body.year)
    const course = line(body.course, 80)
    const seen = new Set()
    return {
      name,
      role,
      // Faculty type a department, so the school only changes when the course does.
      school: schoolOf(course) || (course === prev.course ? prev.school || '' : ''),
      course,
      // Students give a year level. Alumni give the year they finished.
      level: role === 'student' && LEVEL_IDS.has(body.level) ? body.level : '',
      year: role === 'alum' && Number.isInteger(year) && year >= 1960 && year <= 2035 ? year : null,
      headline: line(body.headline, 140),
      about: block(body.about, 1200),
      openTo: [...new Set((Array.isArray(body.openTo) ? body.openTo : []).filter((id) => OPEN_IDS.has(id)))],
      skills: (Array.isArray(body.skills) ? body.skills : [])
        .map((s) => line(s, 32))
        .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
        .slice(0, 12),
    }
  }

  function readEvent(e = {}) {
    const title = line(e.title, 100)
    const date = /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : ''
    if (!title) throw new Fail(400, 'Give your event a name.')
    if (!date) throw new Fail(400, 'Pick a date for your event.')
    return { title, date, time: /^\d{2}:\d{2}$/.test(e.time) ? e.time : '', place: line(e.place, 80) }
  }

  const getPost = (id) => {
    const p = db.posts.find((x) => x.id === id && !x.hidden)
    if (!p) throw new Fail(404, 'This post is gone.')
    return p
  }

  const getUser = (viewer, uid) => {
    const u = db.users[uid]
    if (!visible(viewer, u)) throw new Fail(404, 'We could not find this person.')
    return u
  }

  // ---- routes
  const routes = []
  const route = (method, pattern, access, fn, maxBody = 16_000) =>
    routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), access, fn, maxBody })

  // Sign in with a code sent to your email. Students and faculty use their school email; alumni use any.
  const codes = new Map()

  route('POST', '/api/auth/start', 'open', ({ body }) => {
    const email = String(body.email || '').trim().toLowerCase()
    if (!canSignUp(email, body.role)) throw new Fail(400, signupRole(body.role)?.hint || 'Use your Ateneo email.')
    const prev = codes.get(email)
    if (prev && Date.now() - prev.sent < 20_000) throw new Fail(429, 'Wait a few seconds, then ask for a new code.')
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
    codes.set(email, { code, exp: Date.now() + CODE_TTL, tries: 0, sent: Date.now() })
    // TODO: send the code by email (needs an email provider). Until then it shows in dev.
    // Never log it outside dev: the log would hold an email and a working sign-in code.
    if (dev) console.log(`[bluelink] sign-in code for ${email}: ${code}`)
    return { ok: true, ...(dev ? { devCode: code } : {}) }
  })

  route('POST', '/api/auth/verify', 'open', ({ body }) => {
    const email = String(body.email || '').trim().toLowerCase()
    const entry = codes.get(email)
    if (!entry || entry.exp < Date.now()) throw new Fail(400, 'This code expired. Ask for a new one.')
    entry.tries += 1
    if (entry.tries > 5) {
      codes.delete(email)
      throw new Fail(429, 'Too many tries. Ask for a new code.')
    }
    if (entry.code !== String(body.code || '').replace(/\D/g, '')) throw new Fail(400, 'That code is not right. Try again.')
    codes.delete(email)
    const uid = uidFor(email)
    return { token: tokenFor(uid), isNew: !db.users[uid]?.name, prefill: { name: nameFromEmail(email) } }
  })

  // Sign in with Google. Ateneo email runs on Google, so this is one tap and gives us a name and photo.
  route('POST', '/api/auth/google', 'open', async ({ body }) => {
    const g = await verifyGoogle(body.credential)
    const email = String(g.email || '').toLowerCase()
    if (!canSignUp(email, body.role)) throw new Fail(400, signupRole(body.role)?.hint || 'Use your Ateneo Google account.')
    const uid = uidFor(email)
    const isNew = !db.users[uid]?.name
    if (isNew && g.picture) googlePictures.set(uid, g.picture)
    return { token: tokenFor(uid), isNew, prefill: { name: line(g.name, 60) || nameFromEmail(email) } }
  })

  route('GET', '/api/config', 'open', () => ({ googleClientId, plans: PLANS, dev }))

  // ---- membership
  route('GET', '/api/membership', 'profile', ({ uid }) => ({
    membership: membershipOf(uid),
    gcash: { name: db.settings.gcashName || '', number: db.settings.gcashNumber || '' },
    dev,
  }))

  route('POST', '/api/membership/pay', 'profile', ({ uid, body }) => {
    limit('pay:' + uid, 6, HOUR)
    const ref = String(body.ref || '').replace(/\D/g, '')
    if (ref.length < 10 || ref.length > 20) throw new Fail(400, 'Type the reference number from your GCash receipt.')
    if (db.payments.some((p) => p.ref === ref && p.status !== 'rejected')) throw new Fail(400, 'This reference number was already used.')
    const plan = planById(body.plan)
    const u = db.users[uid]
    const pay = { id: newId(), uid, ref, plan: plan.id, amount: plan.price, at: Date.now(), status: 'pending', prevUntil: u.until || 0, prevVia: u.via || null }
    db.payments.push(pay)
    // Trust first: you get in right away. An admin checks the payment later.
    u.until = plan.days ? Math.max(u.until || 0, Date.now()) + plan.days * DAY : LIFETIME_UNTIL
    u.via = 'gcash'
    u.payment = pay.id
    save()
    for (const a of adminUids) notify(a, 'admin')
    return { membership: membershipOf(uid) }
  })

  route('POST', '/api/membership/code', 'profile', ({ uid, body }) => {
    limit('code:' + uid, 10, HOUR)
    let code = line(body.code, 40).toUpperCase().replace(/\s/g, '')
    // Card codes are XXX-XXX. The dash is optional when you type it.
    if (/^[A-Z0-9]{6}$/.test(code) && !db.codes[code]) code = `${code.slice(0, 3)}-${code.slice(3)}`
    const c = db.codes[code]
    if (!c) throw new Fail(400, 'That code does not work. Check the spelling.')
    if (c.used.includes(uid)) throw new Fail(400, 'You already used this code.')
    if (c.used.length >= c.max) throw new Fail(400, 'This code is all used up.')
    c.used.push(uid)
    const u = db.users[uid]
    // A lifetime code makes the membership lifetime. Time from any other code adds on top of any time you already
    // have, so a paid voucher is never wasted.
    if (c.lifetime) u.until = LIFETIME_UNTIL
    else if (!isLifetime(u.until)) u.until = Math.max(u.until || 0, Date.now()) + (c.days ?? MEMBERSHIP.codeDays) * DAY
    u.via = 'code'
    u.payment = null
    save()
    return { membership: membershipOf(uid) }
  })

  // ---- admin
  route('GET', '/api/admin', 'admin', () => {
    const people = Object.values(db.users).filter((u) => u.name && !u.uid.startsWith('demo-'))
    const pending = db.payments.filter((p) => p.status === 'pending').sort((a, b) => a.at - b.at)
    const done = db.payments.filter((p) => p.status !== 'pending').sort((a, b) => b.at - a.at)
    const who = (uid) => (db.users[uid]?.name ? card(db.users[uid]) : null)
    return {
      stats: {
        people: people.length,
        members: people.filter((u) => membershipOf(u.uid).active).length,
        pending: pending.length,
        earned: db.payments.filter((p) => p.status === 'approved').reduce((s, p) => s + p.amount, 0),
      },
      payments: [...pending, ...done].slice(0, 100).map((p) => ({ id: p.id, ref: p.ref, amount: p.amount, at: p.at, status: p.status, user: who(p.uid) })),
      codes: Object.entries(db.codes).map(([code, c]) => ({ code, max: c.max, used: c.used.length, days: c.lifetime ? null : c.days ?? MEMBERSHIP.codeDays, lifetime: !!c.lifetime, createdAt: c.createdAt })),
      gcash: { name: db.settings.gcashName || '', number: db.settings.gcashNumber || '' },
      reports: db.reports
        .slice(-30)
        .reverse()
        .map((r) => ({
          at: r.at,
          reason: r.reason,
          note: r.note,
          from: who(r.from),
          against: who(r.against),
          post: r.postId ? db.posts.find((p) => p.id === r.postId)?.text.slice(0, 140) ?? '(deleted)' : null,
        })),
    }
  })

  route('POST', '/api/admin/payments/:id/:action', 'admin', ({ params }) => {
    const p = db.payments.find((x) => x.id === params.id)
    if (!p) throw new Fail(404, 'Payment not found.')
    if (params.action === 'approve') p.status = 'approved'
    else if (params.action === 'reject') {
      p.status = 'rejected'
      const u = db.users[p.uid]
      // Take back the time this payment gave.
      if (u && u.payment === p.id) {
        u.until = p.prevUntil
        u.via = p.prevVia
      }
      notify(p.uid, 'membership')
    } else throw new Fail(404, 'Not found.')
    p.reviewedAt = Date.now()
    save()
    return { ok: true }
  })

  route('POST', '/api/admin/codes', 'admin', ({ body }) => {
    const code = line(body.code, 24).toUpperCase()
    const max = Math.min(Math.max(Number(body.max) || 1, 1), 1000)
    if (!/^[A-Z0-9-]{3,24}$/.test(code)) throw new Fail(400, 'Use 3 to 24 letters, numbers, or dashes.')
    if (db.codes[code]) throw new Fail(400, 'That code already exists.')
    db.codes[code] = { max, used: [], days: MEMBERSHIP.codeDays, createdAt: Date.now() }
    save()
    return { ok: true }
  })

  // One-use codes for printed voucher cards. Each card gets its own code, so a code cannot be passed around.
  // plan 'life' makes lifetime codes (the ₱250 card); anything else makes 1-year codes (the ₱99 card).
  route('POST', '/api/admin/codes/batch', 'admin', ({ body }) => {
    const count = Math.min(Math.max(Number(body.count) || 0, 1), 500)
    const lifetime = body.plan === 'life'
    const days = lifetime ? null : MEMBERSHIP.codeDays
    const ABC = 'ACDEFGHJKMNPQRTUVWXY34679' // no 0/O, 1/I/L, 2/Z, 5/S, 8/B: easy to read off a card
    const made = []
    while (made.length < count) {
      const raw = Array.from(crypto.randomBytes(6), (b) => ABC[b % ABC.length]).join('')
      const code = `${raw.slice(0, 3)}-${raw.slice(3)}`
      if (db.codes[code]) continue
      db.codes[code] = { max: 1, used: [], days, lifetime, createdAt: Date.now() }
      made.push(code)
    }
    save()
    return { codes: made, plan: lifetime ? 'life' : 'year' }
  })

  route('POST', '/api/admin/codes/:code/delete', 'admin', ({ params }) => {
    delete db.codes[decodeURIComponent(params.code).toUpperCase()]
    save()
    return { ok: true }
  })

  route('POST', '/api/admin/settings', 'admin', ({ body }) => {
    db.settings.gcashName = line(body.gcashName, 60)
    db.settings.gcashNumber = line(body.gcashNumber, 20)
    save()
    return { ok: true }
  })

  // ---- org outreach: the team splits the emailing; everyone sees everyone's progress
  if (syncOutreach(db, new URL('./outreach-orgs.json', import.meta.url))) save()
  const outreachTemplate = () => ({ subject: db.settings.outreachSubject || TEMPLATE.subject, body: db.settings.outreachBody || TEMPLATE.body })
  const tellAdmins = () => {
    for (const uid of streams.keys()) if (isSiteAdmin(uid)) notify(uid, 'admin')
  }
  const touched = (o, uid) => {
    o.at = Date.now()
    o.by = db.users[uid]?.name || ''
    save()
    tellAdmins()
    return { ok: true }
  }
  const readOutreach = (o, body) => {
    if (body.name !== undefined && line(body.name, 120)) o.name = line(body.name, 120)
    if (body.short !== undefined) o.short = line(body.short, 30)
    if (body.cluster !== undefined) o.cluster = line(body.cluster, 40) || 'Other'
    if (body.email !== undefined) o.email = line(body.email, 120).toLowerCase()
    if (body.page !== undefined) o.page = line(body.page, 300)
    if (body.note !== undefined) o.note = block(body.note, 1000)
    if (body.owner !== undefined && TEAM.includes(body.owner)) o.owner = body.owner
    if (body.tier !== undefined) o.tier = body.tier === 1 ? 1 : 2
  }

  route('GET', '/api/admin/outreach', 'admin', () => ({
    team: TEAM,
    statuses: STATUSES,
    clusters: CLUSTERS,
    template: outreachTemplate(),
    orgs: Object.values(db.outreach)
      .sort(byPriority)
      .map((o) => ({ ...o, followUp: o.status === 'Sent' ? followUpOn(o.sentOn) : '' })),
  }))

  route('POST', '/api/admin/outreach', 'admin', ({ uid, body }) => {
    const name = line(body.name, 120)
    if (name.length < 2) throw new Fail(400, 'Type the org name.')
    const id = slug(name)
    if (db.outreach[id]) throw new Fail(400, 'That org is already on the list.')
    const o = { id, name, short: '', cluster: 'Other', email: '', page: '', tier: 2, why: '', owner: '', status: 'Not sent', sentOn: '', note: '', at: 0, by: '' }
    readOutreach(o, body)
    if (!o.owner) o.owner = pickOwner(Object.values(db.outreach), o.tier)
    db.outreach[id] = o
    return touched(o, uid)
  })

  route('POST', '/api/admin/outreach/template', 'admin', ({ uid, body }) => {
    const subject = line(body.subject, 160)
    const text = block(body.body, 4000)
    if (!subject || !text) throw new Fail(400, 'The email needs a subject and a message.')
    db.settings.outreachSubject = subject
    db.settings.outreachBody = text
    save()
    tellAdmins()
    return { ok: true, by: db.users[uid]?.name || '' }
  })

  route('POST', '/api/admin/outreach/:id', 'admin', ({ uid, params, body }) => {
    const o = db.outreach[params.id]
    if (!o) throw new Fail(404, 'Org not found.')
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) throw new Fail(400, 'Pick a status.')
      o.status = body.status
      if (body.status === 'Not sent') o.sentOn = ''
      else if (!o.sentOn) o.sentOn = new Date(Date.now() + 8 * HOUR).toISOString().slice(0, 10) // Manila date
    }
    readOutreach(o, body)
    return touched(o, uid)
  })

  route('POST', '/api/admin/outreach/:id/delete', 'admin', ({ params }) => {
    delete db.outreach[params.id]
    save()
    tellAdmins()
    return { ok: true }
  })

  route('GET', '/api/live', 'auth', ({ uid, req, res }) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
    res.write('retry: 3000\n\n')
    let set = streams.get(uid)
    if (!set) streams.set(uid, (set = new Set()))
    set.add(res)
    req.on('close', () => {
      set.delete(res)
      if (!set.size) streams.delete(uid)
    })
  })

  // ---- me
  route('GET', '/api/me', 'auth', ({ uid }) => {
    const u = db.users[uid]
    // Early access: anyone with a profile who is not a member yet gets lifetime for free. No payment, no code.
    if (u?.name && earlyAccessOpen() && !membershipOf(uid).active) {
      u.until = LIFETIME_UNTIL
      u.via = 'early'
      save()
    }
    return {
      user: u?.name ? full(u) : null,
      connections: u?.name ? connectionsOf(uid).length : 0,
      orgs: u?.name ? orgsOf(uid) : [],
      membership: membershipOf(uid),
      isAdmin: isSiteAdmin(uid),
    }
  })

  route('POST', '/api/me', 'auth', async ({ uid, body }) => {
    const prev = db.users[uid]
    const isNew = !prev?.name
    // No profile without a clear yes: 18 or older, and agrees to this version of the Terms and Privacy Notice.
    if (isNew && (body.adult !== true || body.agree !== LEGAL.version))
      throw new Fail(400, `Check both boxes to join. BlueLink is only for people ${LEGAL.minAge} and older.`)
    const consent = isNew ? { consent: { version: LEGAL.version, at: Date.now() } } : {}
    // Only an org or business you are in can be your highlight.
    const pick = body.highlight === undefined ? prev?.highlight || '' : String(body.highlight)
    const highlight = Object.hasOwn(db.orgs, pick) && orgRole(db.orgs[pick], uid) ? pick : ''
    const u = { ...(prev || { uid, photo: 0, createdAt: Date.now() }), ...readProfile(body, prev), highlight, ...consent, updatedAt: Date.now() }
    db.users[uid] = u
    save()
    if (isNew && googlePictures.has(uid)) await savePicture(uid, googlePictures.get(uid))
    if (isNew) demo?.onJoin(uid)
    return { user: full(u) }
  })

  route(
    'POST',
    '/api/me/photo',
    // Not 'member': new people add a photo during setup, before they join.
    'profile',
    ({ uid, body }) => {
      const u = db.users[uid]
      const file = path.join(photoDir, `${uid}.jpg`)
      if (body.data === null) {
        fs.rmSync(file, { force: true })
        u.photo = 0
      } else {
        const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''))
        const bytes = m ? Buffer.from(m[1], 'base64') : null
        if (!bytes || bytes.length > 250_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Fail(400, 'That photo did not work. Try another one.')
        fs.writeFileSync(file, bytes)
        u.photo = Date.now()
      }
      save()
      return { user: full(u) }
    },
    400_000,
  )

  // A drawn banner by its id, '' for plain gray, or a picture of your own.
  route(
    'POST',
    '/api/me/banner',
    'member',
    ({ uid, body }) => {
      const u = db.users[uid]
      const file = path.join(bannerDir, `${uid}.jpg`)
      if (body.data) {
        const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data))
        const bytes = m ? Buffer.from(m[1], 'base64') : null
        if (!bytes || bytes.length > 700_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Fail(400, 'That banner did not work. Try another one.')
        fs.writeFileSync(file, bytes)
        u.banner = Date.now()
      } else {
        const id = String(body.template || '')
        if (id && !BANNER_IDS.has(id)) throw new Fail(400, 'Pick one of the banners.')
        fs.rmSync(file, { force: true })
        u.banner = id
      }
      save()
      return { user: full(u) }
    },
    1_000_000,
  )

  route('GET', '/api/banner/:uid', 'open', ({ params, res }) => {
    const u = db.users[params.uid]
    const file = path.join(bannerDir, `${params.uid}.jpg`)
    if (typeof u?.banner !== 'number' || !/^[\w-]+$/.test(params.uid) || !fs.existsSync(file)) throw new Fail(404, 'No banner.')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    fs.createReadStream(file).pipe(res)
  })

  route('GET', '/api/photo/:uid', 'open', ({ params, res }) => {
    const u = db.users[params.uid]
    const file = path.join(photoDir, `${params.uid}.jpg`)
    if (!u?.photo || !/^[\w-]+$/.test(params.uid) || !fs.existsSync(file)) throw new Fail(404, 'No photo.')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    fs.createReadStream(file).pipe(res)
  })

  // ---- portfolio: up to 12 pictures of work, on a profile or an org page
  const GALLERY_MAX = 12
  const galleryFile = (uid, id) => path.join(galleryDir, `${uid}-${id}.jpg`)
  const orgGalleryFile = (oid, id) => path.join(orgGalleryDir, `${oid}-${id}.jpg`)

  const HIGHLIGHT_MAX = 2

  // The words on a piece of work: title, what it is, and a link.
  function workText(body) {
    const title = line(body.title, 80)
    if (!title) throw new Fail(400, 'Give it a title.')
    const link = line(body.link, 200)
    if (link && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(link)) throw new Fail(400, 'Use a full link, like https://example.com.')
    return { title, caption: line(body.caption, 160), link }
  }

  // Checks a new picture, writes it, and adds it to the list.
  function addWork(list, body, fileFor) {
    if (list.length >= GALLERY_MAX) throw new Fail(400, `You can add up to ${GALLERY_MAX}. Remove one first.`)
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''))
    const bytes = m ? Buffer.from(m[1], 'base64') : null
    if (!bytes || bytes.length > 700_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Fail(400, 'That picture did not work. Try another one.')
    const item = { id: newId(), ...workText(body), at: Date.now() }
    fs.writeFileSync(fileFor(item.id), bytes)
    list.push(item)
  }

  function editWork(list, id, body) {
    const item = (list || []).find((g) => g.id === id)
    if (!item) throw new Fail(404, 'This picture is gone.')
    Object.assign(item, workText(body))
  }

  // Saves how a portfolio looks: the style, the title, the order, and up to 2 highlights.
  function arrange(x, body) {
    if (!PORTFOLIO_STYLES.includes(body.style)) throw new Fail(400, 'Pick a style.')
    const order = Array.isArray(body.order) ? body.order.map(String) : []
    const rank = (g) => (order.includes(g.id) ? order.indexOf(g.id) : order.length)
    x.gallery = [...(x.gallery || [])].sort((a, b) => rank(a) - rank(b))
    const picked = Array.isArray(body.featured) ? body.featured.map(String) : []
    const top = new Set(x.gallery.filter((g) => picked.includes(g.id)).slice(0, HIGHLIGHT_MAX).map((g) => g.id))
    for (const g of x.gallery) {
      if (top.has(g.id)) g.featured = true
      else delete g.featured
    }
    x.portfolio = { style: body.style, title: line(body.title, 40) }
  }

  route(
    'POST',
    '/api/me/gallery',
    'member',
    ({ uid, body }) => {
      limit('gallery:' + uid, 40, HOUR)
      const u = db.users[uid]
      u.gallery ||= []
      addWork(u.gallery, body, (id) => galleryFile(uid, id))
      save()
      return { user: full(u) }
    },
    1_000_000,
  )

  route('POST', '/api/me/gallery/:id/edit', 'member', ({ uid, params, body }) => {
    const u = db.users[uid]
    editWork(u.gallery, params.id, body)
    save()
    return { user: full(u) }
  })

  route('POST', '/api/me/portfolio', 'member', ({ uid, body }) => {
    const u = db.users[uid]
    arrange(u, body)
    save()
    return { user: full(u) }
  })

  route('POST', '/api/me/gallery/:id/remove', 'member', ({ uid, params }) => {
    const u = db.users[uid]
    const item = (u.gallery || []).find((g) => g.id === params.id)
    if (!item) throw new Fail(404, 'This picture is gone.')
    u.gallery = u.gallery.filter((g) => g !== item)
    fs.rmSync(galleryFile(uid, item.id), { force: true })
    save()
    return { user: full(u) }
  })

  route('GET', '/api/gallery/:uid/:id', 'open', ({ params, res }) => {
    const u = db.users[params.uid]
    const ok = /^[\w-]+$/.test(params.uid) && /^[\w-]+$/.test(params.id) && u?.gallery?.some((g) => g.id === params.id)
    const file = galleryFile(params.uid, params.id)
    if (!ok || !fs.existsSync(file)) throw new Fail(404, 'No picture.')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    fs.createReadStream(file).pipe(res)
  })

  // Your right to a copy of your data (Data Privacy Act): everything we keep about you, in one file.
  route('GET', '/api/me/export', 'auth', ({ uid }) => {
    limit('export:' + uid, 10, HOUR)
    const u = db.users[uid]
    if (!u) throw new Fail(404, 'No account.')
    const name = (id) => db.users[id]?.name || '(deleted account)'
    const links = Object.entries(db.links).filter(([, l]) => l.from === uid || l.to === uid)
    return {
      exportedAt: new Date().toISOString(),
      note: 'Everything BlueLink keeps about you. We keep a coded version of your email, not the email.',
      profile: { ...u, photo: u.photo ? `/api/photo/${uid}` : null },
      posts: db.posts.filter((p) => p.uid === uid).map((p) => ({ id: p.id, kind: p.kind, text: p.text, at: p.at, event: p.event ?? null })),
      comments: db.posts.flatMap((p) => p.comments.filter((c) => c.uid === uid).map((c) => ({ postId: p.id, text: c.text, at: c.at }))),
      connections: links.map(([, l]) => ({ with: name(l.from === uid ? l.to : l.from), status: l.status ?? null, at: l.at })),
      messages: links.flatMap(([key, l]) => (db.messages[key] || []).map((m) => ({ with: name(l.from === uid ? l.to : l.from), fromYou: m.from === uid, text: m.text, at: m.at }))),
      orgs: Object.values(db.orgs)
        .filter((o) => o.members.some((m) => m.uid === uid) || o.followers.includes(uid))
        .map((o) => ({ name: o.name, role: o.members.find((m) => m.uid === uid)?.role ?? 'follower' })),
      payments: db.payments.filter((p) => p.uid === uid).map((p) => ({ ref: p.ref, amount: p.amount, at: p.at, status: p.status })),
      blocked: (db.blocks[uid] || []).map(name),
      reportsYouMade: db.reports.filter((r) => r.from === uid).map((r) => ({ reason: r.reason, note: r.note, at: r.at })),
    }
  })

  route('POST', '/api/me/delete', 'auth', ({ uid }) => {
    for (const g of db.users[uid]?.gallery || []) fs.rmSync(galleryFile(uid, g.id), { force: true })
    delete db.users[uid]
    db.posts = db.posts.filter((p) => p.uid !== uid)
    for (const p of db.posts) {
      p.comments = p.comments.filter((c) => c.uid !== uid)
      p.likes = p.likes.filter((x) => x !== uid)
      p.going = p.going.filter((x) => x !== uid)
    }
    for (const [key, l] of Object.entries(db.links)) {
      if (l.from !== uid && l.to !== uid) continue
      delete db.links[key]
      delete db.messages[key]
      notify(l.from === uid ? l.to : l.from, 'inbox')
    }
    for (const o of Object.values(db.orgs)) {
      o.members = o.members.filter((m) => m.uid !== uid)
      o.applications = o.applications.filter((a) => a.uid !== uid)
      o.followers = o.followers.filter((x) => x !== uid)
    }
    delete db.reads[uid]
    delete db.blocks[uid]
    fs.rmSync(path.join(photoDir, `${uid}.jpg`), { force: true })
    fs.rmSync(path.join(bannerDir, `${uid}.jpg`), { force: true })
    save()
    return { ok: true }
  })

  // ---- feed
  route('GET', '/api/feed', 'member', ({ uid, query }) => {
    const kind = query.get('kind')
    const author = query.get('author')
    const org = query.get('org')
    const before = Number(query.get('before')) || Infinity
    const posts = []
    for (let i = db.posts.length - 1; i >= 0 && posts.length < 20; i--) {
      const p = db.posts[i]
      if (p.hidden || p.at >= before) continue
      if (kind && p.kind !== kind) continue
      if (author && (p.uid !== author || p.org)) continue
      if (org && p.org !== org) continue
      if (!visible(uid, db.users[p.uid])) continue
      posts.push(postView(p, uid))
    }
    return { posts, more: posts.length === 20 }
  })

  route('POST', '/api/posts', 'member', ({ uid, body }) => {
    limit('post:' + uid, 8, HOUR)
    const kind = KIND_IDS.has(body.kind) ? body.kind : 'post'
    const text = block(body.text, 2000)
    const event = kind === 'event' ? readEvent(body.event) : null
    if (!text && !event) throw new Fail(400, 'Write something first.')
    const org = body.orgId ? db.orgs[body.orgId] : null
    if (body.orgId && (!org || !isAdmin(org, uid))) throw new Fail(403, 'Only org admins can post for the org.')
    const p = { id: newId(), uid, org: org?.id ?? null, kind, text, event, at: Date.now(), likes: [], going: [], comments: [] }
    db.posts.push(p)
    save()
    return { post: postView(p, uid) }
  })

  route('POST', '/api/posts/:id/like', 'member', ({ uid, params }) => {
    const p = getPost(params.id)
    p.likes = p.likes.includes(uid) ? p.likes.filter((x) => x !== uid) : [...p.likes, uid]
    save()
    return { post: postView(p, uid) }
  })

  route('POST', '/api/posts/:id/going', 'member', ({ uid, params }) => {
    const p = getPost(params.id)
    if (p.kind !== 'event') throw new Fail(400, 'This is not an event.')
    p.going = p.going.includes(uid) ? p.going.filter((x) => x !== uid) : [...p.going, uid]
    save()
    return { post: postView(p, uid) }
  })

  route('POST', '/api/posts/:id/comments', 'member', ({ uid, params, body }) => {
    limit('comment:' + uid, 10, 60_000)
    const p = getPost(params.id)
    const text = block(body.text, 600)
    if (!text) throw new Fail(400, 'Write something first.')
    p.comments.push({ id: newId(), uid, text, at: Date.now() })
    if (p.comments.length > 300) p.comments = p.comments.slice(-300)
    save()
    return { post: postView(p, uid) }
  })

  route('POST', '/api/posts/:id/comments/:cid/delete', 'member', ({ uid, params }) => {
    const p = getPost(params.id)
    p.comments = p.comments.filter((c) => !(c.id === params.cid && (c.uid === uid || p.uid === uid)))
    save()
    return { post: postView(p, uid) }
  })

  route('POST', '/api/posts/:id/delete', 'member', ({ uid, params }) => {
    const p = getPost(params.id)
    if (!postView(p, uid).canDelete) throw new Fail(403, 'You can only delete your own posts.')
    db.posts.splice(db.posts.indexOf(p), 1)
    save()
    return { ok: true }
  })

  route('GET', '/api/events', 'member', ({ uid }) => {
    const today = manilaToday()
    const events = db.posts
      .filter((p) => p.kind === 'event' && !p.hidden && p.event.date >= today && visible(uid, db.users[p.uid]))
      .sort((a, b) => (a.event.date + a.event.time).localeCompare(b.event.date + b.event.time))
      .slice(0, 4)
      .map((p) => postView(p, uid))
    return { events }
  })

  // ---- people
  route('GET', '/api/people', 'member', ({ uid, query }) => {
    const me = db.users[uid]
    const q = line(query.get('q'), 60).toLowerCase()
    const open = query.get('open')
    const school = query.get('school')
    const role = query.get('role')
    // You are in the list too, always first, so you can see how your card looks.
    const people = Object.values(db.users)
      .filter((u) => visible(uid, u))
      .filter((u) => !open || u.openTo.includes(open))
      .filter((u) => !school || u.school === school)
      .filter((u) => !role || u.role === role)
      .map((u) => {
        let s = score(me, u)
        if (q) {
          const name = u.name.toLowerCase()
          const rest = [u.course, u.headline, u.about, ...u.skills].join(' ').toLowerCase()
          if (name.startsWith(q) || name.includes(' ' + q)) s += 20
          else if (name.includes(q)) s += 12
          else if (rest.includes(q)) s += 6
          else return null
        }
        return { u, s }
      })
      .filter(Boolean)
      .sort((a, b) => (b.u.uid === uid) - (a.u.uid === uid) || b.s - a.s || (b.u.seenAt || 0) - (a.u.seenAt || 0))
      .slice(0, 60)
      .map(({ u }) => ({ ...card(u), banner: bannerOf(u), status: statusOf(uid, u.uid), highlight: u.highlight || '', orgs: orgsOf(u.uid) }))
    return { people }
  })

  route('GET', '/api/suggest', 'member', ({ uid }) => {
    const me = db.users[uid]
    const people = Object.values(db.users)
      .filter((u) => u.uid !== uid && visible(uid, u) && !linkOf(uid, u.uid))
      .map((u) => ({ u, s: score(me, u) }))
      .sort((a, b) => b.s - a.s || (b.u.seenAt || 0) - (a.u.seenAt || 0))
      .slice(0, 4)
      .map(({ u }) => ({ ...card(u), status: 'none' }))
    return { people }
  })

  route('GET', '/api/people/:uid', 'member', ({ uid, params }) => {
    const u = getUser(uid, params.uid)
    const status = statusOf(uid, u.uid)
    const l = linkOf(uid, u.uid)
    const theirs = connectionsOf(u.uid)
    const mine = new Set(connectionsOf(uid))
    return {
      user: full(u),
      status,
      note: l?.status === 'pending' ? l.note : '',
      connections: theirs.length,
      mutual: theirs.filter((x) => mine.has(x)).length,
      orgs: orgsOf(u.uid),
    }
  })

  // ---- connections
  route('POST', '/api/links/:uid', 'member', ({ uid, params, body }) => {
    limit('link:' + uid, 30, HOUR)
    const other = getUser(uid, params.uid)
    if (other.uid === uid) throw new Fail(400, 'That is you.')
    const l = linkOf(uid, other.uid)
    if (l?.status === 'accepted') return { status: 'connected' }
    if (l && l.from === other.uid) {
      acceptLink(l)
      return { status: 'connected' }
    }
    if (l) return { status: 'sent' }
    requestLink(uid, other.uid, block(body.note, 400))
    demo?.onRequest(uid, other.uid)
    return { status: 'sent' }
  })

  route('POST', '/api/links/:uid/accept', 'member', ({ uid, params }) => {
    const l = linkOf(uid, params.uid)
    if (!l || l.status !== 'pending' || l.to !== uid) throw new Fail(400, 'This request is gone.')
    acceptLink(l)
    return { status: 'connected' }
  })

  // Ignore a request, take back your own, or remove a connection.
  route('POST', '/api/links/:uid/remove', 'member', ({ uid, params }) => {
    const key = pairKey(uid, params.uid)
    if (db.links[key]) {
      delete db.links[key]
      save()
      notify(params.uid, 'inbox')
    }
    return { status: 'none' }
  })

  // ---- messages
  route('GET', '/api/inbox', 'member', ({ uid }) => inboxOf(uid))

  route('GET', '/api/badges', 'member', ({ uid }) => {
    const { requests, threads } = inboxOf(uid)
    return { inbox: requests.length + threads.filter((t) => t.unread).length }
  })

  route('GET', '/api/threads/:uid', 'member', ({ uid, params }) => {
    const other = getUser(uid, params.uid)
    const status = statusOf(uid, other.uid)
    const key = pairKey(uid, other.uid)
    const l = db.links[key]
    // A request reads like a chat: their note shows as the first message.
    const msgs = status === 'connected' ? (db.messages[key] || []).slice(-300) : status === 'received' && l.note ? [{ id: 'note', from: other.uid, text: l.note, at: l.at }] : []
    if (status === 'connected' && msgs.length) {
      ;(db.reads[uid] ||= {})[key] = Date.now()
      save()
    }
    return { user: card(other), status, messages: msgs.map((m) => ({ id: m.id, text: m.text, at: m.at, mine: m.from === uid })) }
  })

  route('POST', '/api/threads/:uid', 'member', ({ uid, params, body }) => {
    limit('msg:' + uid, 10, 5000)
    const other = getUser(uid, params.uid)
    const status = statusOf(uid, other.uid)
    if (status !== 'connected' && status !== 'received') throw new Fail(403, 'Connect first, then you can message.')
    const text = block(body.text, 2000)
    if (!text) throw new Fail(400, 'Write something first.')
    // Replying to a request accepts it.
    if (status === 'received') acceptLink(linkOf(uid, other.uid))
    const msg = sendMessage(uid, other.uid, text)
    ;(db.reads[uid] ||= {})[pairKey(uid, other.uid)] = msg.at
    demo?.onMessage(uid, other.uid)
    return { message: { id: msg.id, text: msg.text, at: msg.at, mine: true } }
  })

  // ---- orgs
  function readOrg(body) {
    const name = line(body.name, 80)
    if (name.length < 2) throw new Fail(400, body.type === 'business' ? 'Add your business name.' : 'Add your org name.')
    const url = (v) => {
      const s = line(v, 200)
      if (!s) return ''
      const full = /^https?:\/\//i.test(s) ? s : 'https://' + s
      try {
        return new URL(full).protocol.startsWith('http') ? full : ''
      } catch {
        return ''
      }
    }
    const links = body.links || {}
    return {
      name,
      short: line(body.short, 16),
      category: CATEGORY_IDS.has(body.category) ? body.category : 'other',
      about: block(body.about, 1500),
      links: { facebook: url(links.facebook), instagram: url(links.instagram), website: url(links.website) },
      recruiting: !!body.recruiting,
      question: line(body.question, 200),
    }
  }

  const getOrg = (id) => {
    const o = db.orgs[id]
    if (!o) throw new Fail(404, 'We could not find this org.')
    return o
  }
  const adminOf = (id, uid) => {
    const o = getOrg(id)
    if (!isAdmin(o, uid)) throw new Fail(403, 'Only org admins can do this.')
    return o
  }
  const notifyAdmins = (o) => o.members.filter((m) => m.role === 'admin').forEach((m) => notify(m.uid, 'org', { id: o.id }))

  route('GET', '/api/orgs', 'member', ({ uid, query }) => {
    const q = line(query.get('q'), 60).toLowerCase()
    const cat = query.get('cat')
    const show = query.get('show')
    const type = query.get('type') === 'business' ? 'business' : 'org'
    const orgs = Object.values(db.orgs)
      .filter((o) => (o.type === 'business' ? 'business' : 'org') === type)
      .filter((o) => !q || [o.name, o.short, o.about].join(' ').toLowerCase().includes(q))
      .filter((o) => !cat || o.category === cat)
      .filter((o) => show !== 'recruiting' || o.recruiting)
      .filter((o) => show !== 'mine' || orgRole(o, uid) || o.followers.includes(uid))
      .map((o) => orgCard(o, uid))
      .sort((a, b) => Number(b.recruiting) - Number(a.recruiting) || b.members + b.followers - (a.members + a.followers))
    return { orgs }
  })

  route('POST', '/api/orgs', 'member', ({ uid, body }) => {
    limit('org:' + uid, 3, 24 * HOUR)
    const o = { id: newId(), type: body.type === 'business' ? 'business' : 'org', ...readOrg(body), logo: 0, verified: false, members: [{ uid, role: 'admin', at: Date.now() }], applications: [], followers: [uid], createdBy: uid, createdAt: Date.now() }
    db.orgs[o.id] = o
    save()
    return { org: orgFull(o, uid) }
  })

  route('GET', '/api/orgs/:id', 'member', ({ uid, params }) => ({ org: orgFull(getOrg(params.id), uid) }))

  route('POST', '/api/orgs/:id', 'member', ({ uid, params, body }) => {
    const o = adminOf(params.id, uid)
    Object.assign(o, readOrg(body))
    save()
    return { org: orgFull(o, uid) }
  })

  route(
    'POST',
    '/api/orgs/:id/logo',
    'member',
    ({ uid, params, body }) => {
      const o = adminOf(params.id, uid)
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''))
      const bytes = m ? Buffer.from(m[1], 'base64') : null
      if (!bytes || bytes.length > 250_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Fail(400, 'That logo did not work. Try another one.')
      fs.writeFileSync(path.join(logoDir, `${o.id}.jpg`), bytes)
      o.logo = Date.now()
      save()
      return { org: orgFull(o, uid) }
    },
    400_000,
  )

  route(
    'POST',
    '/api/orgs/:id/cover',
    'member',
    ({ uid, params, body }) => {
      const o = adminOf(params.id, uid)
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''))
      const bytes = m ? Buffer.from(m[1], 'base64') : null
      if (!bytes || bytes.length > 700_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Fail(400, 'That banner did not work. Try another one.')
      fs.writeFileSync(path.join(coverDir, `${o.id}.jpg`), bytes)
      o.cover = Date.now()
      save()
      return { org: orgFull(o, uid) }
    },
    1_000_000,
  )

  route('GET', '/api/cover/:id', 'open', ({ params, res }) => {
    const o = db.orgs[params.id]
    const file = path.join(coverDir, `${params.id}.jpg`)
    if (!o?.cover || !/^[\w-]+$/.test(params.id) || !fs.existsSync(file)) throw new Fail(404, 'No banner.')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    fs.createReadStream(file).pipe(res)
  })

  route('GET', '/api/logo/:id', 'open', ({ params, res }) => {
    const o = db.orgs[params.id]
    const file = path.join(logoDir, `${params.id}.jpg`)
    if (!o?.logo || !/^[\w-]+$/.test(params.id) || !fs.existsSync(file)) throw new Fail(404, 'No logo.')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    fs.createReadStream(file).pipe(res)
  })

  route(
    'POST',
    '/api/orgs/:id/gallery',
    'member',
    ({ uid, params, body }) => {
      const o = adminOf(params.id, uid)
      limit('gallery:' + uid, 40, HOUR)
      o.gallery ||= []
      addWork(o.gallery, body, (id) => orgGalleryFile(o.id, id))
      save()
      return { org: orgFull(o, uid) }
    },
    1_000_000,
  )

  route('POST', '/api/orgs/:id/gallery/:gid/edit', 'member', ({ uid, params, body }) => {
    const o = adminOf(params.id, uid)
    editWork(o.gallery, params.gid, body)
    save()
    return { org: orgFull(o, uid) }
  })

  route('POST', '/api/orgs/:id/portfolio', 'member', ({ uid, params, body }) => {
    const o = adminOf(params.id, uid)
    arrange(o, body)
    save()
    return { org: orgFull(o, uid) }
  })

  route('POST', '/api/orgs/:id/gallery/:gid/remove', 'member', ({ uid, params }) => {
    const o = adminOf(params.id, uid)
    const item = (o.gallery || []).find((g) => g.id === params.gid)
    if (!item) throw new Fail(404, 'This picture is gone.')
    o.gallery = o.gallery.filter((g) => g !== item)
    fs.rmSync(orgGalleryFile(o.id, item.id), { force: true })
    save()
    return { org: orgFull(o, uid) }
  })

  route('GET', '/api/org-gallery/:id/:gid', 'open', ({ params, res }) => {
    const o = db.orgs[params.id]
    const ok = /^[\w-]+$/.test(params.id) && /^[\w-]+$/.test(params.gid) && o?.gallery?.some((g) => g.id === params.gid)
    const file = orgGalleryFile(params.id, params.gid)
    if (!ok || !fs.existsSync(file)) throw new Fail(404, 'No picture.')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    fs.createReadStream(file).pipe(res)
  })

  route('POST', '/api/orgs/:id/follow', 'member', ({ uid, params }) => {
    const o = getOrg(params.id)
    o.followers = o.followers.includes(uid) ? o.followers.filter((x) => x !== uid) : [...o.followers, uid]
    save()
    return { org: orgFull(o, uid) }
  })

  route('POST', '/api/orgs/:id/apply', 'member', ({ uid, params, body }) => {
    limit('apply:' + uid, 20, HOUR)
    const o = getOrg(params.id)
    if (orgRole(o, uid)) throw new Fail(400, 'You are already a member.')
    if (!o.recruiting) throw new Fail(400, 'This org is not taking members right now.')
    if (!o.applications.some((a) => a.uid === uid)) o.applications.push({ uid, answer: block(body.answer, 1500), at: Date.now() })
    if (!o.followers.includes(uid)) o.followers.push(uid)
    save()
    notifyAdmins(o)
    return { org: orgFull(o, uid) }
  })

  route('POST', '/api/orgs/:id/withdraw', 'member', ({ uid, params }) => {
    const o = getOrg(params.id)
    o.applications = o.applications.filter((a) => a.uid !== uid)
    save()
    return { org: orgFull(o, uid) }
  })

  route('POST', '/api/orgs/:id/applications/:uid/:answer', 'member', ({ uid, params }) => {
    const o = adminOf(params.id, uid)
    const app = o.applications.find((a) => a.uid === params.uid)
    if (!app) throw new Fail(400, 'This application is gone.')
    o.applications = o.applications.filter((a) => a !== app)
    if (params.answer === 'accept' && !orgRole(o, app.uid)) o.members.push({ uid: app.uid, role: 'member', at: Date.now() })
    save()
    notify(app.uid, 'org', { id: o.id })
    return { org: orgFull(o, uid) }
  })

  // Make someone an admin, make them a member again, or remove them.
  // A member's job title, like "Founder and CEO". Admins set anyone's. Members set their own.
  route('POST', '/api/orgs/:id/members/:uid/title', 'member', ({ uid, params, body }) => {
    const o = getOrg(params.id)
    if (params.uid !== uid && !isAdmin(o, uid)) throw new Fail(403, 'Only org admins can do this.')
    const m = o.members.find((x) => x.uid === params.uid)
    if (!m) throw new Fail(400, 'This person is not a member.')
    m.title = line(body.title, 60)
    save()
    return { org: orgFull(o, uid) }
  })

  route('POST', '/api/orgs/:id/members/:uid/:action', 'member', ({ uid, params }) => {
    const o = adminOf(params.id, uid)
    const m = o.members.find((x) => x.uid === params.uid)
    if (!m) throw new Fail(400, 'This person is not a member.')
    const admins = o.members.filter((x) => x.role === 'admin').length
    if (m.role === 'admin' && admins === 1 && params.action !== 'admin') throw new Fail(400, 'An org needs at least one admin.')
    if (params.action === 'admin') m.role = 'admin'
    else if (params.action === 'member') m.role = 'member'
    else if (params.action === 'remove') o.members = o.members.filter((x) => x !== m)
    else throw new Fail(404, 'Not found.')
    save()
    return { org: orgFull(o, uid) }
  })

  route('POST', '/api/orgs/:id/leave', 'member', ({ uid, params }) => {
    const o = getOrg(params.id)
    const admins = o.members.filter((x) => x.role === 'admin')
    if (admins.length === 1 && admins[0].uid === uid && o.members.length > 1) throw new Fail(400, 'Make someone else an admin first.')
    o.members = o.members.filter((x) => x.uid !== uid)
    if (!o.members.length) {
      delete db.orgs[o.id]
      db.posts = db.posts.filter((p) => p.org !== o.id)
    }
    save()
    return { ok: true }
  })

  route('POST', '/api/orgs/:id/delete', 'member', ({ uid, params }) => {
    const o = adminOf(params.id, uid)
    delete db.orgs[o.id]
    db.posts = db.posts.filter((p) => p.org !== o.id)
    fs.rmSync(path.join(logoDir, `${o.id}.jpg`), { force: true })
    fs.rmSync(path.join(coverDir, `${o.id}.jpg`), { force: true })
    for (const g of o.gallery || []) fs.rmSync(orgGalleryFile(o.id, g.id), { force: true })
    save()
    return { ok: true }
  })

  // ---- safety
  route('POST', '/api/report', 'member', ({ uid, body }) => {
    limit('report:' + uid, 20, HOUR)
    const reason = REASON_IDS.has(body.reason) ? body.reason : 'other'
    const postId = line(body.postId, 20) || null
    db.reports.push({ from: uid, against: line(body.uid, 24), postId, reason, note: line(body.note, 300), at: Date.now() })
    db.reports = db.reports.slice(-5000)
    if (postId) {
      const reporters = new Set(db.reports.filter((r) => r.postId === postId).map((r) => r.from))
      const p = db.posts.find((x) => x.id === postId)
      if (p && reporters.size >= REPORTS_TO_HIDE) p.hidden = true
    }
    save()
    return { ok: true }
  })

  route('POST', '/api/block', 'member', ({ uid, body }) => {
    const other = line(body.uid, 24)
    if (!db.users[other] || other === uid) throw new Fail(400, 'We could not find this person.')
    db.blocks[uid] = [...new Set([...(db.blocks[uid] || []), other])].slice(-1000)
    const key = pairKey(uid, other)
    if (db.links[key]) {
      delete db.links[key]
      notify(other, 'inbox')
    }
    save()
    return { ok: true }
  })

  // ---- http plumbing
  function reply(res, status, body) {
    if (res.headersSent) return res.end()
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(body))
  }

  function readJson(req, max) {
    return new Promise((resolve, reject) => {
      let size = 0
      const chunks = []
      req.on('data', (c) => {
        size += c.length
        if (size > max) reject(new Error('too big'))
        else chunks.push(c)
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}'))
        } catch (e) {
          reject(e)
        }
      })
      req.on('error', reject)
    })
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://local')
    for (const r of routes) {
      if (r.method !== req.method) continue
      const match = r.re.exec(url.pathname)
      if (!match) continue
      let uid = null
      if (r.access !== 'open') {
        const header = req.headers.authorization || ''
        uid = uidFromToken(header.startsWith('Bearer ') ? header.slice(7) : url.searchParams.get('token'))
        if (!uid) return reply(res, 401, { error: 'Please sign in again.' })
        const u = db.users[uid]
        if (r.access !== 'auth' && !u?.name) return reply(res, 403, { error: 'Finish your profile first.' })
        if (r.access === 'member' && !membershipOf(uid).active) return reply(res, 402, { error: 'Your membership is not active.' })
        if (r.access === 'admin' && !isSiteAdmin(uid)) return reply(res, 403, { error: 'Admins only.' })
        if (u && Date.now() - (u.seenAt || 0) > 5 * 60_000) {
          u.seenAt = Date.now()
          save()
        }
      }
      let body = {}
      if (req.method === 'POST') {
        try {
          body = await readJson(req, r.maxBody)
        } catch {
          return reply(res, 400, { error: 'Bad request.' })
        }
      }
      try {
        const out = await r.fn({ uid, body, params: match.groups || {}, query: url.searchParams, req, res })
        if (out !== undefined) reply(res, 200, out)
      } catch (e) {
        if (e instanceof Fail) return reply(res, e.status, { error: e.message })
        console.error('[bluelink]', e)
        reply(res, 500, { error: 'Something went wrong. Try again.' })
      }
      return
    }
    reply(res, 404, { error: 'Not found.' })
  }

  function close() {
    clearInterval(beat)
    for (const set of streams.values()) for (const res of set) res.end()
    store.flush()
  }

  return { handle, close }
}
