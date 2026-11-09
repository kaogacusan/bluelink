// Builds every brand file for the /kit page and the zip.
//   npm run kit          (runs scripts/kit/wordmark.py first if wordmark.json is missing)
//
// Writes:
//   assets/kit/brand/    logo SVGs (outlined, no font needed) and PNGs, app icons
//   assets/kit/motif/    star field, constellation, horizon, plate marks, the Deep Field background
//   assets/kit/share/    IG post 1080 × 1350, IG story 1080 × 1920, link preview 1200 × 630
//   assets/kit/sheet/    color and type sheets (PNG)
//   assets/kit/index.json   what the page lists
//   assets/kit/bluelink-brand-kit.zip
//   assets/booth/screen.jpg  the landing page on the 3D demo laptop
import { chromium } from 'playwright-core';
import { mkdir, writeFile, readFile, rm, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { C, F, BASE_CSS, fontLinks, markSvg, skySvg, horizonSvg, constellationSvg, plateSvg, qrTile, URLS, peso } from '../print/kit.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const KIT = `${ROOT}assets/kit/`;
const WM_JSON = fileURLToPath(new URL('./wordmark.json', import.meta.url));
if (!existsSync(WM_JSON)) execFileSync('python3', [fileURLToPath(new URL('./wordmark.py', import.meta.url))], { stdio: 'inherit' });
const WM = JSON.parse(await readFile(WM_JSON, 'utf8'));

for (const d of ['brand', 'motif', 'share', 'sheet']) await rm(`${KIT}${d}`, { recursive: true, force: true });
for (const d of ['brand', 'motif', 'share', 'sheet']) await mkdir(`${KIT}${d}`, { recursive: true });
await mkdir(`${ROOT}assets/booth`, { recursive: true });

const files = [];   // { group, name, file, w, h, about }
const add = (group, name, file, about, w, h) => files.push({ group, name, file: `/assets/kit/${file}`, about, w, h });
const svgDoc = (w, h, inner, vb = `0 0 ${w} ${h}`) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>\n`;

// ---------- logo ----------
// The mark: the app's two chain links (viewBox 32). A fixed clip id, since each file has one mark.
const markInner = (front, back) => `<defs><clipPath id="bl-over"><circle cx="20" cy="13" r="4.2"/></clipPath></defs><g fill="none" stroke-width="4">`
  + `<rect x="3" y="7" width="17" height="12" rx="6" stroke="${back}"/><rect x="12" y="13" width="17" height="12" rx="6" stroke="${front}"/>`
  + `<rect x="3" y="7" width="17" height="12" rx="6" stroke="${back}" clip-path="url(#bl-over)"/></g>`;
// The word, outlined. Font size 200 in a 300-tall lockup (the app: mark 30 px, word 20 px, gap 9 px).
const WS = 0.2;
const wordInner = (color, x = 0, base = 0) => `<path fill="${color}" transform="translate(${x} ${base}) scale(${WS})" d="${WM.d}"/>`;
const capH = WM.cap * WS;
const wordW = +(WM.w * WS).toFixed(2);
// lockup: mark 300 × 300 at 0,0; word left at 390, cap centered on the mark
const LX = 390, BASE = +(150 + capH / 2).toFixed(2);
const LW = +(LX + wordW + 6).toFixed(2);
const lockupSvg = (front, back, word) => svgDoc(LW, 240, `<g transform="translate(0 -30)"><g transform="scale(${300 / 32})">${markInner(front, back)}</g>${wordInner(word, LX, BASE)}</g>`, `0 0 ${LW} 240`);
// the word alone, cropped to its ink with a small margin
const wordSvg = (color) => {
  const [x0, y0, x1, y1] = WM.bounds.map((v) => v * WS);
  const pad = 8, w = +(x1 - x0 + 2 * pad).toFixed(2), h = +(y1 - y0 + 2 * pad).toFixed(2);
  return svgDoc(w, h, wordInner(color, +(pad - x0).toFixed(2), +(pad - y0).toFixed(2)), `0 0 ${w} ${h}`);
};
const markFile = (front, back) => svgDoc(320, 320, `<g transform="scale(10)">${markInner(front, back)}</g>`);
// app icon: a square of night sky, the mark in the middle, the planet's rim glowing at the bottom
const iconSvg = (size = 512) => svgDoc(size, size, `
  <defs>
    <radialGradient id="ig" cx="0.5" cy="1.08" r="0.62"><stop offset="0.62" stop-color="${C.glow}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="ir" x1="0" x2="1"><stop offset="0" stop-color="#dfe6ff" stop-opacity="0"/><stop offset="0.5" stop-color="#dfe6ff" stop-opacity="0.9"/><stop offset="1" stop-color="#dfe6ff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="${C.void}"/>
  <rect width="512" height="512" fill="url(#ig)"/>
  <circle cx="256" cy="1600" r="1150" fill="#060a19"/>
  <circle cx="256" cy="1600" r="1150" fill="none" stroke="url(#ir)" stroke-width="3"/>
  <g fill="#fff"><circle cx="96" cy="88" r="2.2"/><circle cx="418" cy="132" r="1.6"/><circle cx="372" cy="64" r="1.2" opacity="0.7"/><circle cx="140" cy="168" r="1.1" opacity="0.6"/><circle cx="430" cy="300" r="1.3" opacity="0.6"/><circle cx="70" cy="320" r="1" opacity="0.5"/></g>
  <g transform="translate(96 88) scale(10)">${markInner('#ffffff', C.peri)}</g>`, '0 0 512 512');

const brandSvgs = [
  ['lockup-light', lockupSvg(C.signal, C.peri, C.ink), 'Logo on light. Navy word, blue and periwinkle links.'],
  ['lockup-dark', lockupSvg('#ffffff', C.peri, '#ffffff'), 'Logo on dark. White word, white and periwinkle links.'],
  ['lockup-ink', lockupSvg(C.ink, C.ink, C.ink), 'One color, navy. For stamps, receipts, one-color prints.'],
  ['lockup-white', lockupSvg('#ffffff', '#ffffff', '#ffffff'), 'One color, white. For photos and dark grounds.'],
  ['mark', markFile(C.signal, C.peri), 'The mark on light.'],
  ['mark-dark', markFile('#ffffff', C.peri), 'The mark on dark.'],
  ['mark-ink', markFile(C.ink, C.ink), 'The mark, one color navy.'],
  ['mark-white', markFile('#ffffff', '#ffffff'), 'The mark, one color white.'],
  ['wordmark-ink', wordSvg(C.ink), 'The word alone, navy.'],
  ['wordmark-white', wordSvg('#ffffff'), 'The word alone, white.'],
  ['app-icon', iconSvg(), 'App icon: night sky, the mark, the planet’s rim.'],
];
for (const [name, svg] of brandSvgs) await writeFile(`${KIT}brand/${name}.svg`, svg);

// ---------- motifs ----------
// The print helpers draw in mm; here 1 unit = 1 px.
const standalone = (svg, w, h) => svg.replace('class="fill"', `width="${w}" height="${h}"`).replace(/preserveAspectRatio="none" /, '');
const MW = 1920, MH = 1080;
const motifSvgs = [
  ['star-field', standalone(skySvg({ w: MW, h: MH, seed: 'kit-sky', density: 0.03, band: 0.38 }), MW, MH), 'Real stars, a faint band and haze. Transparent: put it on Void.'],
  ['constellation', standalone(constellationSvg({ w: MW, h: MH, box: [260, 200, 1400, 620], seed: 'kit-c', count: 7, labels: ['Open for work', 'Find a mentor', 'Ask for an intro'], labelSize: 15, unit: 10.8 }), MW, MH), 'One constellation with catalog labels. A line is two people connected.'],
  ['horizon', standalone(horizonSvg({ w: MW, h: MH, top: 820, sun: true }), MW, MH), 'The planet’s edge with its atmosphere rim and a rising sun.'],
  ['plate-marks', standalone(plateSvg({ w: MW, h: MH, inset: 48, color: C.star, opacity: 0.55 }), MW, MH), 'Corner crosshairs, like a star-chart plate. Transparent.'],
];
for (const [name, svg] of motifSvgs) await writeFile(`${KIT}motif/${name}.svg`, svg);

// ---------- pages to photograph ----------
const doc = (w, h, body, css = '') => `<!doctype html><html><head><meta charset="utf-8">${fontLinks()}<style>${BASE_CSS}
html,body{width:${w}px;height:${h}px;background:transparent}body{position:relative;overflow:hidden}${css}</style></head><body>${body}</body></html>`;
const bg = (c) => `<div class="fill" style="background:${c}"></div>`;
const word = (px, color) => `<span class="wm" style="font-size:${px}px;color:${color}">BlueLink</span>`;
const lock = (px, { word: wc = '#fff', front = '#fff', back = C.peri } = {}) => `<div class="lockup" style="gap:${px * 0.3}px">${markSvg({ front, back, size: `${px}px` })}${word(px * 0.68, wc)}</div>`;
const mono = (t, px, color, extra = '') => `<span class="m nw" style="font-size:${px}px;color:${color};${extra}">${t}</span>`;
const hl = (t) => t.replace(/\*(.+?)\*/g, `<span style="color:${C.peri}">$1</span>`);
// top = null: no planet (the share cards). The planet stays on the tarpaulin, the screen, and the motif sheet.
const deepField = (w, h, top, { seed = 'share', density = 0.03, cons, sun = true } = {}) =>
  bg(C.void) + skySvg({ w, h, seed, density, band: 0.38 }) + (cons ? constellationSvg({ w, h, seed: `${seed}-c`, count: 6, unit: Math.min(w, h) / 100, ...cons }) : '') + (top == null ? '' : horizonSvg({ w, h, top, sun })) + plateSvg({ w, h, inset: Math.round(Math.min(w, h) * 0.04), color: C.star, opacity: 0.45 });

const shareCards = [
  ['ig-post', 1080, 1350, 'Instagram post, 4:5. The promise and the price.', () => `
    ${deepField(1080, 1350, null, { seed: 'ig-post', cons: { box: [560, 150, 420, 260], labels: ['Find a mentor'], labelSize: 17 } })}
    <div class="abs" style="left:88px;top:92px">${lock(64)}</div>
    <div class="abs" style="left:88px;top:400px"><div class="d" style="font-size:112px;color:${C.star}">${hl('The private<br>network where<br>asking is<br>*normal.*')}</div>
      <div class="t" style="font-size:36px;margin-top:40px;max-width:800px;color:${C.sub}">${F.support}</div></div>
    <div class="abs" style="left:88px;bottom:96px;display:flex;align-items:baseline;gap:28px"><span class="d nw" style="font-size:76px;color:${C.star}">${peso(F.price)}<span style="font-size:38px;font-weight:600;color:${C.sub};margin-left:10px;letter-spacing:-0.01em">${F.per}</span></span>${mono('Members only', 22, C.muted)}</div>
    <div class="abs" style="right:88px;bottom:104px">${mono(F.site, 22, C.peri)}</div>
    <div class="abs t" style="left:88px;bottom:52px;font-size:20px;color:${C.muted}">${F.unofficial}</div>`],
  ['ig-story', 1080, 1920, 'Instagram story, 9:16. “Find your people.” and how to join.', () => `
    ${deepField(1080, 1920, null, { seed: 'ig-story', cons: { box: [520, 260, 460, 300], labels: ['Ask for an intro'], labelSize: 18 } })}
    <div class="abs" style="left:88px;top:150px">${lock(70)}</div>
    <div class="abs" style="left:88px;top:600px"><div class="d" style="font-size:210px;letter-spacing:-0.05em;line-height:0.9;color:${C.star}">${hl('Find your<br>*people.*')}</div>
      <div class="t" style="font-size:40px;font-weight:600;margin-top:44px;color:${C.sub}">The private network where asking is normal.</div></div>
    <div class="abs" style="left:88px;right:88px;top:1250px">
      ${F.steps.map(([t, d], i) => `<div style="display:grid;grid-template-columns:90px 1fr;padding:26px 0;border-top:2px solid rgba(170,185,255,0.2)">${mono(`0${i + 1}`, 26, C.peri, 'padding-top:8px')}<div><div style="font-size:44px;font-weight:700;letter-spacing:-0.02em;color:${C.star}">${peso(t)}</div><div class="t" style="font-size:32px;margin-top:4px;color:${C.sub}">${d}</div></div></div>`).join('')}</div>
    <div class="abs" style="left:88px;right:88px;bottom:120px;display:flex;justify-content:space-between">${mono(peso(`${F.price} ${F.per}`), 26, C.star)}${mono(F.site, 26, C.peri)}</div>
    <div class="abs t" style="left:88px;bottom:66px;font-size:22px;color:${C.muted}">${F.age} ${F.unofficial}</div>`],
  ['link-preview', 1200, 630, 'Link preview (Open Graph), 1200 × 630.', () => `
    ${deepField(1200, 630, null, { seed: 'og', cons: { box: [760, 70, 360, 170], labels: ['Open for work'], labelSize: 13 } })}
    <div class="abs" style="left:72px;top:66px">${lock(44)}</div>
    <div class="abs" style="left:72px;top:190px"><div class="d" style="font-size:72px;color:${C.star}">${hl('The private network<br>where asking is *normal.*')}</div></div>
    <div class="abs" style="left:72px;bottom:44px;display:flex;gap:28px;align-items:baseline"><span class="d nw" style="font-size:40px;color:${C.star}">${peso(F.price)}<span style="font-size:22px;font-weight:600;color:${C.sub};margin-left:6px;letter-spacing:-0.01em">${F.per}</span></span>${mono(`${F.forWho} · Members only`, 15, C.muted)}</div>
    <div class="abs t" style="right:72px;bottom:46px;font-size:14px;color:${C.muted}">${F.unofficial}</div>`],
];

// color and type sheets
const SWATCHES = [
  ['Void', C.void, 'The sky. Main dark ground.', '#fff'], ['Deep', C.deep, 'Panels on dark. The night side.', '#fff'],
  ['Ink', C.ink, 'Text on light. Brand navy.', '#fff'], ['Signal', C.signal, 'The BlueLink blue. One key word.', '#fff'],
  ['Glow', C.glow, 'Blue on dark. The atmosphere rim.', '#fff'], ['Peri', C.peri, 'Lines and labels on dark.', C.ink],
  ['Starlight', C.star, 'Text on dark.', C.ink], ['Paper', C.paper, 'Light ground for long reading.', C.ink],
  ['Flare', C.flare, 'A warm star. One small thing, never a ground.', C.ink],
];
const sheets = [
  ['colors', 1600, 1000, 'The nine colors with hex codes and what each is for.', () => `${bg(C.void)}${plateSvg({ w: 1600, h: 1000, inset: 32, color: C.star, opacity: 0.4 })}
    <div class="abs" style="left:72px;top:64px;right:72px;display:flex;justify-content:space-between;align-items:center">${lock(36)}${mono('Color · Deep Field', 16, C.muted)}</div>
    <div class="abs" style="left:72px;right:72px;top:150px;bottom:72px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    ${SWATCHES.map(([n, hex, use, fg]) => `<div style="background:${hex};${hex === C.void ? 'box-shadow:inset 0 0 0 1px rgba(170,185,255,0.22);' : ''}padding:26px 28px;display:flex;flex-direction:column;justify-content:space-between;color:${fg}">
      <div style="font-size:30px;font-weight:700;letter-spacing:-0.02em">${n}</div>
      <div><div class="m" style="font-size:18px;opacity:0.9">${hex.toUpperCase()}</div><div class="t" style="font-size:17px;margin-top:6px;opacity:0.78">${use}</div></div></div>`).join('')}</div>`],
  ['type', 1600, 1000, 'Inter for words, JetBrains Mono for labels and numbers.', () => `${bg(C.void)}${skySvg({ w: 1600, h: 1000, seed: 'type', density: 0.012, band: 0.2 })}${plateSvg({ w: 1600, h: 1000, inset: 32, color: C.star, opacity: 0.4 })}
    <div class="abs" style="left:72px;top:64px;right:72px;display:flex;justify-content:space-between;align-items:center">${lock(36)}${mono('Type · Deep Field', 16, C.muted)}</div>
    <div class="abs" style="left:72px;top:170px;width:900px">
      ${mono('Inter 800 · tracking −4% · cv05 cv11 ss03', 16, C.peri)}
      <div class="d" style="font-size:132px;margin-top:22px;color:${C.star}">${hl('Find your<br>*people.*')}</div>
      <div class="t" style="font-size:30px;margin-top:34px;color:${C.sub};max-width:760px">${F.support} Only members see your posts, so asking is normal here.</div>
      ${mono('Inter 500 · body', 14, C.muted, 'display:block;margin-top:14px')}</div>
    <div class="abs" style="left:1060px;top:170px;right:72px">
      ${mono('JetBrains Mono 500 · uppercase · +8%', 16, C.peri)}
      <div class="m" style="font-size:30px;margin-top:26px;color:${C.star};line-height:1.7">Members only<br>Open for work<br>14.6395° N<br>121.0781° E<br>XXXX-XXXX</div>
      <div style="margin-top:40px;font-size:150px;font-weight:300;letter-spacing:-0.04em;color:${C.star}">Aa<span style="font-weight:800">Aa</span></div>
      ${mono('Two weights per piece at most. No italics.', 14, C.muted, 'display:block;margin-top:6px')}</div>`],
];

