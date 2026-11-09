// Shared look for every BlueLink print and brand file: colors, the facts, fonts, the logo, the sky, QR.
// Every size is in millimetres. A design is plain HTML + CSS that build.mjs prints to PDF and photographs to JPG.
// The brand rules are in ~/BlueLink/BRAND.md ("Deep Field"). Change a fact here once and rebuild.
import { readFileSync } from 'node:fs';
import QRCode from 'qrcode';

const root = (p) => new URL(`../../${p}`, import.meta.url);

// ---------- colors (BRAND.md) ----------
export const C = {
  void: '#03050d',      // the sky, main dark ground
  deep: '#070c1f',      // panels on dark, the planet's night side
  ink: '#0a1540',       // text on light, brand navy
  signal: '#1d45e5',    // the BlueLink blue: one key word, buttons
  glow: '#3a5fff',      // blue on dark, the atmosphere rim
  peri: '#93a8ff',      // lines on dark, the back link of the logo, small labels
  star: '#eef1fa',      // Starlight: text on dark
  paper: '#f5f6fa',     // light ground
  flare: '#ffc48a',     // a warm star: one small thing per piece, never a ground
  // supporting tones
  sub: '#a9b2cf',       // second text on dark
  muted: '#7a84a6',     // small text on dark
  ink2: '#3f4a6e',      // second text on light
  ink3: '#697290',      // small text on light
  line: '#d5dbe8',      // hairline on light
  well: '#e9ecf5',      // the planet band on paper
};

// ---------- the facts ----------
// From the BlueLink app (~/BlueLink: shared/membership.js, shared/school.js, shared/legal.js, src/screens/Join.tsx) and BRAND.md.
// Legal and ethics rules for every print (PH RA 10173 Data Privacy, RA 7394 Consumer Act, RA 11967 Internet
// Transactions, RA 11313 Safe Spaces, school rules): no promise of replies, jobs, or numbers we do not have; no fake
// members or testimonials; no Ateneo logo, seal, or Blue Eagle; no "free", raffle, or prize wording.
// Lines marked TO CONFIRM print as visible placeholders until the team fills them in.
export const F = {
  name: 'BlueLink',
  // The domain. Change site and URLS together, then rebuild (npm run print, npm run kit) and test the QR on 2 phones.
  site: 'bluelinkph.com',
  privacy: 'bluelinkph.com/#/privacy',
  terms: 'bluelinkph.com/#/terms',
  headline: ['Welcome to', 'Atenean', '*Networking*'],   // *word* = the one blue word
  support: 'Ask for work, find a mentor, or offer what you are good at.',
  signoff: ['Find your', '*people.*'],
  // Prices from ~/BlueLink/shared/membership.js. Both plans get the same app.
  price: '₱99',
  per: 'a year',
  life: '₱250',
  lifePer: 'lifetime',
  refundShort: 'Full refund within 7 days.',
  // Proof points. Never more than 3 on a print. Nothing we cannot back up.
  why: [
    ['Exclusive access for Ateneans.', 'Your posts stay inside BlueLink.'],
    ['For people who want to network.', 'Everyone here joined to meet people and find opportunities.'],
    ['A safe space for networking.', 'Report and block are on every profile.'],
  ],
  // How to join at the booth (the voucher flow). The code box is "Have a code?" on the join screen.
  steps: [
    ['Sign in', 'with your Ateneo email.'],
    ['Pay ₱99', 'by GCash or cash, here at the booth.'],
    ['Get your code.', 'Type it in the app under “Have a code?”'],
  ],
  redeem: 'To redeem: sign in with your Ateneo email, tap “Have a code?” on the join screen, and type the code.',
  school: 'Ateneo email only',
  tier: 'No premium tier',
  forWho: 'For Ateneans',
  coords: '14.6395° N  121.0781° E',      // Loyola Heights
  // Small lines that go on every tarpaulin, flyer, QR sign, and voucher back. At least 8 pt (2.82 mm) on print.
  unofficial: 'Made by Ateneans. Not an official Ateneo de Manila University service.',
  // The one small line on the tarpaulin, QR sign, and flyer front.
  // No "18+" on any visitor piece (the team asked: it reads as NSFW). The age rule is in the app's terms, and staff check it at the table.
  posterLegal: 'Not an official Ateneo de Manila University service.',
  privacyShort: 'We never sell your data.',
  age: 'For college students, alumni, and faculty.',
  dataLine: 'We collect your name, school email, course and year to run your account. We never sell your data.',
  // TO CONFIRM: who handles refunds, and until when a code works.
  refundContact: '[CONTACT — to confirm]',
  validUntil: '[DATE — to confirm]',
  refund: 'Changed your mind? Ask within 7 days for a full refund:',
  notReceipt: 'This card is not an official receipt.',
  once: 'Code works once.',
  // The voucher card. The front reads like a paid plan. Real codes never go in assets/ (the site is public):
  // `npm run cards -- <codes.txt>` makes a private PDF next to the codes file.
  // Real codes look like BL-ACDE-FGHJ (easy-to-read letters and digits). The public sample shows this one, marked SAMPLE.
  sampleCode: 'BL-ACDE-FGHJ',
};

