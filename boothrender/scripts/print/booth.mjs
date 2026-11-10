// Print files for the BlueLink booth: every printed piece, in three looks (LOOKS in kit.mjs).
// Sizes in mm. `piece` is the id the 3D model uses. A version's html(i) returns page i.
// Words come from F in kit.mjs only. One QR on every print: URLS.home (https://bluelinkph.com).
// Every ₱ goes through peso() at the end, so it is set in Inter on purpose.
import { C, F, PASSES, URLS, LOOK, LABELS, CONNECT, HOOKS, EVENT, INFO, BOOTH, FAQ, SALE_STEPS, CONCERN, SCRIPT, OBJECTIONS, hookText, margin, esc, hiText, lockupFor, mark, markSvg, skySvg, horizonSvg, constellationSvg, plateSvg, qrTile, peso, seeded } from './kit.mjs';

// ---------- small helpers ----------
const at = (x, y, inner, style = '', cls = '') => `<div class="abs ${cls}" style="left:${x}mm;top:${y}mm;${style}">${inner}</div>`;
// like at(), but y is the space under the block
const atb = (x, y, inner, style = '', cls = '') => `<div class="abs ${cls}" style="left:${x}mm;bottom:${y}mm;${style}">${inner}</div>`;
// like at(), but x is the space right of the block
const atr = (x, y, inner, style = '', cls = '') => `<div class="abs ${cls}" style="right:${x}mm;top:${y}mm;${style}">${inner}</div>`;
const ground = (v, color) => `<div class="fill" style="background:${color || LOOK[v].bg}"></div>`;
const lines = (list, v) => list.map((l) => hiText(l, LOOK[v].hi)).join('<br>');
const mono = (t, size, color, extra = '') => `<span class="m nw" style="font-size:${size}mm;color:${color};${extra}">${t}</span>`;

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

// The posters (standee, header, QR sign, flyer) stay simple: the logo, one headline, the QR, one price, and one small legal line.
// No support line, no sun, no constellations, labels, plate marks, or coordinates. A quiet sky.
// The planet's edge is on the standee only, so it does not repeat on every piece.

