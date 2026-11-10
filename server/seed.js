// Dev only: made-up demo people and posts, so the app is not empty while we build it.
// None of this runs in production (server/prod.js does not turn on dev mode).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets')

const H = 60 * 60_000
const D = 24 * H

const PEOPLE = [
  {
    uid: 'demo-migs',
    name: 'Migs Reyes',
    role: 'student',
    school: 'sose',
    course: 'BS Computer Science',
    level: '4',
    headline: 'Org president. Building a campus app on the side.',
    about: 'I run our tech org and I like helping freshies find their people. Ask me about orgs, hackathons, or getting your first tech internship.',
    openTo: ['advice', 'hire-intern'],
    skills: ['React', 'Product', 'Public speaking'],
  },
  {
    uid: 'demo-bea',
    name: 'Bea Santos',
    role: 'student',
    school: 'jgsom',
    course: 'BS Management',
    level: '3',
    headline: 'Interned at a bank last summer. Ask me about applications.',
    about: 'I applied to 20 internships and got 2. I learned a lot about what works. Happy to look at your cover letter.',
    openTo: ['seek-intern', 'advice'],
    skills: ['Finance', 'Excel', 'Cover letters'],
  },
  {
    uid: 'demo-paolo',
    name: 'Paolo Lim',
    role: 'alum',
    school: 'jgsom',
    course: 'BS Information Technology Entrepreneurship',
    year: 2021,
    headline: 'Product manager at a fintech. Happy to look at resumes.',
    about: 'I hire for product and design roles. I give back by doing resume reviews for Ateneans every month.',
    openTo: ['advice', 'hire-job'],
    skills: ['Product management', 'Hiring', 'Resumes'],
  },
  {
    uid: 'demo-sam',
    name: 'Sam Cruz',
    role: 'student',
    school: 'soh',
    course: 'AB Communication',
    level: '1',
    headline: 'Freshman. Looking for a Theo study group.',
    about: 'New here and still finding my way around. I write for the school paper.',
    openTo: ['seek-mentor'],
    skills: ['Writing', 'Video editing'],
  },
  {
    uid: 'demo-jill',
    name: 'Jill Tan',
    role: 'student',
    school: 'sose',
    course: 'BS Management Engineering',
    level: '4',
    headline: 'BS ME. Looking at operations and supply chain roles.',
    about: '',
    openTo: ['seek-intern', 'seek-job'],
    skills: ['Python', 'Operations research'],
  },
  {
    uid: 'demo-rafa',
    name: 'Rafa Mendoza',
    role: 'student',
    school: 'soss',
    course: 'AB Political Science',
    level: '3',
    headline: 'Debater. Our org is recruiting this month.',
    about: 'Policy nerd. Ask me about law school plans or student government.',
    openTo: ['seek-intern'],
    skills: ['Debate', 'Research'],
  },
  {
    uid: 'demo-ana',
    name: 'Ana Villanueva',
    role: 'faculty',
    school: 'sose',
    course: 'Department of Information Systems and Computer Science',
    year: null,
    headline: 'I teach data science. My office hours are open to all students.',
    about: 'Come talk to me about data careers, grad school, or research. You do not need to be in my class.',
    openTo: ['advice'],
    skills: ['Data science', 'Research', 'Grad school'],
  },
  {
    uid: 'demo-kyle',
    name: 'Kyle Ong',
    role: 'alum',
    school: 'sose',
    course: 'BS Computer Science',
    year: 2019,
    headline: 'Engineer at a startup in BGC. We take interns every summer.',
    about: '',
    openTo: ['hire-intern', 'advice'],
    skills: ['Backend', 'Startups'],
  },
  {
    uid: 'demo-nina',
    name: 'Nina Garcia',
    role: 'student',
    school: 'soss',
    course: 'BS Psychology',
    level: '3',
    headline: 'Running a mental health week. Looking for volunteers.',
    about: '',
    openTo: ['seek-mentor'],
    skills: ['Event planning', 'Peer support'],
  },
  {
    uid: 'demo-leo',
    name: 'Leo Bautista',
    role: 'student',
    school: 'soh',
    course: 'AB Interdisciplinary Studies',
    level: '4',
    headline: 'I shoot photos for school events. Let us work on something.',
    about: '',
    openTo: ['seek-job'],
    skills: ['Photography', 'Design'],
  },
]