// Passes a voucher can be for. In the app each code works once and adds its days on top of any time already left.
// The two plans in the app (shared/membership.js): `lifetime` (₱250) and `founding`, a founding member code for 1 year (₱99).
// `lead` is the line above the wordmark on the front; *word* is set in the blue. There is no semester pass.
// Admins make the codes in the app: Admin → Voucher cards → Make codes → Save codes (a .txt, one code per line).
export const PASSES = [
  { id: 'lifetime', tag: 'Lifetime', lead: '*Lifetime* access to', what: 'Lifetime BlueLink membership', price: '₱250', main: true },
  { id: 'founding', tag: 'Founding member', lead: '*1 year* of', what: '1 year of BlueLink membership (365 days)', price: '₱99', flare: true },
];

// Real links. Every QR goes to `home`. Make sure the site is live, and test the QR on 2 phones before printing.
export const URLS = {
  home: 'https://bluelinkph.com',
  privacy: 'https://bluelinkph.com/#/privacy',
  terms: 'https://bluelinkph.com/#/terms',
};

// The bazaar, for the booth posts. From the final floor plan (LAS Bazaar, Section D): BlueLink takes slot 34B,
// which was Profs To Pick. Hours are the team's booth plan (8 AM–5 PM, 3 shifts). TO CONFIRM with the organizers.
export const EVENT = {
  name: 'LAS Bazaar',
  road: 'Red Brick Road',
  tent: '34B',
  section: 'D',
  days: 'Mon Nov 9 – Fri Nov 13',
  short: 'Nov 9–13',
  hours: '8 AM – 5 PM',
  where: 'The far end of Red Brick Road, past MVP.',
  across: 'Across from the Bazaar Committee booth.',
};

// Instagram copy. Polite and professional, one idea per slide, short enough to read in a few seconds.
// Every line is something the app really does (~/BlueLink: shared/options.js, src/screens/Join.tsx, the privacy notice).
// *word* = a key phrase set bright (in a statement) or the one blue word (in a heading).
export const INFO = {
  cover: 'A private network for the Ateneo community.',
  can: 'Find *internships*, connect with *mentors*, and offer your *skills* to fellow Ateneans.',
  safe: ['Your profile and posts are visible to members only.', 'You can report, block, or delete your data at any time.'],
  price: 'Both plans include the full app. Full refund within 7 days.',
  join: ['Sign in with your Ateneo Google account', 'Complete your profile', 'Choose a plan and start connecting'],
  booth: 'Sign up through the link in our bio, or visit us at the LAS Bazaar: Red Brick Road, Tent 34B.',
};
export const BOOTH = {
  head: 'Visit us at the LAS *Bazaar!*',
  note: 'Come by to sign up, or just to ask us what BlueLink is.',
  facts: [['Where', 'Red Brick Road, Tent 34B'], ['When', 'Nov 9 to 13'], ['Time', '8 AM to 5 PM']],
  mapHead: 'Find us at the\nfar *end* of the road',
  mapNote: 'Tent 34B on Red Brick Road, across from the Bazaar Committee booth.',
  stepsHead: 'Signing up\nat the *booth*',
  steps: [
    'Sign in to BlueLink with your Ateneo email.',
    'Pay ₱99 by GCash or cash at the table.',
    'We’ll give you a card with a code. Type it in under “Have a code?” and you’re in.',
  ],
  later: 'Can’t make it? You can sign up anytime through the link in our bio.',
  storyHead: 'Find us at the end\nof Red Brick *Road*',
  storyFoot: 'Nov 9 to 13, 8 AM to 5 PM',
};