// The QR on its white tile, "Scan to join" under it, then the link (in case the QR does not scan).
function qrCol(v, w, size, { label = 'Scan to join' } = {}) {
  const k = LOOK[v];
  const t = qrTile(URLS.home, w);
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
// STANDEE, 2 × 5 ft portrait (609.6 × 1524 mm), a tarpaulin on an X-stand. Stands on the floor at the back of the
// walkway, facing the aisle. The stand holds the bottom edge about 12 cm off the floor, so the top is near eye level.
// One picture: the planet's edge with a blue glow over it, with nothing in front of it. The sky holds the logo, the
// headline, and a constellation of what people are open to (LABELS). The planet's night side holds what to do: the QR
// beside "Scan to join." and the link, both plans, and the legal line. The QR sits at waist height (about 0.65–0.9 m).
// ======================================================================
const DW = 609.6, DH = 1524, DM = 46;

// The light around the QR: it is the brightest thing in the sky. Vector, so it prints sharp.
const sunGlow = (v, w, h, cx, cy, r) => {
  const dark = LOOK[v].dark;
  return `<svg class="fill" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sun-${v}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${C.glow}" stop-opacity="${dark ? 0.62 : 0.24}"/>
      <stop offset="0.42" stop-color="${C.glow}" stop-opacity="${dark ? 0.2 : 0.08}"/>
      <stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f1(r * 0.82)}" fill="url(#sun-${v})"/></svg>`;
};

// The constellation in the standee's sky, placed by hand in the shape of a dipper: a bowl on the right and a handle
// that curves down to the left. Stars come in different sizes, like a real chart, and lines stop short of each star.
// Each star: [x, y, radius, label index or -1, label side]. All stars are one color (no warm star on the standee).
// V3 (big type) has no labels.
const STANDEE_STARS = [
  [104, 622, 3.4, -1],          // the end of the handle
  [214, 548, 3.0, 1, 'down'],   // Finding a mentor
  [288, 526, 3.4, -1],
  [360, 528, 2.2, -1],
  [492, 498, 3.8, 0, 'up'],     // Internships
  [506, 622, 3.2, 3, 'down'],   // Events
  [376, 606, 2.6, 2, 'down'],   // Projects
];
const STANDEE_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]];
function standeeStars(v, labels) {
  const k = LOOK[v];
  const line = k.dark ? C.peri : C.ink, dot = k.dark ? C.star : C.ink;
  const pts = STANDEE_STARS, gap = 9;
  let out = '';
  for (const [a, b] of STANDEE_LINKS) {
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    out += `<line x1="${f1(x1 + ux * gap)}" y1="${f1(y1 + uy * gap)}" x2="${f1(x2 - ux * gap)}" y2="${f1(y2 - uy * gap)}" stroke="${line}" stroke-opacity="${k.dark ? 0.42 : 0.3}" stroke-width="0.8"/>`;
  }
  pts.forEach(([x, y, r, li, side], i) => {
    if (k.dark) out += `<circle cx="${x}" cy="${y}" r="${f1(r * 3.2)}" fill="${dot}" fill-opacity="0.1"/>`;
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${dot}"/>`;
    const t = li >= 0 && labels[li];
    if (t) out += `<text x="${x}" y="${side === 'up' ? y - 20 : y + 31}" text-anchor="middle" font-size="12" fill="${k.dark ? C.peri : C.ink3}" fill-opacity="${k.dark ? 0.85 : 1}" class="mono-svg">${esc(t)}</text>`;
  });
  return `<svg class="fill" viewBox="0 0 ${DW} ${DH}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

const standeePage = (v) => {
  const k = LOOK[v];
  const big = v === 'v3';
  const rim = 690;                                   // the planet's edge in the middle, under the blue glow
  // The QR sits on the planet's night side, well under the sunrise, so nothing covers the sky. Its middle is at about
  // 0.72 m off the floor (the stand holds the bottom edge about 12 cm up: height ≈ 1644 − y), where a phone points.
  const qrW = 232, qrY = rim + 118, rowGap = 30;
  // a block centred on the page
  const mid = (y, inner, style = '') => `<div class="abs" style="left:0;top:${y}mm;width:${DW}mm;display:flex;flex-direction:column;align-items:center;text-align:center;${style}">${inner}</div>`;
  const head = big
    ? `<div class="d nw" style="font-size:128mm;letter-spacing:-0.05em;line-height:0.9;color:${k.ink}">${lines(F.signoff, v)}</div>`
    : `<div class="d nw" style="font-size:97mm;line-height:0.96;color:${k.ink}">${lines(F.headline, v)}</div>`;
  const tile = qrTile(URLS.home, qrW, { style: k.dark ? '' : `outline:0.6mm solid ${k.rule}` }).html;
  const scan = `<div style="display:flex;flex-direction:column;align-items:flex-start;text-align:left">
      <div class="d nw" style="font-size:58mm;letter-spacing:-0.045em;line-height:0.94;color:${k.ink}">Scan to<br>${hiText('*join.*', k.hi)}</div>
      <div class="nw" style="margin-top:12mm;font-size:15mm;font-weight:600;letter-spacing:-0.005em;color:${k.sub}">${esc(F.site)}</div></div>`;
  const priceY = 1150;                             // the price, midway between the QR row and the legal line
  return `
    ${ground(v)}
    ${sky(v, DW, DH, big ? 'standee-big' : 'standee', { density: 0.0065, avoid: STANDEE_STARS.map(([x, y]) => [x - 16, y - 16, 32, 32]) })}
    ${sunGlow(v, DW, DH, DW / 2, rim, 340)}
    ${horizon(v, DW, DH, rim, { curve: 1.3 })}
    ${standeeStars(v, big ? [] : LABELS)}
    ${mid(58, lockupFor(v, 52))}
    ${mid(big ? 160 : 150, head)}
    ${mid(qrY, `<div style="display:flex;align-items:center;gap:${rowGap}mm">${tile}${scan}</div>`)}
    <div class="abs" style="left:${DM}mm;width:${DW - 2 * DM}mm;top:${priceY - 66}mm;border-top:0.6mm solid ${k.rule}"></div>
    ${mid(priceY, `<div class="nw" style="display:flex;align-items:baseline;gap:5mm">
        <span class="d" style="font-size:74mm;letter-spacing:-0.045em;line-height:1;color:${k.ink}">${F.price}</span>
        <span style="font-size:25mm;font-weight:600;letter-spacing:-0.015em;color:${k.sub}">for a year</span></div>
      <div class="nw" style="margin-top:9mm;font-size:21mm;font-weight:500;letter-spacing:-0.01em;color:${k.sub}">or <b style="font-weight:700;color:${k.ink}">${F.life}</b> for lifetime</div>`)}
    ${mid(DH - 104, legal(F.posterLegal, 11, k.muted, 'white-space:nowrap'))}`;
};

const standee = {
  id: 'standee', piece: 'standee', name: 'Standee', size: '2 × 5 ft (610 × 1524 mm), portrait', mm: [DW, DH], pages: ['Standee'],
  print: 'Tarpaulin standee, 2 × 5 ft (24 × 60 in), matte, portrait, with eyelets in the 4 corners for an X-stand. Send the PDF. Test the QR on 2 phones from 1 m and 2 m before printing. Stand it at the back of the walkway, facing the aisle.',
  versions: [
    { id: 'v1', note: 'The night sky: the logo, “Welcome to Atenean Networking”, a dipper-shaped constellation of what people are open to, and the planet’s edge with a blue glow. On the night side: the QR beside “Scan to join.”, then both plans.', html: () => standeePage('v1') },
    { id: 'v2', note: 'Paper: the same layout on light paper, navy type, “Networking” in BlueLink blue.', html: () => standeePage('v2') },
    { id: 'v3', note: 'Big type: “Find your people.”, an unlabelled constellation, the planet’s edge, and the QR and both plans on the night side.', html: () => standeePage('v3') },
  ],
};

// ======================================================================
// HEADER, 3.5 × 1.25 ft landscape (1066.8 × 381 mm). Optional. Hangs from the front bar of the tent, across our half.
// The booth's name sign: the logo big, and one line that is not on the standee (the standee in V1 and V2 says
// "Welcome to Atenean Networking", so the header says "Find your people."; in V3 it is the other way round).
// The planet's edge runs along the bottom, like the standee. With a 2.0 m eave its bottom edge is at about 1.62 m.
// No QR (too high to scan; the QR sign and the standee do that).
// ======================================================================
const HW = 1066.8, HH = 381, HM = 58;

const headerPage = (v) => {
  const k = LOOK[v];
  const big = v === 'v3';
  const rim = HH - 48;                        // the planet's edge, 48 mm above the bottom in the middle
  const logoH = 150;
  // One block in the middle of the sky: the mark on the left, centred on the two lines beside it. The lines are the
  // wordmark and, close under it, the subheading in a regular weight (not bold). CAP sets each line's box to Inter's
  // cap height (0.7275 em), so the column runs from the top of "BlueLink" to the subheading's baseline, and centring
  // the mark on the column centres it on the letters, not on the empty space above and below them.
  const CAP = 0.7275;
  const sub = hiText((big ? F.headline : F.signoff).join(' '), k.hi);
  const lines2 = `<div style="display:flex;flex-direction:column;align-items:flex-start">
      <span class="wm" style="font-size:${f1(logoH * 0.68)}mm;line-height:${CAP};color:${k.word}">BlueLink</span>
      <div class="nw" style="margin-top:${big ? 24 : 26}mm;font-size:${big ? 44 : 52}mm;font-weight:500;letter-spacing:-0.02em;line-height:${CAP};color:${k.ink}">${sub}</div></div>`;
  return `
    ${ground(v)}
    ${sky(v, HW, HH, big ? 'header-big' : 'header', { density: 0.006 })}
    ${horizon(v, HW, HH, rim, { curve: 3.4 })}
    <div class="abs" style="left:${HM}mm;right:${HM}mm;top:0;height:${rim}mm;display:flex;align-items:center;justify-content:center;gap:${f1(logoH * 0.3)}mm">
      ${mark(logoH, { front: k.front, back: k.back })}${lines2}</div>
    <div class="abs" style="left:0;width:${HW}mm;top:${rim + 18}mm;display:flex;justify-content:center">${legal(F.posterLegal, 9, k.muted, 'white-space:nowrap')}</div>`;
};

const header = {
  id: 'header', piece: 'header', name: 'Header', size: '3.5 × 1.25 ft (1067 × 381 mm), landscape', mm: [HW, HH], pages: ['Header'],
  print: 'Tarpaulin, 3.5 × 1.25 ft (42 × 15 in), matte, with grommets in the 4 corners. Optional. Zip-tie the top grommets to the front bar of the tent, across our half only. Measure the eave first: with a 2.0 m eave the bottom edge is at 1.62 m.',
  versions: [
    { id: 'v1', note: 'The night sky: the logo big, “Find your people.”, and the planet’s edge along the bottom.', html: () => headerPage('v1') },
    { id: 'v2', note: 'Paper: the same layout on light paper, navy type, “people.” in BlueLink blue.', html: () => headerPage('v2') },
    { id: 'v3', note: 'Big type: the logo big and “Welcome to Atenean Networking” (the V3 standee says “Find your people.”).', html: () => headerPage('v3') },
  ],
};

// ======================================================================
// QR SIGN, A4 portrait (210 × 297 mm), in an A4 acrylic stand on the table. One job: get a scan.
// QR at 120 mm scans from about 1.2 m.
// ======================================================================
const AW = 210, AH = 297, AM = 16;

// Flat: one ground color, no sky, no planet. Three layouts, one per look. Each one puts the QR on the page's
// centre line, as big as the page allows, and both plans along the bottom.
const AC = AW / 2;
// a block centred on the page's centre line
const atc = (y, inner, style = '') => `<div class="abs" style="left:0;top:${y}mm;width:${AW}mm;display:flex;flex-direction:column;align-items:center;text-align:center;${style}">${inner}</div>`;
const site = (v, s, extra = '') => `<div class="nw" style="font-size:${s}mm;font-weight:700;letter-spacing:-0.01em;color:${LOOK[v].ink};${extra}">${esc(F.site)}</div>`;
// one plan: the price big, its name under it
const plan = (v, price, name, s, align = 'left') => {
  const k = LOOK[v];
  return `<div style="text-align:${align}"><div class="d nw" style="font-size:${s}mm;letter-spacing:-0.035em;line-height:1;color:${k.ink}">${price}</div>
    <div class="nw" style="margin-top:${f1(s * 0.22)}mm;font-size:${f1(s * 0.3)}mm;font-weight:600;letter-spacing:-0.01em;color:${k.sub}">${name}</div></div>`;
};
const PLANS_NOTE = 'Same app on both plans. Full refund within 7 days.';

// V1: everything on the centre line: the QR, then the price as one sentence.
const qrSignCentred = (v) => {
  const k = LOOK[v];
  const qrW = 128, qrY = 72, pad = 7;
  return `
    ${ground(v)}
    ${atc(AM + 2, lockupFor(v, 10))}
    ${atc(34, `<div class="d nw" style="font-size:22mm;color:${k.ink}">Scan to ${hiText('*join.*', k.hi)}</div>`)}
    ${at(AC - qrW / 2, qrY, qrTile(URLS.home, qrW).html)}
    ${atc(qrY + qrW + pad + 5, site(v, 5.6))}
    ${atc(225, `<div class="nw" style="display:flex;align-items:baseline;gap:3.4mm">
        <span class="d" style="font-size:19mm;letter-spacing:-0.04em;line-height:1;color:${k.ink}">${F.price}</span>
        <span style="font-size:6.6mm;font-weight:600;letter-spacing:-0.015em;color:${k.sub}">for a year</span></div>
      <div class="nw" style="margin-top:3mm;font-size:5.4mm;font-weight:500;letter-spacing:-0.01em;color:${k.sub}">or <b style="font-weight:700;color:${k.ink}">${F.life}</b> for lifetime</div>
      ${legal(PLANS_NOTE, 3.4, k.muted, 'margin-top:5.5mm')}`)}
    ${atc(AH - AM - 3, legal(F.posterLegal, 3, k.muted))}`;
};

// V2: a price list. The heading on the left, the QR on the centre line, and the plans in a ruled two-column table.
const qrSignTable = (v) => {
  const k = LOOK[v];
  const qrW = 136, qrY = 66, CW = AW - 2 * AM;
  const cell = (price, name, first) => `<div style="flex:1;padding:4.5mm ${first ? '6mm 5mm 0' : '0 5mm 6mm'};${first ? '' : `border-left:0.3mm solid ${k.rule};`}">
      <div class="nw" style="font-size:4.6mm;font-weight:600;color:${k.sub}">${name}</div>
      <div class="d nw" style="margin-top:2.4mm;font-size:17mm;letter-spacing:-0.035em;line-height:1;color:${k.ink}">${price}</div></div>`;
  return `
    ${ground(v)}
    ${at(AM, AM, lockupFor(v, 10))}
    ${at(AM, 32, `<div class="d nw" style="font-size:22mm;color:${k.ink}">Scan to ${hiText('*join.*', k.hi)}</div>`)}
    ${at(AC - qrW / 2, qrY, qrTile(URLS.home, qrW, { style: k.dark ? '' : `outline:0.3mm solid ${k.rule}` }).html)}
    ${atc(qrY + qrW + 5, site(v, 5.6))}
    ${at(AM, 224, `<div style="display:flex;border-top:0.6mm solid ${k.ink};border-bottom:0.3mm solid ${k.rule}">${cell(F.price, '1 year', true)}${cell(F.life, 'Lifetime', false)}</div>
      ${legal(PLANS_NOTE, 3.6, k.sub, 'margin-top:3.6mm')}`, `width:${CW}mm`)}
    ${atb(AM, AM - 3, legal(F.posterLegal, 3, k.muted))}`;
};

// V3: big type. "Find your people." across the top, the QR on the centre line, the two plans set large, left and right.
const qrSignBig = (v) => {
  const k = LOOK[v];
  const qrW = 118, qrY = 100, CW = AW - 2 * AM;
  return `
    ${ground(v)}
    ${at(AM, AM, lockupFor(v, 10))}
    ${at(AM, 33, `<div class="d" style="font-size:29mm;letter-spacing:-0.05em;line-height:0.9;color:${k.ink}">${lines(F.signoff, v)}</div>`)}
    ${at(AC - qrW / 2, qrY, qrTile(URLS.home, qrW).html)}
    ${atc(qrY + qrW + 5, `<div class="nw" style="font-size:5.6mm;font-weight:700;color:${k.ink}">Scan to join</div>${site(v, 4.2, `margin-top:1.2mm;font-weight:500;color:${k.sub}`)}`)}
    ${at(AM, 240, `<div style="border-top:0.3mm solid ${k.rule};padding-top:6mm">
        <div class="nw" style="display:flex;align-items:baseline;gap:3.4mm">
          <span class="d" style="font-size:19mm;letter-spacing:-0.04em;line-height:1;color:${k.ink}">${F.price}</span>
          <span style="font-size:6.6mm;font-weight:600;letter-spacing:-0.015em;color:${k.sub}">for a year, or <b style="font-weight:700;color:${k.ink}">${F.life}</b> for lifetime</span></div></div>`, `width:${CW}mm`)}
    ${atb(AM, AM - 3, legal(`${F.posterLegal} Full refund within 7 days.`, 3, k.muted))}`;
};

const qrSign = {
  id: 'qr', piece: 'qr', name: 'QR sign', size: 'A4, 210 × 297 mm, QR 12–14 cm', mm: [AW, AH], pages: ['Sign'],
  print: 'Glossy or matte A4, in an A4 acrylic stand. One sign per stand. Test the QR on 2 phones before printing.',
  versions: [
    { id: 'v1', note: 'Centred, near-black: “Scan to join.”, a 128 mm QR, and both plans split by a hairline.', html: () => qrSignCentred('v1') },
    { id: 'v2', note: 'Price list, on paper: “Scan to join.”, a 136 mm QR, and both plans in a ruled two-column table.', html: () => qrSignTable('v2') },
    { id: 'v3', note: 'Big type, near-black: “Find your people.”, a 118 mm QR, and both plans set large, left and right.', html: () => qrSignBig('v3') },
  ],
};

// ======================================================================
// FLYER, A6 (105 × 148 mm), two sides. 4 per A4 sheet. Front: the headline, the QR, the price.
// Back: 3 short reasons, both plans, the refund line, and the legal lines.
// ======================================================================
const FW = 105, FH = 148, FM = 8;

// ---------- flyer pictures ----------
// Each flyer front has its own composition and its own picture from the brand (horizon, constellation, two stars,
// empty sky, a giant word, a star chart, a sunrise), so a stack of them does not read as one template.
// Every picture is drawn in mm on one SVG the size of the page.
const fsvg = (inner) => `<svg class="fill" viewBox="0 0 ${FW} ${FH}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
// one star: a dot, with a soft halo on dark grounds (and on paper, for a coloured star)
const starDot = (v, x, y, r, color) => {
  const k = LOOK[v];
  const c = color || (k.dark ? C.star : C.ink);
  const halo = k.dark || color
    ? `<circle cx="${x}" cy="${y}" r="${f1(r * 7)}" fill="${c}" fill-opacity="${k.dark ? 0.05 : 0.08}"/><circle cx="${x}" cy="${y}" r="${f1(r * 3.2)}" fill="${c}" fill-opacity="${k.dark ? 0.13 : 0.18}"/>`
    : '';
  return `${halo}<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
};
// a constellation line between two stars
const join = (v, [x1, y1], [x2, y2], op) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LOOK[v].dark ? C.peri : C.ink}" stroke-opacity="${op ?? (LOOK[v].dark ? 0.6 : 0.45)}" stroke-width="0.14"/>`;
// the question, with its one blue word. .fit shrinks it to the width of its box.
const question = (v, h, size, extra = '') => `<div class="d fit nw" style="font-size:${size}mm;letter-spacing:-0.05em;line-height:0.92;color:${LOOK[v].ink};${extra}">${lines(h.q, v)}</div>`;
const subLine = (v, t, size = 4.6, extra = '') => `<div class="nw" style="font-size:${size}mm;font-weight:600;letter-spacing:-0.01em;color:${LOOK[v].sub};${extra}">${esc(t)}</div>`;
// "Scan to join" and the link, set beside a QR instead of under it
const scanText = (v, s = 3.4) => `<div class="nw" style="font-size:${s}mm;font-weight:700;letter-spacing:-0.015em;line-height:1.1;color:${LOOK[v].ink}">Scan to join</div>
  <div class="nw" style="margin-top:0.8mm;font-size:${f1(s * 0.72)}mm;font-weight:500;color:${LOOK[v].sub}">${esc(F.site)}</div>`;
const CW_F = FW - 2 * FM;
// the one line some fronts use instead of a separate price: "Scan to join for ₱99 a year."
const scanLine = (v, size = 3.3, align = 'left') => `<div class="nw" style="font-size:${size}mm;font-weight:600;letter-spacing:-0.01em;text-align:${align};color:${LOOK[v].sub}">Scan to join for <b style="font-weight:800;color:${LOOK[v].ink}">${F.price}</b> ${F.per}.</div>`;
const fitBox = (x, y, inner, w = CW_F) => at(x, y, inner, `width:${w}mm`);

// HORIZON (the main flyer). The standee's planet, small: the headline in the sky, the QR and the price on the night side.
const frontHorizon = (v) => {
  const k = LOOK[v];
  const big = v === 'v3';
  const qrW = 26;
  return `
    ${ground(v)}
    ${sky(v, FW, FH, 'flyer', { density: 0.016 })}
    ${horizon(v, FW, FH, 97, { curve: 1.5 })}
    ${at(FM, FM, lockupFor(v, 6))}
    ${at(FM, 27, big
      ? `<div class="d" style="font-size:20mm;letter-spacing:-0.05em;line-height:0.9;color:${k.ink}">${lines(F.signoff, v)}</div>`
      : `<div class="d" style="font-size:13mm;color:${k.ink}">${lines(F.headline, v)}</div>`)}
    ${atb(FW - FM - qrW, FM, qrCol(v, qrW, 2.6))}
    ${atb(FM, FM + 1, priceLine(v, 9))}`;
};

// CONSTELLATION ("Want connections?"). A hand-placed figure: you (the warm star) in the middle, joined to four stars
// for what BlueLink connects you to (CONNECT in kit.mjs). Labels sit above the high stars and below the low ones, so
// no line crosses a label. The question under it, then a ruled footer: the QR on the left, the price on the right.
const CONNECT_YOU = [52.5, 50];
const CONNECT_STARS = [[25, 34, 'up'], [76, 30, 'up'], [82, 64, 'down'], [21, 67, 'down']];   // same order as CONNECT
const frontConstellation = (v, h) => {
  const k = LOOK[v];
  const qrW = 22, qrY = FH - FM - qrW, ls = 2.3;
  const you = CONNECT_YOU, pts = CONNECT_STARS;
  const figure = pts.map((p) => join(v, you, p)).join('') + join(v, pts[1], pts[2], k.dark ? 0.32 : 0.25)
    + pts.map(([x, y]) => starDot(v, x, y, 0.5)).join('') + starDot(v, ...you, 0.68, C.flare)
    + pts.map(([x, y, side], i) => `<text x="${x}" y="${side === 'up' ? y - 3.4 : y + 5.4}" text-anchor="middle" font-size="${ls}" fill="${k.dark ? C.peri : C.ink3}" class="mono-svg">${esc(CONNECT[i])}</text>`).join('')
    + `<text x="${you[0]}" y="${you[1] + 5.6}" text-anchor="middle" font-size="2.5" font-weight="600" fill="${k.sub}" style="font-family:'Inter BL',Inter,sans-serif">You</text>`;
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: 0.012, avoid: [...pts, you].map(([x, y]) => [x - 13, y - 8, 26, 16]) })}
    ${fsvg(figure)}
    ${at(FM, FM, lockupFor(v, 6))}
    ${fitBox(FM, 81, question(v, h, 16))}
    <div class="abs" style="left:${FM}mm;width:${CW_F}mm;top:${qrY - 4.5}mm;border-top:0.25mm solid ${k.rule}"></div>
    ${at(FM, qrY, qrTile(URLS.home, qrW).html)}
    ${at(FM + qrW + 4, qrY + 1.2, scanText(v))}
    <div class="abs" style="right:${FM}mm;bottom:${FM + 0.6}mm">${priceLine(v, 9)}</div>`;
};

// TWO STARS ("Need a mentor?"). One long line from you (the warm star) up to a bright star: someone who has been there.
// The QR top right, the question set low on the page.
const frontTwoStars = (v, h) => {
  const k = LOOK[v];
  const qrW = 24;
  const A = [76, 58], B = [21, 92];
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: 0.012, avoid: [[A[0] - 6, A[1] - 6, 12, 12], [B[0] - 5, B[1] - 5, 10, 10]] })}
    ${fsvg(`${join(v, A, B)}${starDot(v, ...A, 0.95)}${starDot(v, ...B, 0.62, C.flare)}
      <text x="${B[0] + 3.4}" y="${B[1] + 4.6}" font-size="2.5" font-weight="600" fill="${k.sub}" style="font-family:'Inter BL',Inter,sans-serif">You</text>`)}
    ${at(FM, FM, lockupFor(v, 6))}
    ${at(FW - FM - qrW, FM, qrCol(v, qrW, 2.5))}
    ${fitBox(FM, 106, question(v, h, 17))}`;
};

