// Dev only: made-up demo people and posts, so the app is not empty while we build it.
// None of this runs in production (server/prod.js does not turn on dev mode).

const H = 60 * 60_000
const D = 24 * H

const PEOPLE = [
  {
    uid: 'demo-migs',
    name: 'Migs Reyes',
    role: 'student',
    school: 'sose',
    course: 'BS Computer Science',
    year: 2026,
    headline: 'Org president. Building a campus app on the side.',
    about: 'I run our tech org and I like helping freshies find their people. Ask me about orgs, hackathons, or getting your first tech internship.',
    openTo: ['coffee', 'advice', 'projects', 'recruit'],
    skills: ['React', 'Product', 'Public speaking'],
  },
  {
    uid: 'demo-bea',
    name: 'Bea Santos',
    role: 'student',
    school: 'jgsom',
    course: 'BS Management',
    year: 2027,
    headline: 'Interned at a bank last summer. Ask me about applications.',
    about: 'I applied to 20 internships and got 2. I learned a lot about what works. Happy to look at your cover letter.',
    openTo: ['intern', 'advice', 'coffee'],
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
    openTo: ['advice', 'intern', 'coffee', 'recruit'],
    skills: ['Product management', 'Hiring', 'Resumes'],
  },
  {
    uid: 'demo-sam',
    name: 'Sam Cruz',
    role: 'student',
    school: 'soh',
    course: 'AB Communication',
    year: 2029,
    headline: 'Freshman. Looking for a Theo study group.',
    about: 'New here and still finding my way around. I write for the school paper.',
    openTo: ['study', 'events', 'mentor'],
    skills: ['Writing', 'Video editing'],
  },
  {
    uid: 'demo-jill',
    name: 'Jill Tan',
    role: 'student',
    school: 'sose',
    course: 'BS Management Engineering',
    year: 2026,
    headline: 'Thesis on supply chains. Looking for a groupmate who knows Python.',
    about: '',
    openTo: ['projects', 'study'],
    skills: ['Python', 'Operations research'],
  },
  {
    uid: 'demo-rafa',
    name: 'Rafa Mendoza',
    role: 'student',
    school: 'soss',
    course: 'AB Political Science',
    year: 2027,
    headline: 'Debater. Our org is recruiting this month.',
    about: 'Policy nerd. Ask me about law school plans or student government.',
    openTo: ['events', 'recruit', 'coffee'],
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
    openTo: ['advice', 'mentor', 'projects'],
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
    openTo: ['recruit', 'intern', 'advice'],
    skills: ['Backend', 'Startups'],
  },
  {
    uid: 'demo-nina',
    name: 'Nina Garcia',
    role: 'student',
    school: 'soss',
    course: 'BS Psychology',
    year: 2027,
    headline: 'Running a mental health week. Looking for volunteers.',
    about: '',
    openTo: ['events', 'projects', 'coffee'],
    skills: ['Event planning', 'Peer support'],
  },
  {
    uid: 'demo-leo',
    name: 'Leo Bautista',
    role: 'student',
    school: 'soh',
    course: 'AB Interdisciplinary Studies',
    year: 2026,
    headline: 'I shoot photos for school events. Let us work on something.',
    about: '',
    openTo: ['projects', 'events', 'coffee'],
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
  { uid: 'demo-jill', kind: 'ask', ago: 30 * H, text: 'Looking for a thesis groupmate who knows Python (pandas). ME or CS. We meet twice a week at the library.' },
  {
    uid: 'demo-migs',
    org: 'demo-coders',
    kind: 'event',
    ago: 20 * H,
    text: 'Three seniors talk about how they got their first internship. Open to all courses. Free snacks.',
    event: { title: 'Tech talk: How I got my first internship', date: day(8), time: '16:30', place: 'Faber Hall' },
  },
  { uid: 'demo-bea', org: 'demo-hbs', kind: 'opp', ago: 14 * H, text: 'Our alumni mentor program is open. Get paired with an alum in your dream industry for one semester. Free for all Ateneans.' },
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
  { uid: 'demo-sam', kind: 'ask', ago: 3 * H, text: 'Anyone in Theo 11 this sem? Looking for 2 or 3 people to review with before the long test.' },
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
  'demo-sam': [['demo-leo', 'I took it last year. Happy to share my notes.']],
  'demo-kyle': [['demo-migs', 'Sharing this with our org. Thanks, Kyle.']],
}

export function createDemo({ db, save, newId, acceptLink, sendMessage, requestLink }) {
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

  // A new person gets one hello, so the inbox is not empty on day one.
  function onJoin(uid) {
    setTimeout(() => {
      if (!db.users[uid] || db.links[`${uid}:demo-migs`] || db.links[`demo-migs:${uid}`]) return
      requestLink('demo-migs', uid, 'Hi! I saw you just joined. I help run a tech org and we are looking for people for a campus app project. Want to grab coffee this week?')
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

  return { seed, onJoin, onRequest, onMessage }
}