const day = (offset) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(Date.now() + offset * D))

const POSTS = () => [
  { uid: 'demo-ana', kind: 'post', ago: 5 * D, text: 'Reminder: my office hours are open to any student, not just my classes. Thursdays, 2 to 4 PM. Come talk about data careers or grad school.' },
  { uid: 'demo-rafa', org: 'demo-debate', kind: 'opp', ago: 4 * D, text: 'We are recruiting. No experience needed, we will train you. Apply here on BlueLink before Friday.' },
  { uid: 'demo-bea', kind: 'post', ago: 3 * D, text: 'Small tip for internship apps: send your resume as a PDF named Lastname_Firstname_Resume. It sounds small, but recruiters notice.' },
  {
    uid: 'demo-nina',
    org: 'demo-pause',
    kind: 'event',
    ago: 2 * D,
    text: 'Drop by our booth for free coffee, a quiet corner, and people who will listen. Bring a friend.',
    event: { title: 'Pause: Mental Health Week booth', date: day(4), time: '10:00', place: 'Leong Hall lobby' },
  },
  {
    uid: 'demo-migs',
    org: 'demo-coders',
    kind: 'event',
    ago: 20 * H,
    text: 'Three seniors talk about how they got their first internship. Open to all courses. Free snacks.',
    event: { title: 'Tech talk: How I got my first internship', date: day(8), time: '16:30', place: 'Faber Hall' },
  },
  { uid: 'demo-bea', org: 'demo-hbs', kind: 'opp', ago: 14 * H, text: 'Our alumni mentor program is open. Get paired with alumni in your dream industry for one semester. Free for all Ateneans.' },
  { uid: 'demo-paolo', kind: 'post', ago: 9 * H, text: 'Free resume reviews this weekend. Comment your course and the roles you want. I will take the first 10.' },
  {
    uid: 'demo-leo',
    kind: 'work',
    ago: 26 * H,
    text: 'I shoot events, org photos, and headshots. Free this break. Message me for my portfolio.',
  },
  {
    uid: 'demo-sam',
    kind: 'work',
    ago: 6 * H,
    text: 'I edit videos for orgs and small brands. Reels, event recaps, and interviews. Looking for paid projects this break.',
  },
  { uid: 'demo-kyle', kind: 'opp', ago: 50 * 60_000, text: 'We are hiring 2 software engineering interns for the summer. Paid, hybrid in BGC. Message me and I will refer you.' },
]

const ORGS = [
  {
    id: 'demo-coders',
    name: 'Campus Coders Guild',
    short: 'CCG',
    category: 'tech',
    about: 'We build apps, run hackathons, and help each other land tech internships. All courses are welcome. You do not need to know how to code yet.',
    recruiting: true,
    question: 'What do you want to build or learn this year?',
    members: [['demo-migs', 'admin'], ['demo-kyle', 'member'], ['demo-jill', 'member']],
  },
  {
    id: 'demo-debate',
    name: 'Katipunan Debate Club',
    short: 'KDC',
    category: 'academic',
    about: 'Parliamentary debate for beginners and veterans. We train every Tuesday and Thursday after class.',
    recruiting: true,
    question: 'Have you debated before? It is OK if not.',
    members: [['demo-rafa', 'admin'], ['demo-sam', 'member']],
  },
  {
    id: 'demo-pause',
    name: 'Pause Collective',
    short: 'Pause',
    category: 'advocacy',
    about: 'Student-run mental health advocacy. Peer support, talks, and quiet spaces on campus.',
    recruiting: true,
    question: 'Why do you care about mental health?',
    members: [['demo-nina', 'admin'], ['demo-bea', 'member']],
  },
  {
    id: 'demo-hbs',
    name: 'Hilltop Business Society',
    short: 'HBS',
    category: 'business',
    about: 'Case competitions, company visits, and a mentor program with alumni.',
    recruiting: true,
    question: 'Which industry are you most curious about?',
    members: [['demo-bea', 'admin'], ['demo-paolo', 'member']],
  },
  {
    id: 'demo-lens',
    name: 'Lens and Light',
    short: 'L&L',
    category: 'arts',
    about: 'Photo and film club. We shoot campus events and run free workshops every month.',
    recruiting: false,
    question: '',
    members: [['demo-leo', 'admin']],
  },
]