// PLAIN ("Shy to network?"). No picture: the question set big in the middle of the sky, and the QR footer.
const frontPlain = (v, h) => {
  const k = LOOK[v];
  const qrW = 23;
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: 0.016 })}
    ${at(FM, FM, lockupFor(v, 6))}
    ${fitBox(FM, 44, question(v, h, 23))}
    ${atb(FM, FM, `<div style="display:flex;align-items:flex-end;gap:4.5mm">${qrTile(URLS.home, qrW).html}<div style="padding-bottom:0.3mm">${scanLine(v)}<div style="margin-top:0.8mm;font-size:2.5mm;font-weight:500;color:${k.sub}">${esc(F.site)}</div></div></div>`)}`;
};

// ---------- the app's UI, drawn on a flyer (People and Event fronts) ----------
// A card in the app's dark UI: deep navy, a thin periwinkle edge, 1 mm corners, a soft glow behind it.
const uiCard = (id, x, y, w, h) => `<defs><radialGradient id="${id}" cx="${f1(x + w / 2)}" cy="${f1(y + h / 2)}" r="64" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.glow}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${f1(x + w / 2)}" cy="${f1(y + h / 2)}" r="64" fill="url(#${id})"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${C.deep}" stroke="${C.peri}" stroke-opacity="0.4" stroke-width="0.3"/>`;
// Line icons like the app's (Phosphor, bold), s mm square, top-left at x, y.
const uiIcon = (name, x, y, s, color) => {
  const g = (d) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s / 24)})" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
  if (name === 'search') return g('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.2 15.2 20.5 20.5"/>');
  if (name === 'calendar') return g('<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>');
  if (name === 'going') return g('<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.6l2.2 2.2 4.2-4.4"/>');
  if (name === 'clock') return g('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12h4.2"/>');
  if (name === 'pin') return g('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>');
  if (name === 'like') return g('<path d="M7.5 10.5v9.5h-3v-9.5zM7.5 10.5 11 3.5a2.4 2.4 0 0 1 2.4 2.4V9h5.4a1.8 1.8 0 0 1 1.8 2.1l-1.4 7.4a1.8 1.8 0 0 1-1.8 1.5H7.5"/>');
  if (name === 'comment') return g('<path d="M4.5 19.5l1.3-3.9A8 8 0 1 1 8.6 18.3z"/>');
  return '';
};
// an initials avatar
const uiAvatar = (cx, cy, r, initials, bg, fg = '#fff') => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="${bg}"/>
  <text x="${f1(cx)}" y="${f1(cy + r * 0.36)}" text-anchor="middle" font-size="${f1(r * 0.95)}" font-weight="700" fill="${fg}" style="font-family:'Inter BL',Inter,sans-serif">${initials}</text>`;
// an open-to chip, on (Signal) or off (faint)
const uiChip = (t, on, h = 5.4, s = 2.6) => `<span class="nw" style="display:inline-flex;align-items:center;height:${h}mm;padding:0 ${f1(h * 0.42)}mm;border-radius:1mm;font-size:${s}mm;font-weight:600;background:${on ? C.signal : 'rgba(147,168,255,0.16)'};color:${on ? '#fff' : C.peri}">${t}</span>`;
// the QR footer most hook fronts share: the QR, "Scan to join for ₱99 a year.", and the link
const qrFoot = (v, qrW = 22) => atb(FM, FM, `<div style="display:flex;align-items:flex-end;gap:4.5mm">${qrTile(URLS.home, qrW).html}<div style="padding-bottom:0.3mm">${scanLine(v)}<div style="margin-top:0.8mm;font-size:2.5mm;font-weight:500;color:${LOOK[v].sub}">${esc(F.site)}</div></div></div>`);

// PEOPLE ("Open for work?"). The app's People screen: the search box (its real placeholder), the Projects filter on,
// and three members who put their skills on their profile, each with Connect. It shows the point: put up what you
// are good at, and people looking for help find you. Examples, labelled; no made-up names, only what each one does.
const PEOPLE = [
  ['VE', 'I edit videos and reels.', 'AB Communication ’29', C.signal],
  ['UX', 'I design apps and websites.', 'BFA Information Design ’27', C.glow],
  ['MT', 'I tutor calculus and physics.', 'BS Applied Mathematics ’28', '#4b5fd6'],
];
const frontPeople = (v, h) => {
  const cx = FM, cy = 54, cw = CW_F, rowY = cy + 25, rowH = 10.4, ch = 25 + PEOPLE.length * rowH + 1.6;
  const rows = PEOPLE.map(([ini, what, course, bg], i) => {
    const y = rowY + i * rowH;
    return `${i ? `<line x1="${cx + 5}" y1="${f1(y)}" x2="${cx + cw - 5}" y2="${f1(y)}" stroke="${C.peri}" stroke-opacity="0.14" stroke-width="0.22"/>` : ''}
      ${uiAvatar(cx + 8.8, y + rowH / 2, 3.7, ini, bg)}`;
  }).join('');
  const rowText = PEOPLE.map(([, what, course], i) => {
    const y = rowY + i * rowH;
    return `${at(cx + 15.4, y + 2.1, `<div class="nw" style="font-size:2.95mm;font-weight:700;letter-spacing:-0.015em;line-height:1.1;color:${C.star}">${esc(what)}</div>
        <div class="nw" style="margin-top:0.9mm;font-size:2.45mm;font-weight:500;line-height:1.1;color:${C.sub}">${esc(course)}</div>`)}
      <div class="abs nw" style="left:${f1(cx + cw - 5 - 14.5)}mm;top:${f1(y + rowH / 2 - 2.6)}mm;width:14.5mm;height:5.2mm;border-radius:1mm;background:${C.signal};display:flex;align-items:center;justify-content:center;font-size:2.5mm;font-weight:700;color:#fff">Connect</div>`;
  }).join('');
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: 0.014, avoid: [[cx - 2, cy - 2, cw + 4, ch + 4]] })}
    ${fsvg(`${uiCard('peopleglow', cx, cy, cw, ch)}
      <rect x="${cx + 5}" y="${cy + 5}" width="${cw - 10}" height="7" rx="1" fill="${C.peri}" fill-opacity="0.07" stroke="${C.peri}" stroke-opacity="0.28" stroke-width="0.25"/>
      ${uiIcon('search', cx + 7, cy + 6.6, 3.8, C.muted)}
      <line x1="${cx + 5}" y1="${cy + 23.4}" x2="${cx + cw - 5}" y2="${cy + 23.4}" stroke="${C.peri}" stroke-opacity="0.22" stroke-width="0.25"/>
      ${rows}`)}
    ${at(cx + 12.6, cy + 7.15, `<div class="nw" style="font-size:2.75mm;font-weight:500;color:${C.muted}">Search names, courses, or skills</div>`)}
    ${at(cx + 5, cy + 15, `<div style="display:flex;gap:1.5mm">${uiChip('Projects', true)}${uiChip('Internships', false)}${uiChip('Coffee chats', false)}</div>`)}
    <div class="abs m nw" style="right:${FW - cx - cw + 5}mm;top:${cy + 16.4}mm;font-size:2.2mm;color:${C.muted}">Examples</div>
    ${rowText}
    ${at(FM, FM, lockupFor(v, 6))}
    ${fitBox(FM, 22, question(v, h, 15.5))}
    ${qrFoot(v)}`;
};

