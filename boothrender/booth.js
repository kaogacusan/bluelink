// / — the BlueLink booth: our half of a shared 3 × 3 m tent (the venue, date, and stall are still to confirm).
// Copied from the profstopick booth render (~/profstopick-booth), itself from the Blueprint render pages.
// Metres. X = across the tent (our half is x 0 to 1.5, on the left). Z = depth (0 = aisle side, -3 = back). Y = up.
// The facts come from the BlueLink app (~/BlueLink) and the brand direction (~/BlueLink/BRAND.md).
// Anything not known yet is marked "to confirm" and listed under "Still to check" on the page.
import { THREE, canvasTexture, loadImage } from '/render/stage.js';
import { mountPage } from '/render/page.js';
import { loadArt, mountAssets } from '/render/assets.js';

// ---------- sizes ----------
const HALF = 1.5;          // our width (assumed: half of a 3 × 3 m tent)
const DEPTH = 3;           // tent depth (assumed)
const EAVE = 2.0;          // eave height to ask for
const PEAK = 3.05;         // assumed
const T = { x0: 0, x1: 0.9, z0: -0.85, z1: -0.25, h: 0.75 };          // selling table (size assumed)
const TP = { x: 0.75, z: -2.97, w: 1.2192, h: 0.9144, top: 1.95 };   // tarpaulin, 4 × 3 ft, on the back bar
const QR = { x: 0.2, z: -0.74, w: 0.21, h: 0.297 };                   // A4 QR sign in its stand, back row
const LAP = { x0: 0.56, x1: 0.88, z0: -0.64, z1: -0.42 };             // laptop base
const CH_X = [0.24, 0.66];                                           // the two chairs
const CH_Z = -1.4;

// ---------- the list ----------
const groups = [
  { code: 'print', label: 'Prints' },
  { code: 'stand', label: 'Stands and ties' },
  { code: 'demo', label: 'Demo and sales' },
  { code: 'furniture', label: 'Furniture' },
  { code: 'home', label: 'Supplies' },
  { code: 'space', label: 'Space' },
];

const zoomTable = { az: 0.42, el: 0.6, tx: 0.45, ty: 0.86, tz: -0.55, size: 1.05, width: 1.5 };
const zoomTarp = { az: 0.18, el: 0.12, tx: 0.75, ty: 1.45, tz: -2.9, size: 1.6, width: 2.2 };