// the landing page on the demo laptop (assets/booth/screen.jpg): what a visitor sees first
const screen = () => `${deepField(1280, 800, 640, { seed: 'screen', cons: { box: [820, 60, 380, 170], labels: [] }, sun: true })}
  <div class="abs" style="left:64px;top:40px">${lock(30)}</div>
  <div class="abs" style="right:64px;top:42px;padding:9px 16px;border:1px solid rgba(170,185,255,0.3);color:${C.star};font-size:15px;font-weight:600">Sign in</div>
  <div class="abs" style="left:64px;top:150px"><div class="d" style="font-size:68px;color:${C.star}">${hl('The private<br>network where<br>asking is *normal.*')}</div>
    <div class="t" style="font-size:21px;margin-top:26px;max-width:560px;color:${C.sub}">${F.support} Only members see your posts, so asking is normal here.</div>
    <div style="display:flex;gap:10px;margin-top:30px"><div style="width:330px;height:52px;border:1px solid rgba(170,185,255,0.22);display:flex;align-items:center;padding:0 16px;font-size:17px;color:rgba(238,241,250,0.4)">you@student.ateneo.edu</div><div style="height:52px;padding:0 22px;background:${C.signal};color:#fff;display:flex;align-items:center;font-size:17px;font-weight:650">Join BlueLink →</div></div></div>
  <div class="abs" style="left:64px;bottom:40px">${mono('₱50 a semester · Members only', 14, C.muted)}</div>`;