// EVENTS ("What's on this week?"). The app's Upcoming events list, drawn in its UI: three example events, each with
// its date tile, title, time and place, and the Going button (the first one on). Events, the upcoming list, and Going
// are all real in the app. Examples, labelled; no going counts (BRAND.md allows no made-up numbers).
const EVENTS = [
  ['Nov', '17', 'Résumé and interview clinic', 'Tue, 3:00 PM · Faura Hall', true],
  ['Nov', '19', 'Startup pitch night', 'Thu, 6:00 PM · Leong Hall', false],
  ['Nov', '20', 'Career talk: your first internship', 'Fri, 4:00 PM · MVP', false],
];
const frontEvent = (v, h) => {
  const cx = FM, cy = 55, cw = CW_F, rowY = cy + 13, rowH = 12.4, ch = 13 + EVENTS.length * rowH + 2.4;
  const bw = 15.5, bh = 5.4;                      // the Going button
  const rows = EVENTS.map(([, , , , on], i) => {
    const y = rowY + i * rowH, bx = cx + cw - 5 - bw, by = y + rowH / 2 - bh / 2;
    return `${i ? `<line x1="${cx + 5}" y1="${f1(y)}" x2="${cx + cw - 5}" y2="${f1(y)}" stroke="${C.peri}" stroke-opacity="0.14" stroke-width="0.22"/>` : ''}
      <rect x="${cx + 5}" y="${f1(y + 1.6)}" width="10.4" height="9.2" rx="1" fill="${C.peri}" fill-opacity="0.12" stroke="${C.peri}" stroke-opacity="0.3" stroke-width="0.25"/>
      <rect x="${f1(bx)}" y="${f1(by)}" width="${bw}" height="${bh}" rx="1" fill="${on ? C.signal : 'none'}" fill-opacity="${on ? 0.24 : 0}" stroke="${C.peri}" stroke-opacity="${on ? 0 : 0.32}" stroke-width="0.25"/>
      ${uiIcon(on ? 'going' : 'calendar', bx + 1.6, by + 1, 3.3, on ? C.peri : C.muted)}`;
  }).join('');
  const rowText = EVENTS.map(([mon, day, title, when, on], i) => {
    const y = rowY + i * rowH, bx = cx + cw - 5 - bw, by = y + rowH / 2 - bh / 2;
    return `<div class="abs" style="left:${cx + 5}mm;top:${f1(y + 1.6)}mm;width:10.4mm;height:9.2mm;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="m nw" style="font-size:1.8mm;line-height:1;color:${C.peri}">${mon}</div><div class="nw" style="margin-top:0.5mm;font-size:4.3mm;font-weight:800;letter-spacing:-0.03em;line-height:1;color:${C.star}">${day}</div></div>
      ${at(cx + 18.6, y + 2.5, `<div class="nw" style="font-size:2.95mm;font-weight:700;letter-spacing:-0.015em;line-height:1.1;color:${C.star}">${esc(title)}</div>
        <div class="nw" style="margin-top:1mm;font-size:2.4mm;font-weight:500;line-height:1.1;color:${C.sub}">${esc(when)}</div>`)}
      ${at(bx + 5.6, by + 1.35, `<div class="nw" style="font-size:2.5mm;font-weight:${on ? 700 : 600};color:${on ? C.peri : C.muted}">Going</div>`)}`;
  }).join('');
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: 0.014, avoid: [[cx - 2, cy - 2, cw + 4, ch + 4]] })}
    ${fsvg(`${uiCard('eventglow', cx, cy, cw, ch)}
      ${uiIcon('calendar', cx + 5, cy + 4.6, 3.5, C.peri)}
      <line x1="${cx + 5}" y1="${cy + 11.2}" x2="${cx + cw - 5}" y2="${cy + 11.2}" stroke="${C.peri}" stroke-opacity="0.22" stroke-width="0.25"/>
      ${rows}`)}
    ${at(cx + 9.8, cy + 5, `<div class="nw" style="font-size:2.8mm;font-weight:700;color:${C.peri}">Upcoming events</div>`)}
    <div class="abs m nw" style="right:${FW - cx - cw + 5}mm;top:${cy + 5.3}mm;font-size:2.2mm;color:${C.muted}">Examples</div>
    ${rowText}
    ${at(FM, FM, lockupFor(v, 6))}
    ${fitBox(FM, 22, question(v, h, 15.5))}
    ${qrFoot(v)}`;
};

// STAR CHART (the fallback front for a hook with no HOOK_FRONT entry). A chart plate that is also a week: faint stars are things happening,
// and two stars share one slot, joined by a short line: you (the warm one) and someone going to the same thing.
const frontStarChart = (v, h) => {
  const k = LOOK[v];
  const big = v === 'v3';
  const qrW = 24;
  const days = ['M', 'T', 'W', 'TH', 'F', 'S'];
  const gx = FM, gy = big ? 64 : 60, gw = CW_F, rows = 4, rh = 9.5, cw = gw / days.length, gh = rows * rh;
  const rand = seeded(`chart-${h.id}`);
  const grid = [
    ...days.map((_, i) => i && `<line x1="${f1(gx + i * cw)}" y1="${gy}" x2="${f1(gx + i * cw)}" y2="${gy + gh}"/>`),
    ...Array.from({ length: rows + 1 }, (_, r) => `<line x1="${gx}" y1="${f1(gy + r * rh)}" x2="${gx + gw}" y2="${f1(gy + r * rh)}"/>`),
  ].filter(Boolean).join('');
  const pair = { c: 2, r: 2 };
  let field = '';
  for (let c = 0; c < days.length; c++) for (let r = 0; r < rows; r++) {
    if (c === pair.c && r === pair.r) continue;
    if (rand() < 0.45) field += starDot(v, f1(gx + c * cw + 2 + rand() * (cw - 4)), f1(gy + r * rh + 2 + rand() * (rh - 4)), f1(0.22 + rand() * 0.12));
  }
  const p1 = [f1(gx + pair.c * cw + cw * 0.3), f1(gy + pair.r * rh + rh * 0.38)], p2 = [f1(gx + pair.c * cw + cw * 0.7), f1(gy + pair.r * rh + rh * 0.62)];
  const labels = days.map((d, i) => `<text x="${f1(gx + i * cw + cw / 2)}" y="${gy - 2.2}" text-anchor="middle" font-size="2.1" fill="${k.muted}" class="mono-svg">${d}</text>`).join('');
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: 0.008, avoid: [[gx - 2, gy - 6, gw + 4, gh + 8]] })}
    ${fsvg(`<g stroke="${k.dark ? C.peri : C.ink}" stroke-opacity="${k.dark ? 0.16 : 0.14}" stroke-width="0.14" fill="none">${grid}</g>${labels}${field}
      ${join(v, p1, p2, k.dark ? 0.8 : 0.6)}${starDot(v, ...p1, 0.62)}${starDot(v, ...p2, 0.62, C.flare)}`)}
    ${at(FM, FM, lockupFor(v, 6))}
    ${fitBox(FM, 24, question(v, h, big ? 18 : 14))}
    ${atb(FW - FM - qrW, FM, qrCol(v, qrW, 2.5))}
    ${atb(FM, FM + 1, priceLine(v, 9))}`;
};

// SUNRISE ("Building a startup?"). The planet's edge high on the page with the sun about to come up.
// The question sits on the planet's night side.
const frontSunrise = (v, h) => {
  const qrW = 24;
  return `
    ${ground(v)}
    ${sky(v, FW, FH, `flyer-${h.id}`, { density: 0.02 })}
    ${horizon(v, FW, FH, 46, { curve: 1.1, sun: true })}
    ${at(FM, FM, lockupFor(v, 6))}
    ${fitBox(FM, 64, question(v, h, 16))}
    ${atb(FW - FM - qrW, FM, qrCol(v, qrW, 2.5))}
    ${atb(FM, FM + 1, priceLine(v, 9))}`;
};