const COMMENTS = {
  'demo-paolo': [
    ['demo-sam', 'AB Comm, looking at content and marketing roles. Thank you for doing this.'],
    ['demo-jill', 'BS ME, operations and supply chain roles please.'],
  ],
  'demo-sam': [['demo-leo', 'Sent you a message. Our org needs an event recap.']],
  'demo-kyle': [['demo-migs', 'Sharing this with our org. Thanks, Kyle.']],
}

// The team's own accounts. In dev they start with a full network, so the app looks lived-in when they sign in.
const OWNERS = ['prince.alpherson.wagan@student.ateneo.edu']

// Prince's real details, from ADVO (advo.ph) and his Ateneo classes.
const OWNER_PROFILE = {
  role: 'student',
  school: 'jgsom',
  course: 'BS Management',
  level: '1',
  year: null,
  headline: 'Founder and CEO of ADVO Technologies. Building BlueLink.',
  about:
    'I run ADVO Technologies, a software company in the Philippines. We build web apps, websites, and the hardware they run on, for businesses that still work on paper and group chats.\n\n' +
    "Our work includes FourlinQ, a patient registry for The Medical City, Felici Artisan Gelato, and Coffee Rush Eastridge.\n\n" +
    'Now I am building BlueLink so Ateneans can find each other faster. Message me about projects, work at ADVO, or BlueLink feedback.',
  openTo: ['hire-intern', 'hire-job', 'seek-mentor'],
  skills: ['Startups', 'Product', 'Sales', 'Web apps', 'React', 'TypeScript', 'UI design', 'Project management'],
}

// Prince's company, as an org page he runs.
const OWNER_TITLE = 'Founder and CEO'
const OWNER_ORG = {
  id: 'advo',
  name: 'ADVO Technologies',
  short: 'ADVO',
  type: 'business',
  category: 'tech',
  about: 'We build web apps, websites, and the hardware they run on for Philippine businesses. Our work includes FourlinQ, The Medical City, Felici Artisan Gelato, and Coffee Rush Eastridge.',
  recruiting: true,
  question: 'What do you want to build with us?',
  links: { facebook: '', instagram: '', website: 'https://advo.ph' },
}

// Prince's portfolio, as shown on advo.ph. Pictures are in server/assets/advo-work.
const OWNER_WORK = [
  { file: 'fourlinq', title: 'FourlinQ', caption: 'An interactive website for custom windows and doors, brought to life with 3D animations.', link: 'https://fourlinq.ph' },
  { file: 'vbe-eye-center-clinic', title: 'VBE Eye Center Clinic', caption: 'Digital patient records and coordinated workflows for an eye care clinic.', link: '' },
  { file: 'felici-artisan-gelato', title: 'Felici Artisan Gelato', caption: 'An immersive gelato website with animated storytelling, interactive flavors, and store discovery.', link: 'https://felicigelato.ph' },
  { file: 'camps-ph', title: 'Camps PH', caption: 'Official booking website for campsites around the Philippines.', link: 'https://camps.ph' },
  { file: 'pcedm-members', title: 'PCEDM Members', caption: 'Conference registration, annual dues, and telemedicine for members.', link: 'https://www.pcedm.ph' },
  { file: 'no-kohi', title: 'NO KOHI', caption: 'Online ordering, POS, inventory, and staff attendance for a matcha and doughnut shop.', link: 'https://nokohi.com' },
  { file: 'floodpass', title: 'FloodPASS PH', caption: 'A flood navigation platform with live road conditions, flood alerts, and safer route planning.', link: 'https://floodpass.com' },
]