const pieces = [
  { id: 'tarp', num: 1, cat: 'print', name: 'Tarpaulin', size: '4 × 3 ft (1219 × 914 mm), landscape, grommets', where: 'Back of our half, top edge at the eave',
    basis: 'print', flag: 'Size and printer to confirm',
    note: 'The logo, the headline, the QR, and the price. The top two thirds stay clear of people at the table. Measure the space between the back bar and the table before printing. Ask two shops for a quote.',
    view: zoomTarp },
  { id: 'qr', num: 2, cat: 'print', name: 'QR sign', size: 'A4 (210 × 297 mm), QR 12 cm', where: 'Table, back left, in the A4 stand',
    basis: 'print',
    note: 'One QR for the whole booth, with the price under it. A 12 cm QR scans from about 1.2 m. The QR points to a placeholder link until the domain is live. Test it on 2 phones.', view: zoomTable },
  { id: 'flyers', num: 3, cat: 'print', name: 'Flyers', size: 'A6 (105 × 148 mm), two sides', where: 'Table, front center. Someone in the aisle carries a stack',
    basis: 'print',
    note: 'Print 4 per A4 sheet, both sides. Front: the headline, the QR, and the price. Back: 3 reasons and the legal lines.', view: zoomTable },
  { id: 'card', num: 4, cat: 'print', name: 'Voucher cards', size: 'A7 landscape, 105 × 74 mm, two sides', where: 'Table, next to the flyers',
    basis: 'print',
    note: 'The voucher. Front: “1 semester of BlueLink” (or “1 year”, founding member). Back: the code, the price paid, valid until, how to redeem, the 7-day refund line, 18+, the privacy line, and “not an official receipt”. Give one after each cash or GCash sale. Print the real codes with npm run cards (a private PDF, never on this site).', view: zoomTable },

  { id: 'qrstand', num: 5, cat: 'stand', name: 'A4 acrylic stand', size: '1 stand, A4 portrait', where: 'Table, back left',
    basis: 'buy',
    note: 'Holds the QR sign upright.', view: zoomTable },
  { id: 'ties', num: null, cat: 'stand', name: 'Zip ties and string', size: '8 zip ties, 2 m string', where: 'Tarp grommets to the back bar',
    basis: 'buy',
    note: 'Top grommets to the back bar. Tie the bottom corners down so the tarp does not flap.' },

  { id: 'laptop', num: 6, cat: 'demo', name: 'Demo laptop', size: '1 laptop with charger', where: 'Table, front right, screen to the aisle',
    basis: 'borrow',
    note: 'Open the landing page. Keep a demo account signed in to show the feed, people, and messages. Turn it to the seller between demos.', view: zoomTable },
  { id: 'phone', num: null, cat: 'demo', name: 'Phone with the GCash QR', size: 'Phone and power bank', where: 'With the seller',
    basis: 'home',
    note: 'Check that the payment came in before you give a card. Note the reference number.' },
  { id: 'cashbox', num: null, cat: 'demo', name: 'Cash box', size: 'Small box with change', where: 'Behind the table, with the seller',
    basis: 'borrow',
    note: 'Keep it off the front of the table. Count it at closing and match it to cards given.' },
  { id: 'log', num: null, cat: 'demo', name: 'Sales log', size: 'A sheet or a phone note', where: 'With the seller',
    basis: 'home',
    note: 'One line per sale: time, code, cash or GCash, reference number.' },
  { id: 'power', num: null, cat: 'demo', name: 'Power strip and hotspot', size: 'Extension cord, phone hotspot', where: 'Under the table',
    basis: 'borrow',
    note: 'Ask the organizers for the nearest outlet. Test the hotspot before opening.' },

  { id: 'table', num: 7, cat: 'furniture', name: 'Selling table', size: 'About 0.9 × 0.6 m, 0.75 m high (assumed)', where: 'Front left, 0.25 m from the edge',
    basis: 'borrow', flag: 'Size to confirm',
    note: 'Measure it. A table longer than 1.2 m blocks the walkway on the right.' },
  { id: 'cloth', num: 8, cat: 'furniture', name: 'Tablecloth, black', size: 'Covers the top and the front to the floor', where: 'On the selling table',
    basis: 'buy',
    note: 'Black or very dark navy, so the table reads like the night sky under the tarp.', view: zoomTable },
  { id: 'chairs', num: 9, cat: 'furniture', name: 'Chairs', size: '2, any type', where: 'Behind the table',
    basis: 'borrow',
    note: 'Keep the walkway on the right clear.' },

  { id: 'box', num: 10, cat: 'home', name: 'Supply box', size: 'About 45 × 30 × 30 cm', where: 'Back left, on the floor',
    basis: 'home',
    note: 'Extra flyers and cards, pens for codes, tape, scissors, zip ties, chargers.' },

  { id: 'tent', num: 11, cat: 'space', name: 'Tent (our half)', size: '3 × 3 m tent; our half is 1.5 × 3 m (assumed). Eave at least 2.0 m', where: 'Venue and stall to confirm',
    basis: 'unquoted', flag: 'To confirm',
    note: 'This page assumes the same half-tent as the profstopick booth (Blueprint bazaar rules). Confirm the venue, the stall, the size, and the fee with the organizers.' },
];

const views = [
  { id: 'corner', label: 'Corner', az: 0.62, el: 0.5, tx: 1.15, ty: 1.05, tz: -1.35, size: 4.4, width: 5.4 },
  { id: 'aisle', label: 'Front', az: 0, el: 0.09, tx: 1.5, ty: 1.3, tz: -1.5, size: 3.5, width: 4.3 },
  { id: 'side', label: 'Side', az: Math.PI / 2, el: 0.05, tx: 1.4, ty: 1.45, tz: -1.2, size: 3.6, width: 5.6 },
  { id: 'top', label: 'Top', az: 0, el: Math.PI / 2, tx: 1.45, ty: 0, tz: -1.15, size: 4.7, width: 4.4 },
  { id: 'table', label: 'Table', ...zoomTable },
  { id: 'tarp', label: 'Tarp', ...zoomTarp },
];

const layers = [
  { name: 'dims', label: 'Dimensions', mobileOff: true },
  { name: 'roof', label: 'Roof' },
  { name: 'people', label: 'People' },
];

// ---------- page text ----------
// the sale, in five steps (the voucher flow in the app: a code on the join screen)
const steps = [
  ['1', 'Show', 'Let them see the landing page on the laptop: private, members only, made for networking.'],
  ['2', 'Check and sign in', 'They are 18+ with an Ateneo email. They scan the QR and sign in.'],
  ['3', 'Pay ₱50', 'Cash, or they scan the GCash QR. Check the payment came in.'],
  ['4', 'Give the card', 'Write or print the code on the back of a voucher card. Give it.'],
  ['5', 'Redeem', 'They tap “Have a code?” on the join screen and type it. Help them right there. Log the sale.'],
];