// which composition each hook flyer uses, and a line for its notes
const HOOK_FRONT = {
  'want-connections': [frontConstellation, 'a hand-placed constellation: you in the middle, joined to Events, Opportunities, Businesses, and Orgs; the question under it, and a ruled footer with the QR'],
  'need-a-mentor': [frontTwoStars, 'two stars and one long line (you, in warm Flare, up to a bright star), the QR top right, the question at the bottom'],
  'shy-to-network': [frontPlain, 'plain: the question set big in the middle, the QR bottom left'],
  'open-for-work': [frontPeople, 'the app’s People screen: the search box, the Projects filter on, and three example members with their skills (video, design, tutoring), each with Connect'],
  'events': [frontEvent, 'the app’s Upcoming events list (Examples): three talks and workshops with their date, time, and place, and the Going button'],
  'startup': [frontSunrise, 'the planet’s edge high on the page with the sun coming up, the question on the night side'],
};
const flyerFront = frontHorizon;

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
    ${atb(FM, FM, legal(F.posterLegal, 2.9, k.muted), `width:${FW - 2 * FM}mm`)}`;
};

const flyer = {
  id: 'flyer', piece: 'flyers', name: 'Flyer', size: 'A6, 105 × 148 mm, two sides', mm: [FW, FH], pages: ['Front', 'Back'],
  print: 'Print 4 per A4 sheet, both sides (flip on the long edge), then cut. 120 gsm or more.',
  versions: [
    { id: 'v1', look: 'flyer', note: 'Front: the headline in the sky, the planet’s edge, and the QR and the price on its night side. Dark back: 3 reasons, both plans, the refund line, and “not an official Ateneo service”.', html: (i) => (i ? flyerBack('v1') : flyerFront('v1')) },
  ],
};

// Shrink a .fit headline until its longest line fits its box. Runs once the fonts are in, before the build prints.
const FIT = `<script>window.__fit||(window.__fit=new Promise((r)=>document.readyState==='loading'?addEventListener('DOMContentLoaded',r):r()).then(()=>document.fonts.ready).then(()=>document.querySelectorAll('.fit').forEach((el)=>{
  const max=el.parentElement.clientWidth;let s=parseFloat(getComputedStyle(el).fontSize);el.style.width='max-content';
  while(el.scrollWidth>max&&s>8){s*=0.98;el.style.fontSize=s+'px'}el.style.width=''})))</script>`;

// HOOK FLYERS: one short question in place of the headline (HOOKS with flyer: true in kit.mjs).
// Each has its own front (HOOK_FRONT above). The back is the flyer back.
// A hook with no composition of its own gets the star-chart front.
const hookFront = (v, h) => `${(HOOK_FRONT[h.id]?.[0] || frontStarChart)(v, h)}${FIT}`;

// One design per flyer: a Deep Field front, and a back that alternates white and dark through the set,
// so a stack of them does not look like one flyer printed 7 times.
const hookFlyers = HOOKS.filter((h) => h.flyer).map((h, j) => {
  const about = HOOK_FRONT[h.id]?.[1] || 'the question on a star chart';
  const back = j % 2 ? 'v1' : 'v2';
  return {
    id: `hook-${h.id}`, piece: 'flyers', name: `Flyer: “${hookText(h)}”`, size: 'A6, 105 × 148 mm, two sides', mm: [FW, FH], pages: ['Front', 'Back'],
    print: flyer.print,
    versions: [{ id: 'v1', look: 'flyer', note: `Front: ${about}. ${back === 'v2' ? 'White' : 'Dark'} back: 3 reasons, both plans, the refund line, and the legal lines.`, html: (i) => (i ? flyerBack(back) : hookFront('v1', h)) }],
  };
});

// ======================================================================
// VOUCHER CARD, 90 × 54 mm (business card size), 10 per A4 sheet (2 × 5). Front: what the card is worth.
// Back: the code, one line on how to use it, and where to redeem it. The terms live in the app (#/terms).
// `npm run cards -- <codes.txt>` prints the real codes into a private PDF (scripts/print/cards.mjs).
// ======================================================================
const KW = 90, KH = 54, KM = 4.5, KCW = KW - 2 * KM;
export const CARD_MM = [KW, KH];
const MAIN = PASSES.find((p) => p.main);

// the pass a card is for, by id or tag ('founding', 'Founding member'). Blank: the main pass. No match: undefined.
export const passFor = (s = '') => {
  const t = String(s).trim().toLowerCase();
  return t ? PASSES.find((p) => p.id === t || p.tag.toLowerCase() === t) : MAIN;
};

// The front says what the card is worth, and nothing else: no badge, no tag. The two cards differ only in their
// line ("Lifetime access to" or "1 year of", PASSES in kit.mjs) and the 1-year card's one warm star.
export const cardFront = (v, p = MAIN) => {
  const k = LOOK[v];
  const big = v === 'v3';
  return `
    ${ground(v)}
    ${sky(v, KW, KH, `card-${p.id}`, { density: 0.034 })}
    ${v !== 'v3' ? constellationSvg({ w: KW, h: KH, box: [KW * 0.6, 8, KW * 0.28, 15], seed: `card-c-${p.id}`, count: 5, dark: k.dark, you: !!p.flare }) : ''}
    ${plate(v, KW, KH, 2.5)}
    ${at(KM, KM, mark(5.6, { front: k.front, back: k.back }))}
    ${atb(KM, KM + 1.6, `
      <div class="d nw" style="font-size:${f1(Math.min(big ? 10.6 : 6.4, (big ? 148 : 118) / p.lead.replace(/\*/g, '').length))}mm;letter-spacing:-0.04em;color:${k.ink}">${hiText(p.lead, k.hi)}</div>
      <div class="wm" style="font-size:${big ? 9.4 : 10.4}mm;margin-top:${big ? 0.6 : 1.1}mm;color:${k.word}">BlueLink</div>`)}`;
};

// code = the voucher code; pass = the pass id or tag (blank: the main pass).
// The same simple back as profstopick: the code in a white box, one line on how to use it, where to redeem it.
// No code (the public files): the box is left white and empty, to write the code in with a pen.
// Real cards come from `npm run cards`. The terms live in the app (#/terms), not on the card.
export const cardBack = (v, { code = '', pass = '' } = {}) => {
  const k = LOOK[v];
  const bg = { v1: C.deep, v2: '#fff', v3: C.void }[v];
  const field = k.dark ? '' : `border:0.3mm solid ${C.ink3};`;
  return `
    ${ground(v, bg)}
    ${at(KM, KM, 'Voucher code', `font-size:2.8mm;color:${k.sub}`, 'm nw')}
    ${at(KM, KM + 4.6, `<div style="height:19mm;background:#fff;${field}border-radius:0.5mm;display:flex;align-items:center;justify-content:center">
      <span class="m nw" style="font-size:7.6mm;font-weight:700;letter-spacing:0.06em;text-transform:none;color:${C.ink}">${esc(code)}</span></div>`, `width:${KCW}mm`)}
    ${at(KM, KM + 26.6, 'Sign in and type the code.', `font-size:3.1mm;font-weight:500;color:${k.sub}`, 'nw')}
    ${atb(KM, KM, `<span>Redeem at <b style="font-weight:700">${esc(F.site)}</b></span>${mark(4.6, { front: k.front, back: k.back })}`, `width:${KCW}mm;display:flex;justify-content:space-between;align-items:center;border-top:0.25mm solid ${k.rule};padding-top:2.4mm;font-size:3.3mm;font-weight:500;color:${k.ink}`, 'nw')}`;
};

const card = {
  id: 'card', piece: 'card', name: 'Voucher card, front: Lifetime', size: 'Business card, 90 × 54 mm, “Lifetime access to BlueLink”', mm: [KW, KH], pages: ['Front'],
  print: 'Card stock, 300 gsm, matte. 10 per A4 sheet (2 × 5). Print this on one side and “Voucher card, back” on the other. Cut to 90 × 54 mm, square corners.',
  versions: [
    { id: 'v1', note: 'The night sky: “Lifetime access to BlueLink” and a small constellation.', html: () => cardFront('v1') },
    { id: 'v2', note: 'Paper: the same card on light paper, navy type, “lifetime” in BlueLink blue.', html: () => cardFront('v2') },
    { id: 'v3', note: 'Big type: “Lifetime access to BlueLink”, nothing else.', html: () => cardFront('v3') },
  ],
};

// the same front for the founding member code (1 year). One constellation star is Flare.
const founding = PASSES.find((p) => p.id === 'founding');
const cardFounding = {
  ...card, id: 'card-founding', name: 'Voucher card, front: Founding member', size: 'Business card, 90 × 54 mm, “1 year of BlueLink”',
  versions: card.versions.map((x) => ({ ...x, note: x.note.replace(/Lifetime access to/g, '1 year of').replace('“lifetime”', '“1 year”').replace('a small constellation', 'a small constellation with one warm star'), html: () => cardFront(x.id, founding) })),
};

const cardBackPrint = {
  id: 'cardback', piece: 'card', name: 'Voucher card, back', size: 'Business card, 90 × 54 mm, the voucher code', mm: [KW, KH], pages: ['Back'],
  print: 'The code box is left blank: write the code in it with a pen. To print the codes instead, make them in the app (Admin → Voucher cards → Make codes → Save codes), then run npm run cards -- <codes.txt>: one private PDF, front and back, one card per code.',
  versions: [
    { id: 'v1', note: 'Deep navy. The code in a big white box, one line on how to use it, and where to redeem it.', html: () => cardBack('v1') },
    { id: 'v2', note: 'White. The code in a thin-line box, one line on how to use it, and where to redeem it. Cheapest to print.', html: () => cardBack('v2') },
    { id: 'v3', note: 'Near-black, the same as Big type. The code in a big white box, and where to redeem it.', html: () => cardBack('v3') },
  ],
};

const PW = 210, PH = 297;
// ======================================================================
// STAFF FAQ, A4, three pages, for the team only (not for visitors). Same format as the profstopick booth.
// Page 1: the prices, about BlueLink, why pay, privacy. Page 2: safety, hard questions, paying and the code,
// and how to make a sale. Page 3: when someone has a concern. Words: FAQ, SALE_STEPS, CONCERN in kit.mjs.
// ======================================================================
const SM = 15, SCW = PW - 2 * SM;
const kick = (t) => `<div class="m" style="font-size:2.9mm;font-weight:600;color:${C.signal};margin-bottom:2.2mm">${t}</div>`;
// The dark band on top of every staff sheet: the logo, and who it is for.
const staffHead = (seed, note) => `
  <div class="abs" style="left:0;top:0;width:${PW}mm;height:24mm;overflow:hidden">${ground('v1')}${skySvg({ w: PW, h: 24, seed, density: 0.05, band: 0.3 })}
    <div class="abs" style="left:${SM}mm;top:7mm">${lockupFor('v1', 5.4)}</div>
    <div class="abs" style="right:${SM}mm;top:8mm">${mono(note, 2.6, C.sub)}</div></div>`;
const staffTitle = (title, sub) => `
  <div class="d" style="font-size:9mm;color:${C.ink}">${title}</div>
  <div class="t" style="font-size:3.5mm;margin-top:1.8mm;color:${C.ink2}">${sub}</div>`;

// the four sale steps (SALE_STEPS), two by two, numbered
const saleSteps = () => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm 8mm">${SALE_STEPS.map(([t, d], j) => `
  <div style="display:flex;gap:2.8mm;line-height:1.35;color:${C.ink}">${mono(`0${j + 1}`, 3.2, C.signal, 'font-weight:600;line-height:1.3')}
    <div><div style="font-size:3.5mm;font-weight:700">${esc(t)}</div><div class="t" style="font-size:3.3mm;margin-top:0.6mm;color:${C.ink2}">${esc(d)}</div></div></div>`).join('')}</div>`;