// ---------- photograph ----------
const browser = await chromium.launch();
const shot = async (html, w, h, path, { transparent = false, type = 'png', quality } = {}) => {
  const tab = await browser.newPage({ viewport: { width: w, height: h } });
  await tab.setContent(html, { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path, omitBackground: transparent, type, ...(quality ? { quality } : {}) });
  await tab.close();
};
const svgPage = (svg, w, h) => doc(w, h, `<div style="width:${w}px;height:${h}px">${svg.replace(/width="[\d.]+" height="[\d.]+"/, 'width="100%" height="100%"')}</div>`);
try {
  // logo PNGs
  for (const [name, svg, about] of brandSvgs) {
    const isIcon = name === 'app-icon', isMark = name.startsWith('mark');
    const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const [vw, vh] = [+vb[1], +vb[2]];
    const w = isIcon ? 1024 : isMark ? 1024 : 2400, h = Math.round((w * vh) / vw);
    await shot(svgPage(svg, w, h), w, h, `${KIT}brand/${name}.png`, { transparent: !isIcon });
    add('logo', name, `brand/${name}.svg`, about, vw, vh);
  }
  // app icon sizes
  const icon = brandSvgs.find(([n]) => n === 'app-icon')[1];
  for (const s of [512, 192, 180, 32]) await shot(svgPage(icon, s, s), s, s, `${KIT}brand/icon-${s}.png`);
  // motif PNGs (on Void, so they read in a viewer)
  for (const [name, svg, about] of motifSvgs) {
    await shot(svgPage(svg, MW, MH), MW, MH, `${KIT}motif/${name}.png`, { transparent: true });
    add('motif', name, `motif/${name}.svg`, about, MW, MH);
  }
  const bgHtml = doc(MW, MH, deepField(MW, MH, 860, { seed: 'kit-bg', cons: { box: [1100, 120, 640, 300], labels: ['Open for work', 'Study buddies'], labelSize: 15 } }));
  await shot(bgHtml, MW, MH, `${KIT}motif/deep-field-background.png`);
  add('motif', 'deep-field-background', 'motif/deep-field-background.png', 'Everything together: sky, constellation, horizon, plate marks. For slides and video.', MW, MH);
  // share cards and sheets
  for (const [name, w, h, about, body] of shareCards) {
    await shot(doc(w, h, body()), w, h, `${KIT}share/${name}.png`);
    add('share', name, `share/${name}.png`, about, w, h);
  }
  for (const [name, w, h, about, body] of sheets) {
    await shot(doc(w, h, body()), w, h, `${KIT}sheet/${name}.png`);
    add('sheet', name, `sheet/${name}.png`, about, w, h);
  }
  await shot(doc(1280, 800, screen()), 1280, 800, `${ROOT}assets/booth/screen.jpg`, { type: 'jpeg', quality: 86 });
} finally {
  await browser.close();
}