const trouble = [
  ['Site is down', 'Show the landing page screenshot on the laptop. Take their email and give the card anyway.'],
  ['No internet', 'Switch to a phone hotspot.'],
  ['QR won’t scan', 'Type the short link under the QR.'],
  ['Code does not work', 'Check the spelling. Note their email and the code. The admin page can check the code.'],
  ['Payment fails', 'Offer cash. Give a card only after the payment is in.'],
  ['Not an Ateneo email, or under 18', 'BlueLink is 18+ with an Ateneo email only. Do not sell a card.'],
  ['A question you cannot answer', 'Use the staff FAQ. If it is not there, write it down and ask the team.'],
];

// ---------- textures (the print on each piece) ----------
// The print comes from the print files (/assets/print/booth, made by `npm run print`).
// Pick a look in the list below the model and the texture changes.
const art = await loadArt('booth');

function makeTextures() {
  return {
    tarp: art.tex('tarp', { w: 1024 }),
    qr: art.tex('qr', { w: 512 }),
    flyer: art.tex('flyer', { w: 384 }),        // front of the flyer
    card: art.tex('card', { w: 256 }),          // front of the voucher card
    cardBack: art.tex('cardback', { w: 256 }),  // back of the card: the voucher code
  };
}

function brickTexture() {
  // A brick walk, running bond, 200 × 100 mm bricks. Texture covers 1.6 m × 1.6 m. The venue is still to confirm.
  const tex = canvasTexture(1024, 1024, (g, w, h) => {
    g.fillStyle = '#8f7d70'; g.fillRect(0, 0, w, h);
    const bw = 128, bh = 64, m = 4;
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let r = 0; r < h / bh; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let c = -1; c < w / bw + 1; c++) {
        const l = 30 + rnd() * 9;
        const hue = 9 + rnd() * 8;
        g.fillStyle = `hsl(${hue} 40% ${l}%)`;
        g.fillRect(c * bw + off + m / 2, r * bh + m / 2, bw - m, bh - m);
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// The demo laptop shows the landing page (assets/booth/screen.jpg, made by `npm run kit`).
async function screenTexture() {
  const tex = canvasTexture(1024, 640, (g, w, h) => { g.fillStyle = '#03050d'; g.fillRect(0, 0, w, h); });
  try {
    const im = await loadImage('/assets/booth/screen.jpg');
    const g = tex.image.getContext('2d');
    g.drawImage(im, 0, 0, tex.image.width, tex.image.height);
    tex.needsUpdate = true;
  } catch { /* no screenshot: a dark screen */ }
  return tex;
}

// ---------- the model ----------
async function build(S) {
  const tx = makeTextures();
  const screen = await screenTexture();
  await art.ready();

  const L = { dims: S.layer('dims'), roof: S.layer('roof'), people: S.layer('people') };

  // ground: a brick walk that fades into the white around it
  const bricks = brickTexture();
  const gw = 12, gd = 9;
  bricks.repeat.set(gw / 1.6, gd / 1.6);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), S.mat(0xffffff, { map: bricks }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(1.5, 0, -0.5);
  ground.receiveShadow = true;
  S.add(ground);
  const fade = canvasTexture(512, 512, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, w * 0.16, w / 2, h / 2, w * 0.5);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const fadeM = new THREE.Mesh(new THREE.PlaneGeometry(gw + 0.02, gd + 0.02), new THREE.MeshBasicMaterial({ map: fade, transparent: true, depthWrite: false }));
  fadeM.rotation.x = -Math.PI / 2;
  fadeM.position.set(1.5, 0.002, -0.5);
  S.add(fadeM);

  // our floor, the walkway, and the other group's floor
  S.add(S.box(0, 0.002, -DEPTH, HALF, 0.008, 0, S.mat(0xdfe6f5, { opacity: 0.4 }), { edges: false, cast: false }));
  S.add(S.box(T.x1, 0.009, -DEPTH, HALF, 0.012, 0, S.mat(0x93a8ff, { opacity: 0.35 }), { edges: false, cast: false }));
  S.add(S.box(HALF, 0.002, -DEPTH, 3, 0.008, 0, S.mat(0xc9cfdc, { opacity: 0.3 }), { edges: false, cast: false }));
  S.tag([2.25, 0.02, -1.5], 'other group', { cls: 'tag--zone' });
  S.tag([1.2, 0.02, -1.6], 'walkway', { cls: 'tag--soft' });
  S.tag([1.5, 0.02, 1.95], 'aisle', { cls: 'tag--zone' });

  // 11 tent frame
  const steel = S.mat(0xe9edf3);
  const frame = new THREE.Group();
  const leg = 0.035;
  [[0, 0], [3, 0], [3, -3], [0, -3]].forEach(([x, z]) => frame.add(S.box(x - leg / 2, 0, z - leg / 2, x + leg / 2, EAVE, z + leg / 2, steel)));
  const bar = 0.03;
  frame.add(S.box(0, EAVE - bar, -bar / 2, 3, EAVE, bar / 2, steel));
  frame.add(S.box(0, EAVE - bar, -3 - bar / 2, 3, EAVE, -3 + bar / 2, steel));
  frame.add(S.box(-bar / 2, EAVE - bar, -3, bar / 2, EAVE, 0, steel));
  frame.add(S.box(3 - bar / 2, EAVE - bar, -3, 3 + bar / 2, EAVE, 0, steel));
  S.put('tent', frame);
  // roof canopy
  const P = [1.5, PEAK, -1.5];
  const c = [[0, EAVE, 0], [3, EAVE, 0], [3, EAVE, -3], [0, EAVE, -3]];
  const tri = [];
  for (let i = 0; i < 4; i++) tri.push(...c[i], ...c[(i + 1) % 4], ...P);
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
  rg.computeVertexNormals();
  const roof = new THREE.Mesh(rg, S.mat(0xffffff, { opacity: 0.16, side: THREE.DoubleSide }));
  roof.userData.noPick = true;
  S.edges(roof, 10);
  L.roof.add(roof);
  // the line between the two halves (no middle bar)
  S.add(S.lines([[HALF, 0.01, 0], [HALF, 0.01, -DEPTH]], S.dimMat));

  // neighbour tents, as faint frames, so the row reads
  [-3, 3].forEach((dx) => {
    const pts = [];
    const [a, b] = dx < 0 ? [-3, 0] : [3, 6];
    [[a, 0], [b, 0], [b, -3], [a, -3]].forEach(([x, z]) => pts.push([x, 0, z], [x, EAVE, z]));
    pts.push([a, EAVE, 0], [b, EAVE, 0], [a, EAVE, -3], [b, EAVE, -3], [a, EAVE, 0], [a, EAVE, -3], [b, EAVE, 0], [b, EAVE, -3]);
    const pk = [(a + b) / 2, PEAK, -1.5];
    [[a, 0], [b, 0], [b, -3], [a, -3]].forEach(([x, z]) => pts.push([x, EAVE, z], pk));
    S.add(S.lines(pts, S.faintMat));
    S.tag([(a + b) / 2, 0.02, -1.5], 'next tent', { cls: 'tag--soft' });
  });

  // 1 tarpaulin, hung from the back bar, top edge at the eave
  const tarp = S.panel({ w: TP.w, h: TP.h, t: 0.003, map: tx.tarp, back: 0x111111 });
  tarp.position.set(TP.x, TP.top - TP.h / 2, TP.z);
  S.put('tarp', tarp);
  // zip ties at the 2 top grommets and string from the 2 bottom ones
  const tieM = S.mat(0x1a1d26);
  const ties = new THREE.Group();
  [TP.x - TP.w / 2 + 0.03, TP.x + TP.w / 2 - 0.03].forEach((x) => {
    ties.add(S.box(x - 0.006, TP.top - 0.01, TP.z - 0.03, x + 0.006, EAVE - bar / 2, TP.z + 0.004, tieM, { edges: false }));
  });
  ties.add(S.lines([[TP.x - TP.w / 2 + 0.03, TP.top - TP.h + 0.03, TP.z], [0, 0.95, -DEPTH]], S.faintMat));
  S.put('ties', ties);

  // 7 selling table
  const tableTop = S.mat(0xf4f1ea);
  const legM = S.mat(0x9aa3b5);
  const table = new THREE.Group();
  table.add(S.box(T.x0, T.h - 0.03, T.z0, T.x1, T.h, T.z1, tableTop));
  [[T.x0 + 0.04, T.z0 + 0.04], [T.x1 - 0.04, T.z0 + 0.04], [T.x0 + 0.04, T.z1 - 0.04], [T.x1 - 0.04, T.z1 - 0.04]]
    .forEach(([x, z]) => table.add(S.cyl(x, 0, z, 0.012, T.h - 0.03, legM)));
  S.put('table', table);

  // 8 tablecloth, black: over the top, down the front and both sides. The back stays open for the seller.
  const clothM = S.mat(0x0b0e1a);
  const cloth = new THREE.Group();
  const co = 0.012;
  cloth.add(S.box(T.x0 - co, T.h - 0.034, T.z0 - co, T.x1 + co, T.h + 0.001, T.z1 + co, clothM));
  cloth.add(S.box(T.x0 - co, 0.02, T.z1, T.x1 + co, T.h - 0.034, T.z1 + co, clothM));
  cloth.add(S.box(T.x0 - co, 0.02, T.z0 - co, T.x0, T.h - 0.034, T.z1, clothM));
  cloth.add(S.box(T.x1, 0.02, T.z0 - co, T.x1 + co, T.h - 0.034, T.z1, clothM));
  S.put('cloth', cloth);

  // 2 the A4 QR sign in 5 its acrylic stand, back row
  const acrylic = S.mat(0xdfe8f5, { opacity: 0.38 });
  const sign = S.panel({ w: QR.w, h: QR.h, t: 0.003, map: tx.qr });
  const sg = new THREE.Group();
  sign.position.set(0, QR.h / 2 + 0.012, 0);
  sg.add(sign);
  sg.position.set(QR.x, T.h, QR.z);
  sg.rotation.x = -0.14;
  S.put('qr', sg);
  const stand = new THREE.Group();
  stand.add(S.box(QR.x - 0.115, T.h, QR.z - 0.05, QR.x + 0.115, T.h + 0.008, QR.z + 0.035, acrylic, { cast: false }));
  const back = S.box(-0.112, 0, -0.004, 0.112, 0.315, 0.0, acrylic, { cast: false });
  const bg = new THREE.Group();
  bg.add(back);
  bg.position.set(QR.x, T.h + 0.008, QR.z - 0.006);
  bg.rotation.x = -0.14;
  stand.add(bg);
  S.put('qrstand', stand);

  // front row, flat
  const flat = (w, d, x, z, map, y = T.h, t = 0.003) => {
    const p = S.panel({ w, h: d, t, face: '+y', map });
    p.position.set(x, y + t / 2, z);
    return p;
  };
  // 3 flyers
  const flyers = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const f = flat(0.105, 0.148, 0.2, -0.36, tx.flyer, T.h + i * 0.0025, 0.0025);
    f.rotation.y = -0.08 + i * 0.025;
    flyers.add(f);
  }
  S.put('flyers', flyers);
  // 4 voucher cards
  const cards = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const cd = flat(0.105, 0.074, 0.38, -0.32, tx.card, T.h + i * 0.0022, 0.0022);
    cd.rotation.y = 0.06 - i * 0.03;
    cards.add(cd);
  }
  // one card turned over beside the stack, to show the back (the voucher code)
  const cb = flat(0.105, 0.074, 0.41, -0.43, tx.cardBack, T.h, 0.0022);
  cb.rotation.y = -0.1;
  cards.add(cb);
  S.put('card', cards);

  // 6 demo laptop, screen to the aisle
  const laptop = new THREE.Group();
  const shell = S.mat(0x3a3f4b);
  laptop.add(S.box(LAP.x0, T.h, LAP.z0, LAP.x1, T.h + 0.016, LAP.z1, shell));
  laptop.add(S.box(LAP.x0 + 0.02, T.h + 0.016, LAP.z0 + 0.02, LAP.x1 - 0.02, T.h + 0.018, LAP.z0 + 0.13, S.mat(0x15171d)));   // keys
  const lid = new THREE.Group();
  const lidW = LAP.x1 - LAP.x0, lidH = 0.21;
  lid.add(S.box(-lidW / 2, 0, -0.008, lidW / 2, lidH, 0, shell));
  const disp = S.panel({ w: lidW - 0.02, h: lidH - 0.025, t: 0.002, map: screen, edges: false });
  disp.position.set(0, (lidH - 0.025) / 2 + 0.012, 0.001);
  lid.add(disp);
  lid.position.set((LAP.x0 + LAP.x1) / 2, T.h + 0.016, LAP.z0);
  lid.rotation.x = -0.24;
  laptop.add(lid);
  S.put('laptop', laptop);

  // 9 chairs, behind the table. Back rest away from the table.
  const chairM = S.mat(0x5a6170);
  const chairs = new THREE.Group();
  CH_X.forEach((x) => {
    const r = 0.21, z = CH_Z;
    chairs.add(S.box(x - r, 0.43, z - r, x + r, 0.46, z + r, chairM));
    chairs.add(S.box(x - r, 0.46, z - r, x + r, 0.86, z - r + 0.03, chairM));
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dz]) => chairs.add(S.cyl(x + dx * (r - 0.02), 0, z + dz * (r - 0.02), 0.011, 0.43, legM)));
  });
  S.put('chairs', chairs);

  // 10 supply box
  S.put('box', S.box(0.06, 0, -2.6, 0.51, 0.3, -2.3, S.mat(0xc79b6a)));

  // people: the seller between the table and the chairs, and someone in the aisle with flyers
  L.people.add(S.person(0.45, -1.03, { h: 1.7526 }));
  S.tag([0.45, 1.86, -1.03], 'seller, 5′9″', { cls: 'tag--soft', layer: 'people' });
  L.people.add(S.person(2.6, 1.3, { h: 1.7 }));
  S.tag([2.6, 1.82, 1.3], 'flyers in the aisle', { cls: 'tag--soft', layer: 'people' });

  // ---------- size lines ----------
  S.dim([0, 0, 0], [HALF, 0, 0], '1.5 m', { off: [0, 0, 0.32], tick: [0, 0, 1] });
  S.dim([0, 0, 0], [0, 0, -DEPTH], '3 m', { off: [-0.32, 0, 0], tick: [1, 0, 0] });
  S.dim([0, 0, 0], [0, EAVE, 0], 'eave 2.0 m', { off: [-0.3, 0, 0.3], tick: [1, 0, 0] });
  S.dim([3, 0, -1.5], [3, PEAK, -1.5], 'peak 3.05 m (estimate)', { off: [0.75, 0, 0], tick: [1, 0, 0] });
  S.dim([TP.x - TP.w / 2, TP.top, TP.z + 0.02], [TP.x + TP.w / 2, TP.top, TP.z + 0.02], '4 ft (1.22 m)', { off: [0, 0.14, 0], tick: [0, 1, 0] });
  S.dim([TP.x + TP.w / 2, TP.top - TP.h, TP.z + 0.02], [TP.x + TP.w / 2, TP.top, TP.z + 0.02], '3 ft (0.91 m)', { off: [0.16, 0, 0], tick: [1, 0, 0] });
  S.dim([T.x1, 0.02, -2.05], [HALF, 0.02, -2.05], '0.6 m', { tick: [0, 0, 1] });
  S.dim([0, 0.01, 0], [0, 0.01, T.z1], '0.25 m', { off: [0.06, 0, 0], tick: [1, 0, 0] });

  // ---------- pins (numbers match the list) ----------
  const pins = {
    tarp: [TP.x, TP.top - TP.h / 2, TP.z + 0.03], qr: [QR.x, T.h + 0.36, QR.z],
    flyers: [0.2, T.h + 0.06, -0.36], card: [0.38, T.h + 0.05, -0.32],
    qrstand: [QR.x + 0.13, T.h + 0.02, QR.z + 0.02],
    laptop: [(LAP.x0 + LAP.x1) / 2, T.h + 0.26, LAP.z0 - 0.04], table: [T.x1, 0.42, T.z0],
    cloth: [T.x0 + 0.22, 0.38, T.z1 + 0.02], chairs: [CH_X[1] + 0.1, 0.9, CH_Z - 0.2],
    box: [0.28, 0.32, -2.45], tent: [3, EAVE - 0.25, 0],
  };
  pieces.forEach((p) => {
    if (!p.num || !pins[p.id]) return;
    S.pin(p.id, p.num, pins[p.id], 'pins');
  });
}

// ---------- page text that is not in the model ----------
document.getElementById('caption').textContent =
  'Measurements in metres. The booth size (1.5 × 3 m, half of a shared tent) is assumed until the organizers confirm it. The tarpaulin is 4 × 3 ft. The table size is an estimate until measured.';
document.getElementById('steps').innerHTML = steps.map(([n, title, text]) => `<li><span class="step__n">${n}</span><b>${title}</b><span>${text}</span></li>`).join('');
document.getElementById('trouble').innerHTML = trouble.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('');

mountPage({ pieces, groups, views, layers, build, shadowBox: 6 }).then((stage) => {
  if (stage) art.onChange(() => { stage.dirty = true; });
  mountAssets(art, { pieces, stage });
});