const faqPage = (i) => {
  if (i === 2) return concernPage();
  const qa = ([q, a]) => `<div style="display:grid;grid-template-columns:50mm 1fr;gap:6mm;padding:1.7mm 0 1.9mm;border-top:0.25mm solid ${C.line}">
      <div style="font-size:3.5mm;font-weight:700;line-height:1.3;color:${C.ink}">${esc(q)}</div>
      <div class="t" style="font-size:3.4mm;line-height:1.4;color:${C.ink}">${esc(a)}</div></div>`;
  const section = ([t, list]) => `<div style="margin-top:4.6mm">${kick(t)}${list.map(qa).join('')}</div>`;
  const price = ([who, plan, p]) => `<div style="flex:1;border:0.25mm solid ${C.line};padding:2.4mm 3.2mm">
      ${mono(`${who} · ${plan}`, 2.6, C.ink2)}
      <div class="d nw" style="font-size:6.4mm;margin-top:1.2mm;color:${C.ink}">${p}</div></div>`;
  const top = i === 0
    ? `${staffTitle('Booth FAQ', 'What visitors ask, and what to say. Short and honest. If it is not here, say you will ask the team.')}
      <div style="display:flex;gap:2.6mm;margin-top:5mm">${[['Students', '1 year', F.price], ['Students', 'Lifetime', F.life], ['Alumni', 'For now', 'Free']].map(price).join('')}</div>`
    : `<div class="d" style="font-size:9mm;color:${C.ink}">Booth FAQ, continued</div>`;
  const foot = i === 0
    ? `<div class="abs" style="left:${SM}mm;bottom:${SM}mm;width:${SCW}mm;border-top:0.4mm solid ${C.ink};padding-top:3mm;display:flex;justify-content:space-between">
        ${legal(F.unofficial, 3, C.ink2)}${mono('More on the back · 1 / 3', 2.8, C.ink3)}</div>`
    : `<div class="abs" style="left:${SM}mm;bottom:${SM}mm;width:${SCW}mm;border-top:0.4mm solid ${C.ink};padding-top:3.2mm">
        ${kick('How to make a sale')}${saleSteps()}
        <div style="margin-top:3.4mm;padding:2.2mm 3.2mm;background:${C.paper};border-left:1mm solid ${C.signal};font-size:3.5mm;font-weight:700;color:${C.ink}">After every sale, log the time, the code, and how they paid.</div>
        <div style="display:flex;justify-content:space-between;margin-top:3.4mm">${mono(F.site, 2.8, C.ink3)}${mono('2 / 3', 2.8, C.ink3)}</div></div>`;
  return `
    <div class="fill" style="background:#fff"></div>
    ${staffHead(`faq-${i}`, 'For the team · Not for visitors')}
    <div class="abs" style="left:${SM}mm;top:31mm;width:${SCW}mm">
      ${top}
      ${FAQ.filter((x) => x[2] === i).map(section).join('')}
    </div>${foot}`;
};

// Page 3: someone has a concern (privacy, safety, the price, the Ateneo name). Calm steps, what to say back, what not to do.
const concernPage = () => {
  const step = ([t, d], j) => `<div style="display:grid;grid-template-columns:8mm 54mm 1fr;gap:4mm;align-items:baseline;padding:1.7mm 0 1.9mm;border-top:0.25mm solid ${C.line}">
      ${mono(`0${j + 1}`, 3.2, C.signal, 'font-weight:600')}
      <div style="font-size:3.6mm;font-weight:700;line-height:1.3;color:${C.ink}">${esc(t)}</div>
      <div class="t" style="font-size:3.5mm;line-height:1.4;color:${C.ink}">${esc(d)}</div></div>`;
  const said = ([q, a]) => `<div style="display:grid;grid-template-columns:58mm 1fr;gap:6mm;padding:1.7mm 0 1.9mm;border-top:0.25mm solid ${C.line}">
      <div style="font-size:3.6mm;font-weight:700;line-height:1.3;color:${C.ink}">“${esc(q)}”</div>
      <div class="t" style="font-size:3.5mm;line-height:1.4;color:${C.ink}">“${esc(a)}”</div></div>`;
  return `
    <div class="fill" style="background:#fff"></div>
    ${staffHead('faq-2', 'For the team · Not for visitors')}
    <div class="abs" style="left:${SM}mm;top:31mm;width:${SCW}mm">
      ${staffTitle('If someone has concerns', 'About privacy, safety, the price, or the school. Stay calm and polite. Never promise more than BlueLink does.')}
      <div style="margin-top:4.8mm">${kick('What to do')}${CONCERN.steps.map(step).join('')}</div>
      <div style="margin-top:4.8mm">${kick('If they say')}${CONCERN.says.map(said).join('')}</div>
      <div style="margin-top:4.8mm;padding:3mm 4.4mm 3.4mm;background:#fff6ee;border-left:1mm solid ${C.flare}">
        ${kick('Never')}
        ${CONCERN.never.map((t) => `<div style="font-size:3.6mm;font-weight:600;line-height:1.4;margin-top:1mm;color:${C.ink}">✕&nbsp; ${esc(t)}</div>`).join('')}</div>
    </div>
    <div class="abs" style="left:${SM}mm;bottom:${SM}mm;width:${SCW}mm;border-top:0.4mm solid ${C.ink};padding-top:3mm">
      <div style="font-size:3.5mm;font-weight:700;color:${C.ink}">Privacy notice: ${F.privacy} · Terms: ${F.terms}</div>
      <div style="display:flex;justify-content:space-between;margin-top:2.6mm">${mono('Upset, or wants someone in charge? Call Prince.', 2.8, C.ink2)}${mono('3 / 3', 2.8, C.ink3)}</div></div>`;
};

// ======================================================================
// SALES SCRIPT, A4, one page. Onboarding for the booth team: ask 1 or 2 questions, bring them to the booth,
// sell at the laptop. Short lines only. Words: SCRIPT and OBJECTIONS in kit.mjs.
// ======================================================================
const scriptPage = () => {
  const line = ([who, t]) => `<div style="display:grid;grid-template-columns:17mm 1fr;gap:3mm;align-items:baseline;margin-top:1.7mm">
      ${mono(who === 'you' ? 'You say' : 'Do', 2.9, who === 'you' ? C.signal : C.ink2, 'font-weight:600')}
      ${who === 'you' ? `<span style="font-size:4mm;font-weight:600;line-height:1.34;color:${C.ink}">“${esc(t)}”</span>`
        : `<span class="t" style="font-size:3.8mm;line-height:1.38;color:${C.ink2}">${esc(t)}</span>`}</div>`;
  const step = ([title, why, list, tip], n) => `<div style="display:grid;grid-template-columns:11mm 1fr;gap:4mm;padding:3mm 0 3.2mm;border-top:0.3mm solid ${C.line}">
      <span class="d" style="font-size:9mm;line-height:1;color:${C.signal}">${n + 1}</span>
      <div><div class="d nw" style="font-size:5.6mm;color:${C.ink}">${esc(title)}</div>
        <div class="t" style="font-size:3.5mm;margin-top:1mm;color:${C.ink2}">${esc(why)}</div>
        ${list.map(line).join('')}
        <div style="margin-top:2.4mm;padding:1.8mm 3.2mm;background:${C.paper};border-left:1mm solid ${C.signal};font-size:3.4mm;font-weight:600;line-height:1.35;color:${C.ink}">${mono('Tip', 2.9, C.signal, 'font-weight:600;margin-right:2mm')}${esc(tip)}</div></div></div>`;
  const said = ([q, a]) => `<div style="display:grid;grid-template-columns:48mm 1fr;gap:6mm;padding:1.7mm 0 1.9mm;border-top:0.3mm solid ${C.line}">
      <div style="font-size:3.7mm;font-weight:700;line-height:1.3;color:${C.ink}">“${esc(q)}”</div>
      <div class="t" style="font-size:3.7mm;line-height:1.38;color:${C.ink}">“${esc(a)}”</div></div>`;
  return `
    <div class="fill" style="background:#fff"></div>
    ${staffHead('script', 'For the team · Read it before your shift')}
    <div class="abs" style="left:${SM}mm;top:31mm;width:${SCW}mm">
      ${staffTitle('Sales script', 'Keep it short. Ask 1 or 2 questions, then bring them to the booth.')}
      <div style="margin-top:4.6mm">${SCRIPT.map(step).join('')}</div>
      <div style="margin-top:4mm">${kick('If they say')}${OBJECTIONS.map(said).join('')}</div>
    </div>
    <div class="abs" style="left:${SM}mm;bottom:${SM}mm;width:${SCW}mm;border-top:0.3mm solid ${C.line};padding-top:2.8mm;display:flex;justify-content:space-between">
      ${mono('Anything else: check the Booth FAQ, or ask Prince.', 2.8, C.ink2)}${mono(F.site, 2.8, C.ink3)}</div>`;
};

// ======================================================================
// INSTAGRAM. Not for print: `section: 'social'` puts these in their own list on the page.
//   Teasers: one question per post (HOOKS in kit.mjs): the question, the logo, "Link in bio".
//   Info carousel: what BlueLink is, in 5 slides (INFO in kit.mjs). One constellation runs through all 5.
//   Booth: where to find us at the bazaar (EVENT, ROUTE, BOOTH in kit.mjs): a 3-slide carousel and a story.
// Posts are 1080 × 1350 px (4:5), the story 1080 × 1920 px (9:16). Sizes inside a post are in px.
// The legal line goes in the caption, not on the image. `npm run posts` saves PNGs and captions.
// ======================================================================
const IW = 285.75, IH = 357.1875;   // 1080 × 1350 px at 96 dpi
const PX = 1080, PY = 1350, PM = 88, RIM = 1112;
const SY = 1920, SH = 508;          // the story: 1920 px tall, 508 mm at 96 dpi
export const INSTA_PX = [PX, PY];
export const STORY_PX = [PX, SY];
export const INSTA_CSS = `
.post{position:relative;width:${PX}px;height:${PY}px;overflow:hidden}
.hook{font-weight:800;letter-spacing:-0.045em;line-height:0.94;font-size:190px;white-space:nowrap}
.sub{font-size:46px;font-weight:500;letter-spacing:-0.015em;line-height:1.2;margin-top:40px}
.foot{display:flex;justify-content:space-between;align-items:center}
.h1{font-weight:800;letter-spacing:-0.045em;line-height:0.94;font-size:148px}
.h2{font-weight:800;letter-spacing:-0.04em;line-height:0.98;font-size:104px}
.lead{font-size:44px;font-weight:500;letter-spacing:-0.015em;line-height:1.25}
.row{font-size:56px;font-weight:700;letter-spacing:-0.03em;line-height:1.1;padding:30px 0 32px}
.ml{font-family:"JetBrains Mono",monospace;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;font-size:22px}`;

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

// Instagram captions: the words under each post. Kept here, in one place, so captions.txt (npm run posts) and the
// Copy caption buttons on the booth page always say the same thing. The legal line goes in every caption, never on
// the image. A blank line between paragraphs pastes cleanly into Instagram.
export const IG_LEGAL = 'Made by Ateneans. Not an official Ateneo de Manila University service.';
export const IG_CAPTIONS = {
  teasers: HOOKS.map((h) => `${h.cap} Link in bio.\n\n${IG_LEGAL}`),
  info: `BlueLink is a private network for the Ateneo community. Find internships, and connect with orgs, businesses, alumni, and mentors.\n\nIt’s exclusive to Ateneans, so it’s a safe space for people who want to network and find opportunities.\n\nMembership is ${F.price} a year or ${F.life} for lifetime access, with a full refund within 7 days. Sign up through the link in our bio, or visit us at the ${EVENT.name}, ${EVENT.road}, Tent ${EVENT.tent}.\n\n${IG_LEGAL}`,
  booth: `We have a booth at the ${EVENT.name}! Find us at the very end of ${EVENT.road}, Tent ${EVENT.tent}, across from the Bazaar Committee booth. We're there Nov 9 to 13, 8 AM to 5 PM.\n\nDrop by to sign up or just to ask us about BlueLink.\n\n${IG_LEGAL}`,
};

