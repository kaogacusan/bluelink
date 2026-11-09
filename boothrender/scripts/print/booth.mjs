// Print files for the BlueLink booth: every printed piece, in three looks (LOOKS in kit.mjs).
// Sizes in mm. `piece` is the id the 3D model uses. A version's html(i) returns page i.
// Words come from F in kit.mjs only. One QR on every print: URLS.home (a PLACEHOLDER until the domain is live).
// Every ₱ goes through peso() at the end, so it is set in Inter on purpose.
import { C, F, PASSES, URLS, LOOK, LABELS, HOOKS, hookText, margin, esc, hiText, lockupFor, mark, markSvg, skySvg, horizonSvg, constellationSvg, plateSvg, qrTile, peso } from './kit.mjs';

// ---------- small helpers ----------
const at = (x, y, inner, style = '', cls = '') => `<div class="abs ${cls}" style="left:${x}mm;top:${y}mm;${style}">${inner}</div>`;
// like at(), but y is the space under the block
const atb = (x, y, inner, style = '', cls = '') => `<div class="abs ${cls}" style="left:${x}mm;bottom:${y}mm;${style}">${inner}</div>`;
// like at(), but x is the space right of the block
const atr = (x, y, inner, style = '', cls = '') => `<div class="abs ${cls}" style="right:${x}mm;top:${y}mm;${style}">${inner}</div>`;
const ground = (v, color) => `<div class="fill" style="background:${color || LOOK[v].bg}"></div>`;
const lines = (list, v) => list.map((l) => hiText(l, LOOK[v].hi)).join('<br>');
const mono = (t, size, color, extra = '') => `<span class="m nw" style="font-size:${size}mm;color:${color};${extra}">${t}</span>`;
const dot = (d, color) => `<span style="display:inline-block;width:${d}mm;height:${d}mm;border-radius:50%;background:${color};flex:none"></span>`;

// The sky for a look. v1: stars, haze, the band. v2: a few faint ink dots. v3: a quiet sky, no band.
const sky = (v, w, h, seed, { density, avoid } = {}) => {
  if (v === 'v2') return skySvg({ w, h, seed, density: (density ?? 0.02) * 0.35, band: 0, haze: false, dark: false, avoid, color: C.ink });
  if (v === 'v3') return skySvg({ w, h, seed, density: (density ?? 0.02) * 0.55, band: 0.15, haze: true, avoid });
  return skySvg({ w, h, seed, density: density ?? 0.02, band: 0.38, avoid });
};
const horizon = (v, w, h, top, opts = {}) => horizonSvg({ w, h, top, dark: LOOK[v].dark, planet: LOOK[v].planet, ...opts });
// Plate marks: light crosses on dark, ink crosses on paper.
const plate = (v, w, h, inset) => plateSvg({ w, h, inset, color: LOOK[v].dark ? C.star : C.ink, opacity: LOOK[v].dark ? 0.45 : 0.35 });

// A small legal line: Inter 500, at least 8 pt (2.82 mm) on print.
const legal = (t, size, color, extra = '') => `<div class="t" style="font-size:${size}mm;line-height:1.36;color:${color};${extra}">${t}</div>`;

// The posters (tarp, QR sign, flyer) stay simple: the logo, one headline, the QR, one price, and one small legal line.
// No support line, no sun, no constellations, labels, plate marks, or coordinates. A quiet sky.
// The planet's edge is on the tarpaulin only, so it does not repeat on every piece.
const POSTER_SKY = 0.012;

// The QR on its white tile, "Scan to join" under it, then the link (in case the QR does not scan).
function qrCol(v, w, size, { label = 'Scan to join' } = {}) {
  const k = LOOK[v];
  const t = qrTile(URLS.home, w, { color: k.qr, bg: '#fff' });
  return `<div style="width:${w}mm;text-align:center">${t.html}
    ${label ? `<div class="nw" style="margin-top:${size * 0.8}mm;font-size:${size}mm;font-weight:700;letter-spacing:-0.015em;line-height:1.1;color:${k.ink}">${label}</div>` : ''}
    <div class="nw" style="margin-top:${size * (label ? 0.3 : 0.8)}mm;font-size:${size * (label ? 0.6 : 1)}mm;font-weight:${label ? 500 : 700};line-height:1.2;color:${label ? k.sub : k.ink}">${esc(F.site)}</div></div>`;
}