// [who, minutes ago, text]. "me" is the owner.
const OWNER_CHATS = {
  'demo-migs': [
    ['demo-migs', 3 * 24 * 60, 'Hi! I saw you just joined. I help run a tech org and we are looking for people for a campus app project. Want to meet up this week?'],
    ['me', 3 * 24 * 60 - 40, 'Hi Migs! Yes, I would love that. I am building something similar.'],
    ['demo-migs', 2 * 24 * 60, 'Nice. Thursday after 3 at Gonzaga?'],
    ['me', 2 * 24 * 60 - 15, 'Works for me. See you there.'],
    ['demo-migs', 50, 'Our guild has a demo night next week. You should show BlueLink.'],
  ],
  'demo-bea': [
    ['me', 5 * 24 * 60, 'Hi Bea! I saw your tip about resume names. Could you look at my cover letter?'],
    ['demo-bea', 5 * 24 * 60 - 90, 'Sure! Send it here and I will check it tonight.'],
    ['demo-bea', 4 * 24 * 60, 'Done. Keep the first paragraph short and say the role you want in line one.'],
    ['me', 4 * 24 * 60 - 20, 'Thank you. That helps a lot.'],
  ],
  'demo-paolo': [
    ['demo-paolo', 26 * 60, 'Got your resume. Strong projects. Put BlueLink at the top and add user numbers when you have them.'],
    ['demo-paolo', 25 * 60, 'Free for a 20 minute call on Saturday?'],
  ],
  'demo-kyle': [
    ['me', 7 * 24 * 60, 'Hi Kyle! Is your summer internship open to Management students?'],
    ['demo-kyle', 7 * 24 * 60 - 60, 'Yes, for product roles. Send me your resume when applications open.'],
  ],
}

const OWNER_POSTS = [
  { kind: 'post', ago: 2 * D, text: 'BlueLink is live for testing. If you are an Atenean, sign in with your school email and tell me what feels off. Every bit of feedback helps.' },
  { kind: 'opp', ago: 8 * H, text: 'Looking for 2 people who like design or frontend to help with a campus app this sem. No pay yet, but good for your portfolio.' },
]

