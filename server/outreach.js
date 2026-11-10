import fs from 'node:fs'

// Org outreach: every Ateneo org we email, split between the team.
// The list lives in outreach-orgs.json. Add an org there (or on the page) and it goes to whoever has the fewest.
export const TEAM = ['Atasha Gaddi', 'Mandy Bustamante', 'Marcus Yan', 'Mary Mantala', 'Patrick Ong', 'Prince Wagan']

export const STATUSES = ['Not sent', 'Sent', 'Followed up', 'Yes', 'No', 'No reply']

// Clusters show in this order (COA-M names, plus groups outside COA). Anything else goes after them.
// The list: SY 2026-27 registered orgs, with emails and pages from each org's RecWeek 2026 page.
export const CLUSTERS = [
  'Student government',
  'School council',
  'Alumni & career',
  'Business Cluster',
  'Science & Technology Cluster',
  'Publication',
  'Analysis & Discourse Cluster',
  'Media & Creative Arts Cluster',
  'Sector Based Cluster',
  'Health & Environment Cluster',
  'Intercultural Relations Cluster',
  'Performing Arts Cluster',
  'Faith Formation Cluster',
  'Student Arms and Groups',
  'Newly Accredited Organizations',
  'Independent (LIONS)',
  'Independent (OSA-registered)',
  'Varsity & performing',
  'Other',
]

export const TEMPLATE = {
  subject: 'BlueLink for [org]',
  body: `Hi [org]!

I'm [your name], from the team behind BlueLink (bluelinkph.com). It's a networking app made by Ateneans, only for Ateneo students, alumni, and faculty.

Your org can have its own page there. You can post events and openings, take member sign-ups, and get found by alumni and professors. Alumni and faculty join free.

Would [org] like a page? Reply here and we'll help you set it up.

Thanks!
[your name]
BlueLink

Made by Ateneans. Not an official Ateneo de Manila University service.`,
}

export const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

const clusterRank = (c) => (CLUSTERS.includes(c) ? CLUSTERS.indexOf(c) : CLUSTERS.length)

// Top picks first, then by cluster, so each person gets a fair mix of both.
export const byPriority = (a, b) => (a.tier || 2) - (b.tier || 2) || clusterRank(a.cluster) - clusterRank(b.cluster) || a.name.localeCompare(b.name)

// The person with the fewest orgs of this tier gets the next one; ties go to the fewest overall, then team order.
export function pickOwner(orgs, tier) {
  const count = (name, t) => orgs.filter((o) => o.owner === name && (t === undefined || (o.tier || 2) === t)).length
  return [...TEAM].sort((a, b) => count(a, tier) - count(b, tier) || count(a) - count(b) || TEAM.indexOf(a) - TEAM.indexOf(b))[0]
}

function readList(file) {
  try {
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(rows) ? rows.filter((r) => r && r.name) : []
  } catch {
    return []
  }
}

// Adds orgs from the list that we do not have yet. Never touches progress the team already logged.
export function syncOutreach(db, file) {
  db.outreach ||= {}
  const have = Object.values(db.outreach)
  const fresh = readList(file)
    .map((r) => ({ ...r, id: slug(r.name), tier: r.tier === 1 ? 1 : 2 }))
    .filter((r) => r.id && !db.outreach[r.id])
    .sort(byPriority)
  for (const r of fresh) {
    const o = {
      id: r.id,
      name: String(r.name).trim(),
      short: String(r.short || '').trim(),
      cluster: String(r.cluster || 'Other').trim(),
      email: String(r.email || '').trim(),
      page: String(r.page || '').trim(),
      tier: r.tier,
      why: String(r.why || '').trim(),
      owner: pickOwner(have, r.tier),
      status: 'Not sent',
      sentOn: '',
      note: String(r.note || '').trim(),
      at: 0,
      by: '',
    }
    db.outreach[o.id] = o
    have.push(o)
  }
  return fresh.length
}

// Follow up 3 working days after the email went out.
export function followUpOn(sentOn) {
  if (!sentOn) return ''
  const d = new Date(sentOn + 'T00:00:00Z')
  let left = 3
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) left--
  }
  return d.toISOString().slice(0, 10)
}