const insta = {
  id: 'insta', piece: 'insta', section: 'social', name: 'Teaser posts', size: `1080 × 1350 px (4:5), ${HOOKS.length} posts`, mm: [IW, IH], px: PY, css: INSTA_CSS,
  pages: HOOKS.map(hookText),
  print: 'Single posts, one question each, to build interest before and during the bazaar. Post the JPG with its caption (Copy caption below; it changes with the post you pick).',
  captions: IG_CAPTIONS.teasers,
  versions: [{ id: 'v1', note: 'The question top left, a constellation, the logo, and “Link in bio”.', html: (i) => instaPost('v1', HOOKS[i]) }],
};

// ---------- shared parts for the carousels and the story ----------
// Instagram has one design: Deep Field. Words are in kit.mjs (INFO, BOOTH, HOOKS).
const K = LOOK.v1;
const IG_W = PX - 2 * PM;
const igLogo = (s = 50) => `<div class="lockup" style="gap:${f1(s * 0.28)}px">${markSvg({ front: K.front, back: K.back, size: `${s}px` })}<span class="wm" style="font-size:${f1(s * 0.76)}px;color:${K.word}">BlueLink</span></div>`;
// the logo bottom left, the slide number bottom right
const igFoot = (right = '') => `<div class="abs foot" style="left:${PM}px;right:${PM}px;bottom:${PM - 16}px">${igLogo()}<span style="font-size:26px;font-weight:600;color:${K.muted}">${right}</span></div>`;
const pxAt = (x, y, inner, style = '') => `<div class="abs" style="left:${x}px;top:${y}px;${style}">${inner}</div>`;
// \n in a heading = a line break where it reads best
const igHead = (t, size = 100) => `<div class="h2" style="font-size:${size}px;color:${K.ink}">${hiText(t, K.hi).replace(/\n/g, '<br>')}</div>`;
const igLead = (t, size = 40, extra = '') => `<div class="lead" style="font-size:${size}px;color:${K.sub};${extra}">${hiText(t, K.hi)}</div>`;
// whole sentences, one per row, hairlines between
const igList = (list, size = 44) => `<div style="border-bottom:2px solid ${K.rule}">${list.map((t) => `<div style="padding:30px 0 32px;border-top:2px solid ${K.rule};font-size:${size}px;font-weight:600;letter-spacing:-0.02em;line-height:1.22;color:${K.ink}">${esc(t)}</div>`).join('')}</div>`;
// numbered sentences: the number in the blue, the sentence beside it
const igSteps = (list, size = 44) => `<div style="border-bottom:2px solid ${K.rule}">${list.map((t, j) => `
  <div style="display:grid;grid-template-columns:96px 1fr;align-items:baseline;padding:30px 0 32px;border-top:2px solid ${K.rule}">
    <div class="d" style="font-size:72px;line-height:0.8;color:${K.hi}">${j + 1}</div>
    <div style="font-size:${size}px;font-weight:600;letter-spacing:-0.02em;line-height:1.22;color:${K.ink}">${esc(t)}</div></div>`).join('')}</div>`;
const igSky = (seed, w = PX, h = PY, shift = 0, opts = {}) => {
  const s = skySvg({ w, h, seed, density: 0.02, band: 0.3, haze: true, ...opts });
  // a sky wider than one post: show only this post's part of it
  return w === PX ? s : s.replace(/viewBox="0 0 [\d.]+ [\d.]+"/, `viewBox="${shift} 0 ${PX} ${h}"`);
};