// Catalog labels next to constellation stars. Things people ask for, never made-up members.
// The app's own "open to" options (~/BlueLink/shared/options.js), so a label never names a feature the app does not have.
export const LABELS = ['Internships', 'Finding a mentor', 'Projects', 'Events'];
// What BlueLink connects you to: the four stars around you on the "Want connections?" flyer.
export const CONNECT = ['Events', 'Opportunities', 'Businesses', 'Orgs'];

// Hooks: one short question for the hook flyers and the Instagram posts. *word* = the one blue word.
// No second line on the image: the question says it. cap = the Instagram caption. flyer = also a hook flyer.
// Never a promise of replies, jobs, or results.
export const HOOKS = [
  { id: 'want-connections', q: ['Want', '*connections?*'], flyer: true, cap: 'BlueLink is a networking app just for Ateneans, whether you’re a student, an alum, or faculty. Sign up through the link in our bio.' },
  { id: 'need-a-mentor', q: ['Need a', '*mentor?*'], flyer: true, cap: 'Thinking about your next sem, or your first job? Find someone from your course who’s been through it and ask them.' },
  { id: 'shy-to-network', q: ['Shy to', '*network?*'], flyer: true, cap: 'Everyone on BlueLink signed up because they want to meet people, so saying hi is a lot less awkward.' },
  { id: 'need-an-intro', q: ['Need an', '*intro?*'], cap: 'Want to meet someone you don’t know yet? Ask a friend on BlueLink who does.' },
  { id: 'open-for-work', q: ['Open for', '*work?*'], flyer: true, cap: 'Looking for an internship? Add it to what you’re open to on your profile, so other Ateneans know.' },
  { id: 'good-at-something', q: ['Good at', '*something?*'], cap: 'If you edit, code, design, or tutor, put it on your profile. Someone in your batch might be looking for exactly that.' },
  { id: 'events', q: ['Into', '*events?*'], flyer: true, cap: 'See upcoming talks, workshops, and org events posted on BlueLink, and tap Going on the ones you plan to attend.' },
  { id: 'co-founder', q: ['Your co-founder', 'could be in', 'your *block.*'], cap: 'The person you need for your startup might be in the next block. Look for them on BlueLink.' },
  { id: 'only-ateneans', q: ['Networking,', 'only for', '*Ateneans.*'], cap: 'You can only sign up with an Ateneo email, and only members can see what you post.' },
  { id: 'thesis-partner', q: ['Looking for a', 'thesis *partner?*'], cap: 'Need groupmates or respondents for your thesis? Post what you need and see who’s interested.' },
  { id: 'startup', q: ['Building a', '*startup?*'], flyer: true, cap: 'Looking for a co-founder, a designer, or your first users? Start with other Ateneans.' },
  { id: 'find-your-people', q: ['Find your', '*people.*'], cap: 'BlueLink is a networking app for Ateneans. Sign up through the link in our bio.' },
];
export const hookText = (h) => h.q.join(' ').replace(/\*/g, '');

// ---------- looks ----------
// Three looks. Every visitor piece has one version in each, so the team can pick one look for the whole set.
export const LOOKS = [
  { id: 'v1', label: 'Deep Field', about: 'The night sky: near-black ground and a few real stars. The planet edge is on the standee only.' },
  { id: 'v2', label: 'Paper', about: 'Light paper, navy type, one blue word, ink hairlines. Same layout as Deep Field, cheaper to print, easy to read up close.' },
  { id: 'v3', label: 'Big type', about: 'Fewest words, biggest type. Near-black ground. Reads from across the road.' },
];

// Colors per look. bg = ground, ink = main text, sub = second text, muted = small text, hi = the one blue word,
// rule = hairlines, word = wordmark, front/back = the logo's two links, dark = a night look.
export const LOOK = {
  v1: { bg: C.void, ink: C.star, sub: C.sub, muted: C.muted, hi: C.peri, rule: 'rgba(170,185,255,0.2)', word: '#fff', front: '#fff', back: C.peri, planet: '#060a19', dark: true },
  v2: { bg: C.paper, ink: C.ink, sub: C.ink2, muted: C.ink3, hi: C.signal, rule: C.line, word: C.ink, front: C.signal, back: C.peri, planet: C.well, dark: false },
  v3: { bg: C.void, ink: C.star, sub: C.sub, muted: C.muted, hi: C.peri, rule: 'rgba(170,185,255,0.2)', word: '#fff', front: '#fff', back: C.peri, planet: '#060a19', dark: true },
};