// One price: "₱99 a year". s = the big size in mm.
function priceLine(v, s, price = F.price, per = F.per) {
  const k = LOOK[v];
  return `<span class="d nw" style="font-size:${s}mm;letter-spacing:-0.035em;color:${k.ink}">${price}<span style="font-size:${f1(s * 0.48)}mm;font-weight:600;letter-spacing:-0.01em;color:${k.sub};margin-left:${f1(s * 0.14)}mm">${per}</span></span>`;
}
const f1 = (n) => +n.toFixed(2);

// ======================================================================
// TARPAULIN, 4 × 3 ft landscape (1219.2 × 914.4 mm). Hangs on the back wall of our half, top at the eave.
// Seen from 1–4 m, over the heads of people at the table, so the logo, headline, and QR sit in the top 2/3.
// ======================================================================
const TW = 1219.2, TH = 914.4, TM = margin(TW, TH);

// The headline (or "Find your people." in V3) on the left, the QR on the right, the price on the planet.
const tarpPage = (v) => {
  const k = LOOK[v];
  const big = v === 'v3';
  const top = TH * 0.8;                  // the planet's rim
  const qrW = 280, qrX = TW - TM - qrW, qrY = 230;
  const head = big
    ? `<div class="d" style="font-size:160mm;letter-spacing:-0.05em;line-height:0.9;color:${k.ink}">${lines(F.signoff, v)}</div>`
    : `<div class="d" style="font-size:118mm;color:${k.ink}">${lines(F.headline, v)}</div>`;
  return `
    ${ground(v)}
    ${sky(v, TW, TH, big ? 'tarp-big' : 'tarp', { density: POSTER_SKY, avoid: [[qrX - 30, qrY - 30, qrW + 60, qrW + 130]] })}
    ${horizon(v, TW, TH, top)}
    ${at(TM, TM, lockupFor(v, 64))}
    ${at(TM, big ? 250 : 222, head)}
    ${at(qrX, qrY, qrCol(v, qrW, 24))}
    ${atb(TM, TM - 6, priceLine(v, 60))}
    <div class="abs" style="right:${TM}mm;bottom:${TM - 2}mm">${legal(F.posterLegal, 12, k.muted, 'white-space:nowrap')}</div>`;
};

const tarp = {
  id: 'tarp', piece: 'tarp', name: 'Tarpaulin', size: '4 × 3 ft (1219 × 914 mm), landscape', mm: [TW, TH], pages: ['Tarpaulin'],
  print: 'Tarpaulin, 4 × 3 ft, matte, with grommets in the 4 corners. Send the PDF. Hang it on the back wall of our half with zip ties, top edge at the eave.',
  versions: [
    { id: 'v1', note: 'The night sky: the logo, “Welcome to Atenean Networking”, the QR, and ₱99 a year.', html: () => tarpPage('v1') },
    { id: 'v2', note: 'Paper: the same layout on light paper, navy type, “Networking” in BlueLink blue.', html: () => tarpPage('v2') },
    { id: 'v3', note: 'Big type: “Find your people.”, the QR, and the price. Reads from across the road.', html: () => tarpPage('v3') },
  ],
};

// ======================================================================
// QR SIGN, A4 portrait (210 × 297 mm), in an A4 acrylic stand on the table. One job: get a scan.
// QR at 120 mm scans from about 1.2 m.
// ======================================================================
const AW = 210, AH = 297, AM = 16;

// Flat: one ground color, no sky, no planet.
const qrSignPage = (v) => {
  const k = LOOK[v];
  const big = v === 'v3';
  const qrW = 120, qrX = (AW - qrW) / 2, qrY = big ? 84 : 72;
  return `
    ${ground(v)}
    ${at(AM, AM, lockupFor(v, 10))}
    ${at(AM, 34, `<div class="d nw" style="font-size:${big ? 20 : 21}mm;color:${k.ink}">${big ? lines(F.signoff, v) : `Scan to ${hiText('*join.*', k.hi)}`}</div>`)}
    ${at(qrX, qrY, qrCol(v, qrW, 6, { label: big ? 'Scan to join' : '' }))}
    ${atb(AM, AM + 8, priceLine(v, 13))}
    ${atb(AM, AM - 3, legal(F.posterLegal, 3, k.muted))}`;
};