// ---------- INFO CAROUSEL, 5 slides ----------
// One idea per slide, and a different layout on each, so every slide reads in a few seconds:
// 1 the headline, 2 one big statement with its key phrases lit, 3 members only (a closed ring of stars),
// 4 both plans at the same size, 5 the steps as a constellation.
const INFO_N = 5;
const INFO_PAGES = ['Welcome', 'What you can do', 'Members only', 'Membership', 'How to join'];
const kicker = (t) => `<div style="font-size:32px;font-weight:600;letter-spacing:-0.01em;color:${C.peri}">${esc(t)}</div>`;
// a statement in muted type, with its *key phrases* set bright: the eye reads the bright words first
const statement = (t, size) => `<div style="font-size:${size}px;font-weight:700;letter-spacing:-0.035em;line-height:1.1;color:${K.muted}">${esc(t).replace(/\*(.+?)\*/g, (_, w) => `<span style="color:${K.ink}">${w}</span>`).replace(/\n/g, '<br>')}</div>`;
// One constellation runs along the bottom of every slide, so a swipe follows the line from one slide to the next.
// It ends on the last slide in a warm star.
const infoChain = (() => {
  const rand = seeded('info-chain');
  const W = PX * INFO_N, n = INFO_N * 3;
  const pts = Array.from({ length: n }, (_, j) => ({ x: (j + 0.25 + rand() * 0.5) * (W / n), y: 1070 + rand() * 90 }));
  pts[n - 1] = { x: W - PX * 0.3, y: 1090 };
  const extra = [];
  const links = pts.slice(1).map((p, j) => [pts[j], p]);
  for (let j = 1; j < n - 2; j += 3) {
    const q = { x: pts[j].x + 40 + rand() * 70, y: pts[j].y - 50 - rand() * 40 };
    extra.push(q);
    links.push([pts[j], q]);
  }
  const dotAt = (p, c, r) => `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${r * 4}" fill="${c}" fill-opacity="0.12"/><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${r}" fill="${c}"/>`;
  return (i) => `<svg class="fill" viewBox="${i * PX} 0 ${PX} ${PY}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="${C.peri}" stroke-opacity="0.45" stroke-width="2">${links.map(([a, b]) => `<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}"/>`).join('')}</g>
    ${[...pts.slice(0, -1), ...extra].map((p) => dotAt(p, C.star, 4.5)).join('')}${dotAt(pts[n - 1], C.flare, 7)}</svg>`;
})();
// a closed ring of stars: members only
const ringSvg = (cx, cy, r, n = 11) => {
  const rand = seeded('ring');
  const pts = Array.from({ length: n }, (_, j) => {
    const a = (j / n) * Math.PI * 2 + rand() * 0.25, rr = r * (0.9 + rand() * 0.2);
    return [f1(cx + rr * Math.cos(a)), f1(cy + rr * Math.sin(a))];
  });
  const path = `M${pts.map((p) => p.join(' ')).join('L')}Z`;
  return `<svg class="fill" viewBox="0 0 ${PX} ${PY}" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="none" stroke="${C.peri}" stroke-opacity="0.5" stroke-width="2.2"/>
    ${pts.map(([x, y], j) => `<circle cx="${x}" cy="${y}" r="${j % 4 ? 18 : 26}" fill="${C.star}" fill-opacity="0.1"/><circle cx="${x}" cy="${y}" r="${j % 4 ? 5 : 7.5}" fill="${C.star}"/>`).join('')}</svg>`;
};

export const infoSlide = (i) => {
  const top = PM + 24;
  const bodies = [
    // 1. the headline
    () => `${pxAt(PM, top, `<div class="h1" style="font-size:150px;color:${K.ink}">${lines(F.headline, 'v1')}</div>
        ${igLead(INFO.cover, 46, 'margin-top:52px;width:820px;color:' + K.sub)}`)}
      <div class="abs" style="right:${PM}px;top:930px;font-size:30px;font-weight:600;color:${C.peri}">Swipe to learn more →</div>`,
    // 2. one statement, key phrases lit
    () => pxAt(PM, top, `${kicker('What you can do')}<div style="margin-top:44px">${statement(INFO.can, 96)}</div>`, `width:${IG_W}px`),
    // 3. members only: the claim big, two short lines, and a closed ring of stars
    () => `${ringSvg(780, 790, 140)}${pxAt(PM, top, `${kicker('Members only')}<div style="margin-top:36px">${igHead(INFO.safeHead, 112)}</div>
        <div style="margin-top:56px;width:560px">${INFO.safe.map((t) => `<div style="font-size:38px;font-weight:600;letter-spacing:-0.015em;line-height:1.25;color:${K.sub};margin-bottom:28px">${esc(t)}</div>`).join('')}</div>`, `width:${IG_W}px`)}`,
    // 4. the price, as big as it gets
    () => pxAt(PM, top, `${kicker('Membership')}
        ${[[F.price, 'a year'], [F.life, 'lifetime access']].map(([p, per], j) => `<div style="margin-top:${j ? 8 : 28}px;display:flex;align-items:baseline;gap:30px">
          <span class="d nw" style="font-size:196px;letter-spacing:-0.05em;line-height:1;color:${K.ink}">${p}</span>
          <span class="nw" style="font-size:58px;font-weight:700;letter-spacing:-0.03em;color:${K.sub}">${per}</span></div>`).join('')}
        <div style="margin-top:56px;padding-top:30px;border-top:2px solid ${K.rule};font-size:36px;font-weight:500;line-height:1.3;color:${K.sub}">${esc(INFO.price)}</div>`, `width:${IG_W}px`),
    // 5. how to join: three stars joined by one line
    () => {
      const ys = [340, 520, 700], sx = PM + 22;
      const steps = `<svg class="fill" viewBox="0 0 ${PX} ${PY}" xmlns="http://www.w3.org/2000/svg">
        <line x1="${sx}" y1="${ys[0]}" x2="${sx}" y2="${ys[2]}" stroke="${C.peri}" stroke-opacity="0.55" stroke-width="3"/>
        ${ys.map((y, j) => `<circle cx="${sx}" cy="${y}" r="34" fill="${j === 2 ? C.flare : C.star}" fill-opacity="0.12"/><circle cx="${sx}" cy="${y}" r="${j === 2 ? 13 : 10}" fill="${j === 2 ? C.flare : C.star}"/>`).join('')}</svg>`;
      return `${steps}${pxAt(PM, top, `${kicker('How to join')}`)}
        ${INFO.join.map((t, j) => pxAt(PM + 90, ys[j] - 34, `<div style="font-size:30px;font-weight:600;color:${C.peri}">Step ${j + 1}</div>
          <div style="margin-top:6px;font-size:46px;font-weight:700;letter-spacing:-0.03em;line-height:1.08;color:${K.ink};width:820px">${esc(t)}</div>`)).join('')}
        ${pxAt(PM, 860, `<div style="font-size:34px;font-weight:500;line-height:1.3;color:${K.sub};width:${IG_W}px">${esc(INFO.booth)}</div>`)}`;
    },
  ];
  return `<div class="post" style="background:${K.bg}">${igSky('info-sky', PX * INFO_N, PY, i * PX)}${infoChain(i)}
    ${bodies[i]()}${igFoot()}</div>`;
};

const one = (note, html) => [{ id: 'v1', note, html }];
const infoCarousel = {
  id: 'insta-info', piece: 'insta', section: 'social', name: 'Info carousel', size: `1080 × 1350 px (4:5), ${INFO_N} slides`, mm: [IW, IH], px: PY, css: INSTA_CSS,
  pages: INFO_PAGES,
  print: 'One carousel post, 5 slides in this order. The main explainer: pin it to the top of the profile. Copy the caption below.',
  caption: IG_CAPTIONS.info,
  versions: one('One idea per slide, each with its own layout: the headline, one statement with its key phrases lit, members only with a closed ring of stars, both plans at the same size (a year and lifetime access), and the steps as a constellation. One line of stars runs along the bottom of all 5.', (i) => infoSlide(i)),
};

// ---------- THE MAP ----------
// The bazaar from above, simplified from the organizers' floor plan: Red Brick Road across the middle, a row of tents on
// each side, the buildings that people know (JSEC at the start, PIPAC and Faura on one side, MVP on the other), and a
// dashed path from JSEC to our tent, which glows. Drawn in a 1080 × 720 px box; (x0, y0) = its top left.
function bazaarMap(x0, y0) {
  const font = `font-family:'Inter BL',Inter,sans-serif`;
  const T = (x, y, t, size, weight, color, anchor = 'middle', op = 1) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" fill-opacity="${op}" text-anchor="${anchor}" style="${font};letter-spacing:-0.015em">${esc(t)}</text>`;
  const road = [330, 430], tw = 78, gap = 14, tx = (j) => 176 + j * (tw + gap), topY = 240, botY = 442, N = 9, ours = 7;
  const bld = (x, y, w, h, name) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.deep}" stroke="${C.peri}" stroke-opacity="0.35" stroke-width="2"/>${T(x + w / 2, y + h / 2 + 11, name, 30, 600, C.sub)}`;
  let out = '';
  // the road
  out += `<rect x="0" y="${road[0]}" width="1080" height="${road[1] - road[0]}" fill="${C.peri}" fill-opacity="0.1"/>
    <line x1="0" y1="${road[0]}" x2="1080" y2="${road[0]}" stroke="${C.peri}" stroke-opacity="0.3" stroke-width="2"/>
    <line x1="0" y1="${road[1]}" x2="1080" y2="${road[1]}" stroke="${C.peri}" stroke-opacity="0.3" stroke-width="2"/>`;
  out += T(196, 416, 'Red Brick Road', 26, 600, C.peri, 'start', 0.75);
  // buildings
  out += bld(30, topY, 120, botY + tw - topY, 'JSEC');
  out += bld(176, 120, 190, 96, 'PIPAC') + bld(392, 120, 330, 96, 'Faura Hall') + bld(478, 544, 260, 96, 'MVP');
  // tents
  for (let j = 0; j < N; j++) {
    for (const y of [topY, botY]) {
      const isOurs = y === topY && j === ours;
      const isCommittee = y === botY && j === ours;
      out += `<rect x="${tx(j)}" y="${y}" width="${tw}" height="${tw}" fill="${isOurs ? C.flare : isCommittee ? C.peri : C.void}" fill-opacity="${isOurs ? 1 : isCommittee ? 0.2 : 1}" stroke="${isOurs ? C.flare : C.peri}" stroke-opacity="${isOurs ? 1 : 0.45}" stroke-width="2"/>`;
    }
  }
  const ox = tx(ours) + tw / 2;
  out += T(ox, botY + tw + 34, 'Bazaar Committee', 24, 600, C.sub);
  // the path from JSEC to our tent
  out += `<path d="M150 380 H${ox} V${road[0] + 10}" fill="none" stroke="${C.star}" stroke-opacity="0.85" stroke-width="4" stroke-dasharray="14 12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${ox - 13} ${road[0] + 26} L${ox} ${road[0] + 8} L${ox + 13} ${road[0] + 26}" fill="none" stroke="${C.star}" stroke-opacity="0.85" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  // our tent glows, and says so above it
  out += `<circle cx="${ox}" cy="${topY + tw / 2}" r="150" fill="${C.flare}" fill-opacity="0.06"/><circle cx="${ox}" cy="${topY + tw / 2}" r="86" fill="${C.flare}" fill-opacity="0.12"/>
    <rect x="${tx(ours)}" y="${topY}" width="${tw}" height="${tw}" fill="${C.flare}"/>
    ${T(ox, topY + tw / 2 + 10, '34B', 28, 800, C.void)}
    ${T(ox, 150, 'BlueLink', 58, 800, C.star)}${T(ox, 196, `Tent ${EVENT.tent}`, 30, 700, C.flare)}
    <line x1="${ox}" y1="${212}" x2="${ox}" y2="${topY - 8}" stroke="${C.flare}" stroke-width="3"/>`;
  return `<g transform="translate(${x0} ${y0})">${out}</g>`;
}

// ---------- BOOTH CAROUSEL, 3 slides ----------
const BOOTH_PAGES = ['Visit us', 'Where we are', 'Signing up'];
// a small ruled table: the label on the left, the fact on the right
const factRows = (list, size = 46, lw = 170) => `<div style="border-bottom:2px solid ${K.rule}">${list.map(([l, t]) => `
  <div style="display:grid;grid-template-columns:${lw}px 1fr;align-items:baseline;padding:26px 0 28px;border-top:2px solid ${K.rule}">
    <div style="font-size:${f1(size * 0.72)}px;font-weight:600;color:${K.muted}">${esc(l)}</div>
    <div style="font-size:${size}px;font-weight:700;letter-spacing:-0.025em;color:${K.ink}">${esc(t)}</div></div>`).join('')}</div>`;

export const boothSlide = (i) => {
  const top = PM + 24;
  const foot = igFoot();
  if (i === 0) {
    // the planet's edge low on the post, the sun about to come up
    return `<div class="post" style="background:${K.bg}">${igSky('booth-sky')}
      ${horizonSvg({ w: PX, h: PY, top: 1060, dark: true, planet: K.planet, sun: true, curve: 1.6 })}
      ${pxAt(PM, top, `${igHead(BOOTH.head, 128)}${igLead(BOOTH.note, 42, 'margin-top:40px')}
        <div style="margin-top:72px">${factRows(BOOTH.facts)}</div>`, `width:${IG_W}px`)}
      ${foot}</div>`;
  }
  if (i === 1) {
    return `<div class="post" style="background:${K.bg}">${igSky('booth-map', PX, PY, 0, { density: 0.01 })}
      <svg class="fill" viewBox="0 0 ${PX} ${PY}" xmlns="http://www.w3.org/2000/svg">${bazaarMap(0, 430)}</svg>
      ${pxAt(PM, top, `${igHead(BOOTH.mapHead, 92)}${igLead(BOOTH.mapNote, 40, 'margin-top:28px')}`, `width:${IG_W}px`)}
      ${foot}</div>`;
  }
  return `<div class="post" style="background:${K.bg}">${igSky('booth-steps')}
    ${pxAt(PM, top, `${igHead(BOOTH.stepsHead)}<div style="margin-top:64px">${igSteps(BOOTH.steps)}</div>
      ${igLead(BOOTH.later, 38, 'margin-top:40px')}`, `width:${IG_W}px`)}
    ${foot}</div>`;
};

const boothPost = {
  id: 'insta-booth', piece: 'insta', section: 'social', name: 'Booth carousel', size: `1080 × 1350 px (4:5), ${BOOTH_PAGES.length} slides`, mm: [IW, IH], px: PY, css: INSTA_CSS,
  pages: BOOTH_PAGES,
  print: `One carousel post for the bazaar week (${EVENT.short}). Check the hours with the organizers before posting. Copy the caption below.`,
  caption: IG_CAPTIONS.booth,
  versions: one('1: where, when, and the time, over a sunrise. 2: a simple map of the bazaar from above, with a path from JSEC to our glowing tent. 3: how signing up at the booth works.', (i) => boothSlide(i)),
};

// ---------- THE STORY, 1080 × 1920 ----------
// Instagram covers about 250 px at the top and the bottom, so everything sits between.
export const boothStory = () => `<div class="post" style="background:${K.bg};height:${SY}px">${igSky('booth-story', PX, SY, 0, { density: 0.014 })}
    <svg class="fill" viewBox="0 0 ${PX} ${SY}" xmlns="http://www.w3.org/2000/svg">${bazaarMap(0, 640)}</svg>
    ${pxAt(PM, 250, `${igLogo(46)}<div style="margin-top:44px">${igHead(BOOTH.storyHead, 112)}</div>`, `width:${IG_W}px`)}
    ${pxAt(PM, 1430, `<div style="font-size:48px;font-weight:700;letter-spacing:-0.025em;color:${K.ink}">${esc(BOOTH.storyFoot)}</div>
      ${igLead('Sign up through the link in our bio.', 38, 'margin-top:12px')}`, `width:${IG_W}px`)}
  </div>`;

const boothStoryAsset = {
  id: 'insta-story', piece: 'insta', section: 'social', name: 'Booth story', size: '1080 × 1920 px (9:16), 1 story', mm: [IW, SH], px: SY, css: INSTA_CSS,
  pages: ['Story'],
  print: 'A story for each day of the bazaar. Post the JPG and put a link sticker under the dates. Check the hours with the organizers first.',
  versions: one('The bazaar map from above with our glowing tent, and the dates and time.', () => boothStory()),
};

const faq = {
  id: 'faq', piece: 'faq', name: 'Staff FAQ', size: 'A4, 210 × 297 mm, three pages', mm: [PW, PH], pages: ['FAQ, page 1', 'FAQ, page 2', 'If someone has concerns'],
  print: 'Plain paper, A4. Pages 1 and 2 on both sides of one sheet, page 3 on its own sheet. For the team: keep one behind the table. Not for visitors.',
  versions: [{ id: 'v1', look: 'staff', note: 'White, three pages: the prices, about BlueLink, why pay, and privacy; then safety, the hard questions, the code, and how to make a sale; then what to say when someone has a concern.', html: faqPage }],
};

const script = {
  id: 'script', piece: 'faq', name: 'Sales script', size: 'A4, 210 × 297 mm', mm: [PW, PH], pages: ['Script'],
  print: 'Plain paper, A4. For the team: read it before your shift. Not for visitors.',
  versions: [{ id: 'v1', look: 'staff', note: 'White, one page: ask 1 or 2 questions, bring them to the booth, sell at the laptop, and short answers.', html: scriptPage }],
};

// every ₱ in Inter (see peso() in kit.mjs)
const withPeso = (asset) => ({ ...asset, versions: asset.versions.map((v) => ({ ...v, html: async (i) => peso(await v.html(i)) })) });

export default {
  page: 'booth',
  assets: [standee, header, qrSign, flyer, ...hookFlyers, card, cardFounding, cardBackPrint, insta, infoCarousel, boothPost, boothStoryAsset, faq, script].map(withPeso),
};