export function createDemo({ db, save, newId, acceptLink, sendMessage, requestLink, uidFor, photoDir, logoDir, coverDir, galleryDir, orgGalleryDir }) {
  const ownerUids = new Set(OWNERS.map(uidFor))

  // Fills an owner's account once: profile gaps, connections, requests, chats, orgs, and a few posts.
  function seedOwner(uid) {
    const me = db.users[uid]
    db.seededOwners ||= []
    if (!me?.name || db.seededOwners.includes(uid)) return
    const now = Date.now()
    const ago = (min) => now - min * 60_000
    const key = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`)

    if ((me.until || 0) < now) Object.assign(me, { until: now + 365 * D, via: 'code' })

    // Connected
    for (const [other, at] of [['demo-migs', 3], ['demo-bea', 5], ['demo-paolo', 6], ['demo-kyle', 7], ['demo-nina', 10], ['demo-leo', 12]]) {
      db.links[key(uid, other)] = { from: other, to: uid, status: 'accepted', note: '', at: now - at * D, acceptedAt: now - at * D + H }
    }
    // Waiting for you
    db.links[key(uid, 'demo-jill')] = { from: 'demo-jill', to: uid, status: 'pending', note: 'Hi! I saw you build apps. Could we talk about tech roles in supply chain?', at: ago(90) }
    db.links[key(uid, 'demo-rafa')] = { from: 'demo-rafa', to: uid, status: 'pending', note: 'Our debate club needs a better sign-up page. Can we talk?', at: ago(5 * 60) }
    // Waiting for them
    db.links[key(uid, 'demo-ana')] = { from: uid, to: 'demo-ana', status: 'pending', note: 'Hi Ma\'am! Could I ask about data science electives for next sem?', at: ago(2 * 24 * 60) }

    for (const [other, lines] of Object.entries(OWNER_CHATS)) {
      db.messages[key(uid, other)] = lines.map(([who, min, text]) => ({ id: newId(), from: who === 'me' ? uid : who, text, at: ago(min) }))
    }
    // Everything read, except the newest few from Migs and Paolo
    db.reads[uid] = { ...db.reads[uid], [key(uid, 'demo-bea')]: now, [key(uid, 'demo-kyle')]: now, [key(uid, 'demo-migs')]: ago(2 * 24 * 60) }

    if (db.orgs['demo-lens'] && !db.orgs['demo-lens'].followers.includes(uid)) db.orgs['demo-lens'].followers.push(uid)

    for (const p of db.posts) {
      if (p.uid === uid || !p.uid.startsWith('demo-')) continue
      if (Math.random() < 0.5 && !p.likes.includes(uid)) p.likes.push(uid)
      if (p.kind === 'event' && !p.going.includes(uid)) p.going.push(uid)
    }
    const friends = ['demo-migs', 'demo-bea', 'demo-paolo', 'demo-kyle', 'demo-nina', 'demo-leo']
    OWNER_POSTS.forEach((p) => {
      const at = now - p.ago
      const comments =
        p.kind === 'opp'
          ? [{ id: newId(), uid: 'demo-leo', text: 'I can help with design. Messaging you.', at: at + H }]
          : [{ id: newId(), uid: 'demo-migs', text: 'Signed up. This is clean.', at: at + 2 * H }, { id: newId(), uid: 'demo-bea', text: 'Sharing with my block.', at: at + 5 * H }]
      db.posts.push({ id: newId(), uid, org: null, kind: p.kind, text: p.text, event: null, at, likes: friends.filter(() => Math.random() < 0.7), going: [], comments })
    })
    db.posts.sort((a, b) => a.at - b.at)

    db.seededOwners.push(uid)
    save()
  }

  // Sets the owner's real profile, photo, and ADVO page once. Kept apart from seedOwner so accounts seeded before it get it too.
  function seedOwnerProfile(uid) {
    const me = db.users[uid]
    db.profiledOwners ||= []
    if (!me?.name || db.profiledOwners.includes(uid)) return
    const now = Date.now()
    Object.assign(me, OWNER_PROFILE, { updatedAt: now })
    fs.copyFileSync(path.join(assets, 'owner-photo.jpg'), path.join(photoDir, `${uid}.jpg`))
    me.photo = now

    const friends = ['demo-migs', 'demo-bea', 'demo-leo', 'demo-kyle'].filter((u) => db.users[u])
    if (!db.orgs[OWNER_ORG.id]) {
      fs.copyFileSync(path.join(assets, 'advo-logo.jpg'), path.join(logoDir, `${OWNER_ORG.id}.jpg`))
      db.orgs[OWNER_ORG.id] = {
        ...OWNER_ORG,
        logo: now,
        verified: false,
        members: [{ uid, role: 'admin', title: OWNER_TITLE, at: now - 20 * D }],
        applications: [],
        followers: [uid, ...friends],
        createdBy: uid,
        createdAt: now - 20 * D,
      }
      const at = now - 5 * H
      db.posts.push({
        id: newId(),
        uid,
        org: OWNER_ORG.id,
        kind: 'opp',
        text: 'ADVO is taking in Ateneans who want to build software for real clients. Frontend, design, and sales. Apply on our page or message me.',
        event: null,
        at,
        likes: friends.slice(0, 3),
        going: [],
        comments: db.users['demo-leo'] ? [{ id: newId(), uid: 'demo-leo', text: 'Applied for design.', at: at + H }] : [],
      })
      db.posts.sort((a, b) => a.at - b.at)
    }
    db.profiledOwners.push(uid)
    save()
  }

  // Fills the owner's portfolio once, if it is empty.
  function seedOwnerGallery(uid) {
    const me = db.users[uid]
    db.galleryOwners ||= []
    if (!me?.name || db.galleryOwners.includes(uid)) return
    if (!me.gallery?.length) {
      const now = Date.now()
      me.gallery = OWNER_WORK.map((w, i) => {
        const item = { id: newId(), title: w.title, caption: w.caption, link: w.link, at: now + i }
        fs.copyFileSync(path.join(assets, 'advo-work', `${w.file}.jpg`), path.join(galleryDir, `${uid}-${item.id}.jpg`))
        return item
      })
    }
    db.galleryOwners.push(uid)
    save()
  }

  // Fills the ADVO page's portfolio once, with the pictures from the owner's own portfolio.
  function seedOrgGallery(uid) {
    const me = db.users[uid]
    const org = db.orgs[OWNER_ORG.id]
    db.orgGalleries ||= []
    if (!me?.gallery?.length || !org || db.orgGalleries.includes(org.id) || !org.members.some((m) => m.uid === uid)) return
    if (!org.gallery?.length) {
      org.gallery = me.gallery
        .filter((g) => fs.existsSync(path.join(galleryDir, `${uid}-${g.id}.jpg`)))
        .map((g) => {
          const item = { ...g, id: newId() }
          fs.copyFileSync(path.join(galleryDir, `${uid}-${g.id}.jpg`), path.join(orgGalleryDir, `${org.id}-${item.id}.jpg`))
          return item
        })
    }
    db.orgGalleries.push(org.id)
    save()
  }

  // Sets the ADVO page's portfolio look once: the stage style, with 2 highlights.
  function seedOrgPortfolio() {
    const org = db.orgs[OWNER_ORG.id]
    if (!org?.gallery?.length) return
    // The first seed called it "Selected work". Now it is "Portfolio", the default.
    if (org.portfolio?.title === 'Selected work') {
      org.portfolio.title = ''
      save()
    }
    if (org.portfolio) return
    const order = ['FourlinQ', 'FloodPASS PH', 'Felici Artisan Gelato', 'Camps PH', 'NO KOHI', 'VBE Eye Center Clinic', 'PCEDM Members']
    const rank = (g) => (order.includes(g.title) ? order.indexOf(g.title) : order.length)
    org.gallery.sort((a, b) => rank(a) - rank(b))
    org.gallery.forEach((g, i) => (i < 2 ? (g.featured = true) : delete g.featured))
    org.portfolio = { style: 'stage', title: '' }
    save()
  }

  // Gives the ADVO page its banner from advo.ph, once.
  function seedOwnerCover() {
    const org = db.orgs[OWNER_ORG.id]
    if (!org || org.cover) return
    fs.copyFileSync(path.join(assets, 'advo-cover.jpg'), path.join(coverDir, `${org.id}.jpg`))
    org.cover = Date.now()
    save()
  }

  // Takes the owner out of the demo orgs he was put in before, once. He is only in ADVO.
  function leaveDemoOrgs(uid) {
    db.leftDemoOrgs ||= []
    if (db.leftDemoOrgs.includes(uid)) return
    for (const id of ['demo-coders', 'demo-hbs']) {
      const o = db.orgs[id]
      if (o) o.members = o.members.filter((m) => m.uid !== uid)
    }
    db.leftDemoOrgs.push(uid)
    save()
  }

  // Moves accounts seeded before to the new name and title, once.
  function renameOwnerOrg(uid) {
    const me = db.users[uid]
    const m = db.orgs[OWNER_ORG.id]?.members.find((x) => x.uid === uid)
    db.renamedOwners ||= []
    if (!me?.name || !m || db.renamedOwners.includes(uid)) return
    m.title ||= OWNER_TITLE
    me.headline = OWNER_PROFILE.headline
    me.about = OWNER_PROFILE.about
    db.renamedOwners.push(uid)
    save()
  }

  function setUpOwner(uid) {
    seedOwner(uid)
    leaveDemoOrgs(uid)
    seedOwnerProfile(uid)
    seedOwnerCover()
    seedOwnerGallery(uid)
    seedOrgGallery(uid)
    seedOrgPortfolio()
    renameOwnerOrg(uid)
  }

  function seed() {
    if (Object.keys(db.users).length) return
    const now = Date.now()
    PEOPLE.forEach((p, i) => {
      db.users[p.uid] = { ...p, photo: 0, createdAt: now - (30 - i) * D, updatedAt: now, seenAt: now - i * 3 * H, until: now + 3650 * D, via: 'code' }
    })
    const uids = PEOPLE.map((p) => p.uid)
    ORGS.forEach((o, i) => {
      const followers = uids.filter((u) => Math.random() < 0.4)
      db.orgs[o.id] = {
        ...o,
        links: { facebook: '', instagram: '', website: '' },
        logo: 0,
        verified: false,
        members: o.members.map(([uid, role]) => ({ uid, role, at: now - 20 * D })),
        applications: [],
        followers: [...new Set([...o.members.map(([u]) => u), ...followers])],
        createdBy: o.members[0][0],
        createdAt: now - (25 - i) * D,
      }
    })
    for (const p of POSTS()) {
      const at = now - p.ago
      const likes = uids.filter((u) => u !== p.uid && Math.random() < 0.45)
      const comments = (COMMENTS[p.uid] || []).map(([uid, text], i) => ({ id: newId(), uid, text, at: at + (i + 1) * 40 * 60_000 }))
      const going = p.kind === 'event' ? uids.filter((u) => u !== p.uid && Math.random() < 0.5) : []
      db.posts.push({ id: newId(), uid: p.uid, org: p.org ?? null, kind: p.kind, text: p.text, event: p.event || null, at, likes, going, comments })
    }
    // Dev only: a founding member code and a fake GCash number, so the pay screen can be tested.
    db.codes.FOUNDERS = { max: 100, used: [], createdAt: now }
    db.settings = { gcashName: 'BlueLink (dev)', gcashNumber: '0900 000 0000' }
    db.links['demo-bea:demo-migs'] = { from: 'demo-bea', to: 'demo-migs', status: 'accepted', note: '', at: now - 9 * D, acceptedAt: now - 9 * D }
    db.links['demo-kyle:demo-migs'] = { from: 'demo-kyle', to: 'demo-migs', status: 'accepted', note: '', at: now - 8 * D, acceptedAt: now - 8 * D }
    db.links['demo-ana:demo-jill'] = { from: 'demo-jill', to: 'demo-ana', status: 'accepted', note: '', at: now - 6 * D, acceptedAt: now - 6 * D }
    save()
  }

  // Demo students made before year levels have none, so their cards show no year. Copies it from PEOPLE.
  function syncDemoLevels() {
    let changed = false
    for (const p of PEOPLE) {
      const u = db.users[p.uid]
      if (u && p.level && !u.level) {
        u.level = p.level
        changed = true
      }
    }
    if (changed) save()
  }

  // Demo people made before the new "open to" tags get the new ones from PEOPLE, one time.
  function syncDemoOpenTo() {
    if (db.demoOpenTo === 3) return
    for (const p of PEOPLE) if (db.users[p.uid]) db.users[p.uid].openTo = p.openTo
    delete db.demoOpenTo2
    db.demoOpenTo = 3
    save()
  }

  function seedAll() {
    seed()
    syncDemoLevels()
    syncDemoOpenTo()
    ownerUids.forEach(setUpOwner)
  }

  // A new person gets one hello, so the inbox is not empty on day one.
  function onJoin(uid) {
    if (ownerUids.has(uid)) return setUpOwner(uid)
    setTimeout(() => {
      if (!db.users[uid] || !db.users['demo-migs'] || db.links[`${uid}:demo-migs`] || db.links[`demo-migs:${uid}`]) return
      requestLink('demo-migs', uid, 'Hi! I saw you just joined. I help run a tech org and we are looking for people for a campus app project. Want to meet up this week?')
    }, 2500)
  }

  // Demo people say yes, then reply, so you can test messages alone.
  function onRequest(from, to) {
    if (!to.startsWith('demo-')) return
    setTimeout(() => {
      const key = from < to ? `${from}:${to}` : `${to}:${from}`
      const l = db.links[key]
      if (l?.status !== 'pending') return
      acceptLink(l)
      setTimeout(() => sendMessage(to, from, 'Hi! Thanks for reaching out. Happy to help. What would you like to know?'), 2500)
    }, 1500)
  }

  function onMessage(from, to) {
    if (!to.startsWith('demo-')) return
    const replies = ['That makes sense. Free after 3 PM most days if you want to talk in person.', 'Good question. Let me think and get back to you tonight.', 'Sure. Send me what you have and I will take a look.']
    setTimeout(() => sendMessage(to, from, replies[Math.floor(Math.random() * replies.length)]), 2200)
  }

  return { seed: seedAll, onJoin, onRequest, onMessage }
}