const qrSign = {
  id: 'qr', piece: 'qr', name: 'QR sign', size: 'A4, 210 × 297 mm, QR 12 cm', mm: [AW, AH], pages: ['Sign'],
  print: 'Glossy or matte A4, in an A4 acrylic stand. One sign per stand. Test the QR on 2 phones before printing.',
  versions: [
    { id: 'v1', note: 'Flat near-black: “Scan to join.”, a big QR, and the price.', html: () => qrSignPage('v1') },
    { id: 'v2', note: 'Flat paper: the same sign on light paper, navy type.', html: () => qrSignPage('v2') },
    { id: 'v3', note: 'Flat near-black: “Find your people.”, the QR, and the price.', html: () => qrSignPage('v3') },
  ],
};

// ======================================================================
// FLYER, A6 (105 × 148 mm), two sides. 4 per A4 sheet. Front: the headline, the QR, the price.
// Back: 3 short reasons, both plans, the refund line, and the legal lines.
// ======================================================================
const FW = 105, FH = 148, FM = 8;

const flyerFront = (v) => {
  const k = LOOK[v];
  const top = 104, qrW = 28;
  const big = v === 'v3';
  return `
    ${ground(v)}
    ${sky(v, FW, FH, 'flyer', { density: POSTER_SKY, avoid: [[FW - FM - qrW - 3, top, qrW + 6, qrW + 12]] })}
    ${at(FM, FM, lockupFor(v, 6))}
    ${at(FM, 32, big
      ? `<div class="d" style="font-size:20mm;letter-spacing:-0.05em;line-height:0.9;color:${k.ink}">${lines(F.signoff, v)}</div>`
      : `<div class="d" style="font-size:13mm;color:${k.ink}">${lines(F.headline, v)}</div>`)}
    ${atb(FW - FM - qrW, FM, qrCol(v, qrW, 2.8))}
    ${atb(FM, FM + 1, priceLine(v, 9))}`;
};

const flyerBack = (v) => {
  const k = LOOK[v];
  const why = ([t]) => `<div style="padding:3.6mm 0;border-top:0.25mm solid ${k.rule};font-size:4.6mm;font-weight:700;letter-spacing:-0.015em;line-height:1.2;color:${k.ink}">${esc(t.replace(/\.$/, ''))}</div>`;
  return `
    ${ground(v, k.dark ? C.deep : '#fff')}
    ${k.dark ? skySvg({ w: FW, h: FH, seed: 'flyer-back', density: 0.004, band: 0, haze: false }) : ''}
    ${at(FM, FM, `${lockupFor(v, 6)}
      <div style="margin-top:12mm">${F.why.map(why).join('')}</div>
      <div style="border-top:0.25mm solid ${k.rule};padding-top:5mm;display:flex;gap:9mm">
        <div>${priceLine(v, 8)}</div><div>${priceLine(v, 8, F.life, F.lifePer)}</div></div>
      ${legal(F.refundShort, 3.2, k.sub, 'margin-top:2.6mm')}`, `width:${FW - 2 * FM}mm`)}
    ${atb(FM, FM, `
      ${legal(`${F.privacyShort} Privacy notice: ${F.privacy}`, 2.9, k.muted)}
      ${legal(F.posterLegal, 2.9, k.muted, 'margin-top:1mm')}`, `width:${FW - 2 * FM}mm`)}`;
};

const flyer = {
  id: 'flyer', piece: 'flyers', name: 'Flyer', size: 'A6, 105 × 148 mm, two sides', mm: [FW, FH], pages: ['Front', 'Back'],
  print: 'Print 4 per A4 sheet, both sides (flip on the long edge), then cut. 120 gsm or more.',
  versions: [
    { id: 'v1', note: 'Front: the headline, the QR, and the price. Back: 3 reasons, both plans, the refund line, the privacy line, 18+, and “not an official Ateneo service”.', html: (i) => (i ? flyerBack('v1') : flyerFront('v1')) },
    { id: 'v2', note: 'Paper: the same two sides on light paper. Cheapest to print in color.', html: (i) => (i ? flyerBack('v2') : flyerFront('v2')) },
    { id: 'v3', note: 'Big type: “Find your people.” and the QR on the front. The same back as Deep Field.', html: (i) => (i ? flyerBack('v3') : flyerFront('v3')) },
  ],
};