// One margin for a whole piece: 7% of its short edge, in mm.
export const margin = (w, h) => Math.round(Math.min(w, h) * 0.07);
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// "*word*" becomes the look's blue word
export const hiText = (t, color) => esc(t).replace(/\*(.+?)\*/g, (_, w) => `<span style="color:${color}">${w}</span>`);

// ---------- the same seed always gives the same sky ----------
export function seeded(text) {
  let s = 2166136261;
  for (const ch of String(text)) s = Math.imul(s ^ ch.charCodeAt(0), 16777619);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f2 = (n) => +n.toFixed(2);
let uid = 0;
const nextId = (p) => `${p}${++uid}`;

// ---------- logo ----------
// Two chain links hooked into each other: two people connected (~/BlueLink/src/components/Logo.tsx).
// The back link passes over the front one at the top right and under it at the bottom left.
export function markSvg({ front = C.signal, back = C.peri, size = '100%', style = '' } = {}) {
  const id = nextId('lk');
  return `<svg class="lg" style="width:${size};height:${size};${style}" viewBox="0 0 32 32" fill="none" stroke-width="4" xmlns="http://www.w3.org/2000/svg">`
    + `<defs><clipPath id="${id}"><circle cx="20" cy="13" r="4.2"/></clipPath></defs>`
    + `<rect x="3" y="7" width="17" height="12" rx="6" stroke="${back}"/>`
    + `<rect x="12" y="13" width="17" height="12" rx="6" stroke="${front}"/>`
    + `<rect x="3" y="7" width="17" height="12" rx="6" stroke="${back}" clip-path="url(#${id})"/></svg>`;
}
// The mark h mm tall.
export const mark = (h, { front, back, style = '' } = {}) => markSvg({ front, back, size: `${h}mm`, style });
// Mark + "BlueLink", like the app header (mark 30, word 20 px, gap 9 px). h = the mark's height in mm.
export const lockup = (h, { word = C.ink, front = C.signal, back = C.peri, style = '' } = {}) =>
  `<div class="lockup" style="gap:${f2(h * 0.3)}mm;${style}">${mark(h, { front, back })}<span class="wm" style="font-size:${f2(h * 0.68)}mm;color:${word}">BlueLink</span></div>`;
export const lockupFor = (v, h, style = '') => lockup(h, { word: LOOK[v].word, front: LOOK[v].front, back: LOOK[v].back, style });

// ---------- the sky ----------
// Real stars: many tiny, a few bright with a soft glow, slightly warm or cool. A faint band of more stars
// (the Milky Way) crosses the sky. All vector, so the PDF stays sharp at tarp size.
//   unit = 1% of the short edge. density = stars per unit². band = 0 to 1, how much of the sky is the band.
export function skySvg({ w, h, seed = 'bluelink', density = 0.02, band = 0.35, haze = true, dark = true, avoid = [], color } = {}) {
  const rand = seeded(seed);
  const unit = Math.min(w, h) / 100;
  const n = Math.round((w / unit) * (h / unit) * density);
  const tones = dark ? ['#ffffff', '#ffffff', '#ffffff', '#dfe6ff', '#cfd9ff', '#ffe6cc'] : [color || C.ink];
  // the band runs from low left to high right
  const bx0 = 0, by0 = h * 0.82, bx1 = w, by1 = h * 0.05;
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const inAvoid = (x, y) => avoid.some(([ax, ay, aw, ah]) => x > ax && x < ax + aw && y > ay && y < ay + ah);
  let dots = '';
  let glows = '';
  for (let i = 0; i < n; i++) {
    let x, y;
    if (rand() < band) {
      const t = rand();
      const off = gauss() * h * 0.16;
      x = bx0 + (bx1 - bx0) * t + off * 0.45;
      y = by0 + (by1 - by0) * t + off;
    } else {
      x = rand() * w;
      y = rand() * h;
    }
    if (x < 0 || y < 0 || x > w || y > h || inAvoid(x, y)) continue;
    const z = rand() ** 2.2;                 // most stars are faint and far
    const bright = rand() < 0.018;
    const r = bright ? unit * (0.16 + rand() * 0.06) : unit * (0.035 + z * 0.1);
    const a = bright ? 0.95 : 0.22 + z * 0.6 + rand() * 0.12;
    const tone = tones[Math.floor(rand() * tones.length)];
    if (bright && dark) glows += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(unit * 1.1)}" fill="url(#sg)"/>`;
    dots += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${tone}" fill-opacity="${f2(dark ? Math.min(1, a) : a * 0.35)}"/>`;
  }
  const hazeSvg = haze && dark ? `
    <defs>
      <radialGradient id="hz1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.glow}" stop-opacity="0.13"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient>
      <radialGradient id="hz2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c9d4ff" stop-opacity="0.05"/><stop offset="1" stop-color="#c9d4ff" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="${f2(w * 0.82)}" cy="${f2(h * 0.14)}" rx="${f2(w * 0.5)}" ry="${f2(h * 0.42)}" fill="url(#hz1)"/>
    <ellipse cx="${f2(w * 0.5)}" cy="${f2(h * 0.44)}" rx="${f2(Math.hypot(w, h) * 0.55)}" ry="${f2(h * 0.13)}" fill="url(#hz2)" transform="rotate(${f2((Math.atan2(by1 - by0, bx1 - bx0) * 180) / Math.PI)} ${f2(w * 0.5)} ${f2(h * 0.44)})"/>` : '';
  return `<svg class="fill" viewBox="0 0 ${f2(w)} ${f2(h)}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c8d4ff" stop-opacity="0.32"/><stop offset="1" stop-color="#c8d4ff" stop-opacity="0"/></radialGradient></defs>
    ${hazeSvg}${glows}${dots}</svg>`;
}

// ---------- the horizon ----------
// The edge of a planet at the bottom, lit from behind. top = where the rim crosses the middle, in mm from the top.
// The thin bright rim fades toward the sides. Below it is the planet's night side, one flat color.
// sun = a speck of Flare on the rim (the sun about to rise). light looks get a hairline rim and a tinted band.
export function horizonSvg({ w, h, top, dark = true, planet = '#060a19', sun = false, curve = 2.4 } = {}) {
  const R = w * curve;
  const cx = w / 2, cy = top + R;
  const unit = Math.min(w, h) / 100;
  const atmo = unit * 9;
  const id = nextId('hz');
  const rimW = unit * (dark ? 0.16 : 0.12);
  const rimColor = dark ? '#dfe6ff' : C.signal;
  return `<svg class="fill" viewBox="0 0 ${f2(w)} ${f2(h)}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${id}a" gradientUnits="userSpaceOnUse" cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R + atmo)}">
        <stop offset="${(R - unit) / (R + atmo)}" stop-color="${C.glow}" stop-opacity="${dark ? 0.55 : 0.18}"/>
        <stop offset="${(R + atmo * 0.25) / (R + atmo)}" stop-color="${C.glow}" stop-opacity="${dark ? 0.16 : 0.05}"/>
        <stop offset="1" stop-color="${C.glow}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}c" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${C.glow}" stop-opacity="${dark ? 0.42 : 0.12}"/>
        <stop offset="1" stop-color="${C.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${id}r" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f2(w)}" y2="0">
        <stop offset="0" stop-color="${rimColor}" stop-opacity="0.05"/>
        <stop offset="0.5" stop-color="${rimColor}" stop-opacity="${dark ? 0.95 : 0.9}"/>
        <stop offset="1" stop-color="${rimColor}" stop-opacity="0.05"/>
      </linearGradient>
      ${sun ? `<radialGradient id="${id}s" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.flare}" stop-opacity="0.9"/><stop offset="0.25" stop-color="${C.flare}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.flare}" stop-opacity="0"/></radialGradient>` : ''}
    </defs>
    <ellipse cx="${f2(cx)}" cy="${f2(top)}" rx="${f2(w * 0.55)}" ry="${f2(atmo * 3.2)}" fill="url(#${id}c)"/>
    <circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R + atmo)}" fill="url(#${id}a)"/>
    <circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R)}" fill="${planet}"/>
    <circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R)}" fill="none" stroke="url(#${id}r)" stroke-width="${f2(rimW)}"/>
    ${sun ? `<ellipse cx="${f2(cx)}" cy="${f2(top)}" rx="${f2(unit * 7)}" ry="${f2(unit * 1.6)}" fill="url(#${id}s)"/>` : ''}
  </svg>`;
}

// ---------- a constellation ----------
// 5–7 stars in a box, joined like a real constellation (each new star to the closest star already in the shape).
// One line = two people connected. labels = mono catalog labels next to some stars, like a star atlas.
// you = one star in Flare (skip it when the piece already has a sun).
export function constellationSvg({ w, h, box, seed = 'c', count = 6, labels = [], dark = true, you = false, unit: u, labelSize } = {}) {
  const rand = seeded(seed);
  const unit = u || Math.min(w, h) / 100;
  const [bx, by, bw, bh] = box;
  const pts = [];
  let tries = 0;
  while (pts.length < count && tries++ < 400) {
    const p = { x: bx + rand() * bw, y: by + rand() * bh };
    if (pts.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > Math.min(bw, bh) * 0.28)) pts.push(p);
  }
  const links = [];
  for (let k = 1; k < pts.length; k++) {
    let best = 0;
    for (let m = 0; m < k; m++) if (Math.hypot(pts[k].x - pts[m].x, pts[k].y - pts[m].y) < Math.hypot(pts[k].x - pts[best].x, pts[k].y - pts[best].y)) best = m;
    links.push([best, k]);
  }
  // one extra link closes a small loop, like a real figure
  if (pts.length > 4) links.push([pts.length - 1, Math.max(0, pts.length - 4)]);
  const line = dark ? C.peri : C.ink;
  const node = dark ? C.star : C.ink;
  const youI = you ? Math.floor(rand() * pts.length) : -1;
  const ls = labelSize || unit * 1.15;
  const lines = links.map(([a, b]) => `<line x1="${f2(pts[a].x)}" y1="${f2(pts[a].y)}" x2="${f2(pts[b].x)}" y2="${f2(pts[b].y)}"/>`).join('');
  const dots = pts.map((p, i) => {
    const c = i === youI ? C.flare : node;
    return `${dark ? `<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(unit * 1.2)}" fill="${c}" fill-opacity="0.12"/>` : ''}<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(unit * (i === youI ? 0.42 : 0.3))}" fill="${c}"/>`;
  }).join('');
  // labels go on stars far apart, left of a star in the right part of the box, right of it otherwise.
  // A label is skipped when its box would cross another label or a line end.
  const boxes = [];
  const tags = [];
  const order = pts.map((p, i) => i).sort((a, b) => pts[a].y - pts[b].y);
  for (const t of labels) {
    for (const i of order) {
      const p = pts[i];
      const right = p.x < bx + bw * 0.55;
      const lw = t.length * ls * 0.68, gap = unit * 1.4;
      const x0 = right ? p.x + gap : p.x - gap - lw;
      const r = [x0 - ls * 0.4, p.y - ls * 0.9, lw + ls * 0.8, ls * 1.6];
      const hit = boxes.some((b) => r[0] < b[0] + b[2] && b[0] < r[0] + r[2] && r[1] < b[1] + b[3] && b[1] < r[1] + r[3])
        || pts.some((q, j) => j !== i && q.x > r[0] && q.x < r[0] + r[2] && q.y > r[1] && q.y < r[1] + r[3]);
      if (hit || boxes.some((b) => b.i === i)) continue;
      boxes.push(Object.assign(r, { i }));
      tags.push(`<text x="${f2(right ? p.x + gap : p.x - gap)}" y="${f2(p.y + ls * 0.35)}" text-anchor="${right ? 'start' : 'end'}" font-size="${f2(ls)}" fill="${dark ? C.peri : C.ink3}" fill-opacity="${dark ? 0.78 : 1}" class="mono-svg">${esc(t)}</text>`);
      break;
    }
  }
  return `<svg class="fill" viewBox="0 0 ${f2(w)} ${f2(h)}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="${line}" stroke-opacity="${dark ? 0.5 : 0.3}" stroke-width="${f2(unit * 0.07)}">${lines}</g>${dots}${tags.join('')}</svg>`;
}