// ---------- zip ----------
const ZIP = `${KIT}bluelink-brand-kit.zip`;
const BRAND_MD = `${process.env.HOME}/BlueLink/BRAND.md`;
await rm(ZIP, { force: true });
const STAGE = `${ROOT}.kit-zip/bluelink-brand-kit/`;
await rm(`${ROOT}.kit-zip`, { recursive: true, force: true });
await mkdir(STAGE, { recursive: true });
execFileSync('cp', ['-R', `${KIT}brand`, `${KIT}motif`, `${KIT}share`, `${KIT}sheet`, STAGE]);
await mkdir(`${STAGE}fonts`, { recursive: true });
await copyFile(`${KIT}fonts/InterVariable-latin.woff2`, `${STAGE}fonts/InterVariable-latin.woff2`);
await writeFile(`${STAGE}fonts/README.txt`, 'Inter (Latin, variable) is the font in the app. Turn on cv05, cv11 and ss03.\nJetBrains Mono is free on Google Fonts: https://fonts.google.com/specimen/JetBrains+Mono\nBoth are under the SIL Open Font License.\n');
if (existsSync(BRAND_MD)) await copyFile(BRAND_MD, `${STAGE}BRAND.md`);
execFileSync('zip', ['-qr', ZIP, 'bluelink-brand-kit'], { cwd: `${ROOT}.kit-zip` });
await rm(`${ROOT}.kit-zip`, { recursive: true, force: true });

const zipKb = Math.round((await stat(ZIP)).size / 1024);
await writeFile(`${KIT}index.json`, `${JSON.stringify({ zip: { file: '/assets/kit/bluelink-brand-kit.zip', kb: zipKb }, files }, null, 1)}\n`);
console.log(`kit: ${files.length} files, zip ${zipKb} KB`);