// Shrink a .fit headline until its longest line fits its box. Runs once the fonts are in, before the build prints.
const FIT = `<script>window.__fit||(window.__fit=new Promise((r)=>document.readyState==='loading'?addEventListener('DOMContentLoaded',r):r()).then(()=>document.fonts.ready).then(()=>document.querySelectorAll('.fit').forEach((el)=>{
  const max=el.parentElement.clientWidth;let s=parseFloat(getComputedStyle(el).fontSize);el.style.width='max-content';
  while(el.scrollWidth>max&&s>8){s*=0.98;el.style.fontSize=s+'px'}el.style.width=''})))</script>`;

// HOOK FLYERS: the flyer with one short question in place of the headline (HOOKS with flyer: true in kit.mjs).
// The same QR, price, and back as the flyer.
const hookFront = (v, h) => {
  const k = LOOK[v];
  const top = 104, qrW = 28;
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: POSTER_SKY, avoid: [[FW - FM - qrW - 3, top, qrW + 6, qrW + 12]] })}
    ${at(FM, FM, lockupFor(v, 6))}
    ${at(FM, 32, `<div class="d fit nw" style="font-size:${v === 'v3' ? 22 : 17}mm;letter-spacing:-0.05em;line-height:0.92;color:${k.ink}">${lines(h.q, v)}</div>
      ${h.sub && v !== 'v3' ? `<div class="nw" style="font-size:5mm;font-weight:600;letter-spacing:-0.01em;margin-top:4.5mm;color:${k.sub}">${esc(h.sub)}</div>` : ''}`, `width:${FW - 2 * FM}mm`)}
    ${atb(FW - FM - qrW, FM, qrCol(v, qrW, 2.8))}
    ${atb(FM, FM + 1, priceLine(v, 9))}${FIT}`;
};

const hookFlyers = HOOKS.filter((h) => h.flyer).map((h) => ({
  id: `hook-${h.id}`, piece: 'flyers', name: `Flyer: “${hookText(h)}”`, size: 'A6, 105 × 148 mm, two sides', mm: [FW, FH], pages: ['Front', 'Back'],
  print: flyer.print,
  versions: [
    { id: 'v1', note: 'The question, the QR, and the price on the night sky. The back is the flyer back.', html: (i) => (i ? flyerBack('v1') : hookFront('v1', h)) },
    { id: 'v2', note: 'The same on light paper.', html: (i) => (i ? flyerBack('v2') : hookFront('v2', h)) },
    { id: 'v3', note: 'Only the question, bigger, and the QR.', html: (i) => (i ? flyerBack('v3') : hookFront('v3', h)) },
  ],
}));

// ======================================================================
// VOUCHER CARD, A7 landscape (105 × 74 mm), 8 per A4 sheet. Bigger than a business card so the back can carry
// what the buyer is owed in writing: what they paid, what it gives, the code, how to redeem, that it works once,
// until when, the refund line, 18+, the privacy line, "not an official receipt", and "not an official Ateneo service".
// `npm run cards -- <codes.txt>` prints the real codes into a private PDF (scripts/print/cards.mjs).
// ======================================================================
const KW = 105, KH = 74, KM = 5.5, KCW = KW - 2 * KM;
export const CARD_MM = [KW, KH];
const MAIN = PASSES.find((p) => p.main);

// the pass a card is for, by id or tag ('founding', 'Founding member'). Blank: the main pass. No match: undefined.
export const passFor = (s = '') => {
  const t = String(s).trim().toLowerCase();
  return t ? PASSES.find((p) => p.id === t || p.tag.toLowerCase() === t) : MAIN;
};

// the pass tag: square, mono, like a plan badge (no pill)
const passTag = (v, p, size = 2.7) => {
  const k = LOOK[v];
  const bg = k.dark ? 'rgba(147,168,255,0.14)' : 'rgba(29,69,229,0.08)';
  const fg = k.dark ? C.peri : C.signal;
  return `<span class="m nw" style="display:inline-flex;align-items:center;gap:1.6mm;font-size:${size}mm;font-weight:600;color:${fg};background:${bg};padding:1.2mm 2.4mm 1.1mm;border-radius:0.5mm">${p.flare ? dot(1.5, C.flare) : ''}${esc(p.tag)}</span>`;
};

export const cardFront = (v, p = MAIN) => {
  const k = LOOK[v];
  const big = v === 'v3';
  return `
    ${ground(v)}
    ${sky(v, KW, KH, `card-${p.id}`, { density: 0.034 })}
    ${v !== 'v3' ? constellationSvg({ w: KW, h: KH, box: [KW * 0.56, 20, KW * 0.32, 20], seed: `card-c-${p.id}`, count: 5, dark: k.dark, you: !!p.flare }) : ''}
    ${plate(v, KW, KH, 3)}
    ${at(KM, KM, mark(7, { front: k.front, back: k.back }))}
    ${atr(KM, KM + 0.8, passTag(v, p))}
    ${atb(KM, KM + 2.2, `
      <div class="d nw" style="font-size:${big ? 13 : 7.8}mm;letter-spacing:-0.04em;color:${k.ink}">${hiText(`*${p.line}*`, k.hi)} of</div>
      <div class="wm" style="font-size:${big ? 11.5 : 12.6}mm;margin-top:${big ? 0.8 : 1.4}mm;color:${k.word}">BlueLink</div>`)}
    ${big ? '' : atr(KM, KH - KM - 5.6, mono('Members only', 2.3, k.muted))}`;
};

// code = the voucher code; pass = the pass id or tag (blank: the main pass).
// The same simple back as profstopick: the code in a white box, one line on how to use it, where to redeem it.
// No code (the public files): the box is left white and empty, to write the code in with a pen.
// Real cards come from `npm run cards`. The terms live in the app (#/terms), not on the card.
export const cardBack = (v, { code = '', pass = '' } = {}) => {
  const k = LOOK[v];
  const p = passFor(pass) || MAIN;
  const bg = { v1: C.deep, v2: '#fff', v3: C.void }[v];
  const field = k.dark ? '' : `border:0.3mm solid ${C.ink3};`;
  return `
    ${ground(v, bg)}
    ${at(KM, KM, `<span>Voucher code</span><span style="color:${p.flare && k.dark ? C.flare : k.sub}">${esc(p.tag)}</span>`, `width:${KCW}mm;display:flex;justify-content:space-between;font-size:2.8mm;color:${k.sub}`, 'm nw')}
    ${at(KM, KM + 5, `<div style="height:28mm;background:#fff;${field}border-radius:0.6mm;display:flex;align-items:center;justify-content:center">
      <span class="m nw" style="font-size:9.4mm;font-weight:700;letter-spacing:0.06em;text-transform:none;color:${C.ink}">${esc(code)}</span></div>`, `width:${KCW}mm`)}
    ${at(KM, KM + 38, 'Sign in, tap “Have a code?”, type this code.', `font-size:3.6mm;font-weight:500;color:${k.sub}`, 'nw')}
    ${atb(KM, KM, `<span>Redeem at <b style="font-weight:700">${esc(F.site)}</b></span>${mark(5.4, { front: k.front, back: k.back })}`, `width:${KCW}mm;display:flex;justify-content:space-between;align-items:center;border-top:0.25mm solid ${k.rule};padding-top:3mm;font-size:3.8mm;font-weight:500;color:${k.ink}`, 'nw')}`;
};

const card = {
  id: 'card', piece: 'card', name: 'Voucher card, front', size: 'A7 landscape, 105 × 74 mm, “1 semester of BlueLink”', mm: [KW, KH], pages: ['Front'],
  print: 'Card stock, 300 gsm, matte. 8 per A4 sheet. Print this on one side and “Voucher card, back” on the other. Cut to 105 × 74 mm, square corners.',
  versions: [
    { id: 'v1', note: 'The night sky: “1 semester of BlueLink”, the Semester pass tag, and a small constellation.', html: () => cardFront('v1') },
    { id: 'v2', note: 'Paper: the same card on light paper, navy type, “1 semester” in BlueLink blue.', html: () => cardFront('v2') },
    { id: 'v3', note: 'Big type: “1 semester of BlueLink”, nothing else.', html: () => cardFront('v3') },
  ],
};

// the same front for the founding member code (1 school year). Its tag and one constellation star are Flare.
const founding = PASSES.find((p) => p.id === 'founding');
const cardFounding = {
  ...card, id: 'card-founding', name: 'Voucher card, front: Founding member', size: 'A7 landscape, 105 × 74 mm, “1 year of BlueLink”',
  versions: card.versions.map((x) => ({ ...x, note: x.note.replace(/1 semester/g, '1 year').replace('the Semester pass tag', 'the Founding member tag with a warm star'), html: () => cardFront(x.id, founding) })),
};

const cardBackPrint = {
  id: 'cardback', piece: 'card', name: 'Voucher card, back', size: 'A7 landscape, 105 × 74 mm, the voucher code', mm: [KW, KH], pages: ['Back'],
  print: 'The code box is left blank: write the code in it with a pen. To print the codes instead, make them in the app (Admin → Voucher cards → Make codes → Save codes), then run npm run cards -- <codes.txt>: one private PDF, front and back, one card per code.',
  versions: [
    { id: 'v1', note: 'Deep navy. The code in a big white box, one line on how to use it, and where to redeem it.', html: () => cardBack('v1') },
    { id: 'v2', note: 'White. The code in a thin-line box, one line on how to use it, and where to redeem it. Cheapest to print.', html: () => cardBack('v2') },
    { id: 'v3', note: 'Near-black, the same as Big type. The code in a big white box, and where to redeem it.', html: () => cardBack('v3') },
  ],
};

// ======================================================================
// STAFF FAQ, A4, two pages, for the team only (not for visitors). What people ask, and short, honest answers.
// Page 2: when someone has a concern (privacy, safety, the school), the sale in 4 steps, and what never to say.
// ======================================================================
const FAQ = [
  ['About BlueLink', [
    ['Is this an official Ateneo thing?', 'No. Ateneans made it. It is not an official Ateneo de Manila University service, and the school does not run it.'],
    ['Who can join?', 'Anyone 18 or older with an Ateneo email: college students, alumni, and faculty.'],
    ['Why pay?', '₱50 a semester keeps out spam and fake accounts, and keeps the room small and serious. Everyone pays the same. No premium tier.'],
    ['Where is my money going?', 'It runs BlueLink: hosting, email, and upkeep.'],
    ['Refunds?', `Yes. Ask within 7 days for a full refund: ${F.refundContact}.`],
  ]],
  ['Privacy', [
    ['Who sees my data? Do you sell it?', `Only members see your profile and posts. We never sell your data. The privacy notice says what we keep and why: ${F.privacy}.`],
    ['Can the team read my messages?', 'No. Messages are private. Admins only see a message if someone reports it.'],
    ['Can I delete my account and data?', 'Yes. In Settings. It is deleted right away.'],
  ]],
  ['Safety and rules', [
    ['Is it safe for students if alumni and faculty are on it?', '18+ only. Every profile has report and block. The rules ban harassment, and we remove people who break them.'],
    ['Can people use it to cheat?', 'No. The rules ban selling or asking for answers, homework, or papers. Report it and we remove it.'],
  ]],
];
const NEVER = [
  'You will get a job, an internship, or a mentor.',
  'Everyone replies, or people reply fast.',
  'Ateneo supports, approves, or runs this.',
  'It is free, or there is a raffle or a prize.',
  'Any number of members, or anything about a member, unless it is true and public.',
];
const CONCERN = [
  ['Listen.', 'Let them finish. Do not argue.'],
  ['Say it is fair.', '“That’s a fair question.”'],
  ['Answer from this sheet only.', 'If it is not here, say you will ask the team.'],
  ['Write it down.', 'Who asked, what they asked, and how to reach them. Tell the team the same day.'],
];
const SALE = [
  ['Check first.', 'They are 18+ and have an Ateneo email. If not, do not sell.'],
  ['Take the payment.', '₱50 cash, or GCash. Check the GCash payment came in.'],
  ['Give the card.', 'Write the code on the back. Log the time, the code, and how they paid.'],
  ['Help them redeem.', 'Sign in, tap “Have a code?”, type the code. Right there at the table.'],
];

const faqPage = (i) => {
  const M = 15, CW = PW - 2 * M;
  const kick = (t) => `<div class="m" style="font-size:2.9mm;font-weight:600;color:${C.signal};margin-bottom:2.4mm">${t}</div>`;
  const head = (title, sub) => `
    <div class="abs" style="left:0;top:0;width:${PW}mm;height:30mm;overflow:hidden">${ground('v1')}${skySvg({ w: PW, h: 30, seed: `faq-${i}`, density: 0.05, band: 0.3 })}
      <div class="abs" style="left:${M}mm;top:8mm">${lockupFor('v1', 6)}</div>
      <div class="abs" style="right:${M}mm;top:9mm">${mono(`For the team · Not for visitors · ${i + 1} / 2`, 2.6, C.sub)}</div></div>
    <div class="abs" style="left:${M}mm;top:38mm;width:${CW}mm">
      <div class="d" style="font-size:9.5mm;color:${C.ink}">${title}</div>
      <div class="t" style="font-size:3.6mm;margin-top:2mm;color:${C.ink2}">${sub}</div></div>`;
  const qa = ([q, a]) => `<div style="display:grid;grid-template-columns:62mm 1fr;gap:6mm;padding:2.8mm 0 3mm;border-top:0.25mm solid ${C.line}">
      <div style="font-size:4mm;font-weight:700;line-height:1.3;color:${C.ink}">${esc(q)}</div>
      <div class="t" style="font-size:3.9mm;line-height:1.4;color:${C.ink}">${esc(a)}</div></div>`;
  const row = ([t, d], j) => `<div style="display:grid;grid-template-columns:8mm 52mm 1fr;gap:4mm;align-items:baseline;padding:2.8mm 0 3mm;border-top:0.25mm solid ${C.line}">
      ${mono(`0${j + 1}`, 3.2, C.signal, 'font-weight:600')}
      <div style="font-size:4mm;font-weight:700;line-height:1.3;color:${C.ink}">${esc(t)}</div>
      <div class="t" style="font-size:3.9mm;line-height:1.4;color:${C.ink}">${esc(d)}</div></div>`;
  const foot = `<div class="abs" style="left:${M}mm;bottom:${M}mm;width:${CW}mm;border-top:0.4mm solid ${C.ink};padding-top:3mm;display:flex;justify-content:space-between">
      ${legal(F.unofficial, 3, C.ink2)}${mono(F.site, 2.8, C.ink3)}</div>`;
  if (i === 0) return `
    <div class="fill" style="background:#fff"></div>
    ${head('Booth FAQ', 'What people ask, and what to say. Short and honest. If it is not on this sheet, say you will ask the team.')}
    <div class="abs" style="left:${M}mm;top:62mm;width:${CW}mm">
      ${FAQ.map(([t, list]) => `<div style="margin-bottom:7mm">${kick(t)}${list.map(qa).join('')}</div>`).join('')}
    </div>${foot}`;
  return `
    <div class="fill" style="background:#fff"></div>
    ${head('Concerns, the sale, and what not to say', 'Stay calm and polite. Never promise more than BlueLink does.')}
    <div class="abs" style="left:${M}mm;top:62mm;width:${CW}mm">
      <div style="margin-bottom:8mm">${kick('If someone has a concern')}${CONCERN.map(row).join('')}</div>
      <div style="margin-bottom:8mm">${kick('The sale, in 4 steps')}${SALE.map(row).join('')}</div>
      <div style="padding:3.6mm 4.4mm 4mm;background:#fff6ee;border-left:1mm solid ${C.flare}">
        ${kick('Never say')}
        ${NEVER.map((t) => `<div style="font-size:4mm;font-weight:600;line-height:1.4;margin-top:1.2mm;color:${C.ink}">✕&nbsp; “${esc(t)}”</div>`).join('')}</div>
    </div>${foot}`;
};

// ======================================================================
// INSTAGRAM POSTS, 1080 × 1350 px (4:5). One post per hook (HOOKS in kit.mjs): the question, the logo, "Link in bio".
// The legal line goes in the caption, not on the image. Sizes inside a post are in px. `npm run posts` saves PNGs.
// ======================================================================
const IW = 285.75, IH = 357.1875;   // 1080 × 1350 px at 96 dpi
const PX = 1080, PY = 1350, PM = 88, RIM = 1112;
export const INSTA_PX = [PX, PY];
export const INSTA_CSS = `
.post{position:relative;width:${PX}px;height:${PY}px;overflow:hidden}
.hook{font-weight:800;letter-spacing:-0.045em;line-height:0.94;font-size:190px;white-space:nowrap}
.sub{font-size:46px;font-weight:500;letter-spacing:-0.015em;line-height:1.2;margin-top:40px}
.foot{display:flex;justify-content:space-between;align-items:center}`;

// v1 Deep Field: the question top left, a constellation (with labels on the two "people" posts). No planet.
// v2 Paper: the same on light paper. v3 Big type: only the question, in the middle.
export const instaPost = (v, h) => {
  const k = LOOK[v];
  const big = v === 'v3', seed = `ig-${h.id}`;
  const text = `<div class="hook fit" style="color:${k.ink}">${lines(h.q, v)}</div>${h.sub && !big ? `<div class="sub" style="color:${k.sub}">${esc(h.sub)}</div>` : ''}`;
  const box = big
    ? `<div class="abs" style="left:${PM}px;right:${PM}px;top:0;bottom:${PY - RIM + 40}px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">${text}</div>`
    : `<div class="abs" style="left:${PM}px;right:${PM}px;top:${PM + 24}px">${text}</div>`;
  const labelled = ['want-connections', 'find-your-people'].includes(h.id);
  // a halo round each label, so no line runs through the words
  const figure = big ? '' : labelled
    ? constellationSvg({ w: PX, h: PY, box: [PM + 40, 600, PX - 2 * PM - 80, 360], seed: `${seed}-n`, count: 6, labels: LABELS, labelSize: 22, dark: k.dark })
      .replaceAll('class="mono-svg"', `class="mono-svg" stroke="${k.bg}" stroke-width="12" stroke-linejoin="round" paint-order="stroke"`)
    : constellationSvg({ w: PX, h: PY, box: [PX * 0.5, 700, PX * 0.36, 260], seed: `${seed}-c`, count: 5, dark: k.dark });
  const sky = k.dark
    ? skySvg({ w: PX, h: PY, seed, density: 0.022, band: big ? 0.15 : 0.32, haze: true })
    : skySvg({ w: PX, h: PY, seed, density: 0.007, band: 0, haze: false, dark: false, color: C.ink });
  const logo = `<div class="lockup" style="gap:14px">${markSvg({ front: k.front, back: k.back, size: '50px' })}<span class="wm" style="font-size:38px;color:${k.word}">BlueLink</span></div>`;
  return `<div class="post" style="background:${k.bg}">${sky}${figure}
    ${box}
    <div class="abs foot" style="left:${PM}px;right:${PM}px;bottom:${PM - 16}px">${logo}<span class="m" style="font-size:22px;color:${k.dark ? C.peri : C.ink3}">Link in bio</span></div></div>${FIT}`;
};

const insta = {
  id: 'insta', piece: 'insta', name: 'Instagram posts', size: `1080 × 1350 px (4:5), ${HOOKS.length} posts`, mm: [IW, IH], px: PY, css: INSTA_CSS,
  pages: HOOKS.map(hookText),
  print: 'Not for print. Post the JPG. Captions: npm run posts makes captions.txt. Put the legal line in every caption.',
  versions: [
    { id: 'v1', note: 'The night sky: the question top left, a constellation, the logo, and “Link in bio”.', html: (i) => instaPost('v1', HOOKS[i]) },
    { id: 'v2', note: 'The same on light paper.', html: (i) => instaPost('v2', HOOKS[i]) },
    { id: 'v3', note: 'Big type: only the question, in the middle.', html: (i) => instaPost('v3', HOOKS[i]) },
  ],
};

const PW = 210, PH = 297;
const faq = {
  id: 'faq', piece: 'faq', name: 'Staff FAQ', size: 'A4, 210 × 297 mm, two pages', mm: [PW, PH], pages: ['FAQ', 'Concerns and the sale'],
  print: 'Plain paper, A4, both sides of one sheet. For the team: keep one behind the table. Not for visitors.',
  versions: [{ id: 'v1', look: 'staff', note: 'White, two pages. Page 1: is it official, who can join, why pay, refunds, privacy, messages, deleting an account, safety, cheating. Page 2: what to do when someone has a concern, the sale in 4 steps, and what never to say.', html: faqPage }],
};

// every ₱ in Inter (see peso() in kit.mjs)
const withPeso = (asset) => ({ ...asset, versions: asset.versions.map((v) => ({ ...v, html: async (i) => peso(await v.html(i)) })) });

export default {
  page: 'booth',
  assets: [tarp, qrSign, flyer, ...hookFlyers, card, cardFounding, cardBackPrint, insta, faq].map(withPeso),
};