// ---------- plate marks ----------
// Small corner crosshairs on a frame inset from the edge, like a star-chart plate.
export function plateSvg({ w, h, inset, color = C.star, opacity = 0.5, size } = {}) {
  const unit = Math.min(w, h) / 100;
  const s = size || unit * 1.8;
  const sw = unit * 0.07;
  const pts = [[inset, inset], [w - inset, inset], [inset, h - inset], [w - inset, h - inset]];
  const cross = pts.map(([x, y]) => `<path d="M${f2(x - s)} ${f2(y)}H${f2(x + s)}M${f2(x)} ${f2(y - s)}V${f2(y + s)}"/>`).join('');
  return `<svg class="fill" viewBox="0 0 ${f2(w)} ${f2(h)}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${f2(sw)}">${cross}</g></svg>`;
}

// ---------- QR ----------
// A standard QR on every piece: one color (brand navy) on a white tile, square modules and corner eyes, with no logo,
// no colored eyes, and no crosses around it. The white quiet zone is part of the tile. Check every QR with a decoder
// before printing. Returns { html, mm: size of the code, zone: quiet zone in mm }.
export const QR_INK = C.ink;
export function qrTile(text, w, { ecl = 'M', quiet = 3, style = '' } = {}) {
  const code = QRCode.create(text, { errorCorrectionLevel: ecl });
  const n = code.modules.size, total = n + 2 * quiet, u = w / total;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!code.modules.get(r, c)) continue;
      let e = c;
      while (e + 1 < n && code.modules.get(r, e + 1)) e++;
      d += `M${c + quiet} ${r + quiet}h${e - c + 1}v1h-${e - c + 1}z`;
      c = e;
    }
  }
  const svg = `<svg style="display:block;width:${w}mm;height:${w}mm" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><path fill="${QR_INK}" d="${d}"/></svg>`;
  return { html: `<div class="qrt" style="width:${w}mm;height:${w}mm;background:#fff;${style}">${svg}</div>`, mm: +(n * u).toFixed(2), zone: +(quiet * u).toFixed(2) };
}

// ---------- fonts + base CSS for every print page ----------
// Inter is the app's own copy (~/BlueLink/src/assets/fonts), with cv05 cv11 ss03 (single-storey a, tailed l,
// round dots). It has no ₱, so the ₱ falls back to Google's Inter (loaded for that one sign). JetBrains Mono for labels.
const INTER_B64 = readFileSync(root('assets/kit/fonts/InterVariable-latin.woff2')).toString('base64');
// Two links: JetBrains Mono, and Inter cut to the ₱ alone (`text=` applies to a whole request, so it gets its own).
export const FONTS = [
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..800&display=block',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400..900&text=%E2%82%B1&display=block',
];
export const fontLinks = () => FONTS.map((f) => `<link rel="stylesheet" href="${f}">`).join('');
export const FONT_FACE = `@font-face{font-family:"Inter BL";src:url(data:font/woff2;base64,${INTER_B64}) format("woff2");font-weight:100 900;font-style:normal;font-display:block}`;
// Inter only for the ₱ (FONTS loads just that glyph). Wrap every ₱ so it is set in Inter on purpose.
export const peso = (text) => String(text).replace(/₱/g, '<span class="peso">₱</span>');

export const BASE_CSS = `${FONT_FACE}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:"Inter BL",Inter,sans-serif;font-feature-settings:"cv05","cv11","ss03";color:${C.ink};background:#fff}
.pg{position:relative;overflow:hidden;break-after:page;page-break-after:always}
.pg:last-child{break-after:auto;page-break-after:auto}
.fill{position:absolute;inset:0;width:100%;height:100%;display:block}
.abs{position:absolute}
.lg{display:block;flex:none}
.lockup{display:flex;align-items:center}
.wm{font-weight:700;letter-spacing:-0.03em;line-height:1;white-space:nowrap}
.d{font-weight:800;letter-spacing:-0.04em;line-height:0.96}
.t{font-weight:500;letter-spacing:-0.01em;line-height:1.32}
.m,.mono-svg{font-family:"JetBrains Mono",monospace;font-weight:500;letter-spacing:0.08em;text-transform:uppercase}
.m{line-height:1.25}
.nw{white-space:nowrap}
.qrt{position:relative;flex:none}
.peso{font-family:Inter,sans-serif;font-weight:inherit;letter-spacing:0;margin-right:-0.005em}
`;
