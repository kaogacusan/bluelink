// Voucher cards with the real codes: front, back, front, back ... one pair of 90 × 54 mm pages per code.
// The PDF goes next to the codes file, never in assets/: the booth site is public and each code is a paid membership.
//
// Make the codes in the app first: Admin → Voucher cards → Make codes → Save codes. That saves a .txt, one code per line.
//
//   npm run cards -- ~/Downloads/codes.txt                 look v1 (Deep Field), Lifetime
//   npm run cards -- ~/Downloads/codes.txt v2              any look: v1, v2, v3
//   npm run cards -- ~/Downloads/codes.txt v1 founding     every code in the file is a founding member code
//
// codes.txt: one code per line (like BL-ACDE-FGHJ). Lines that start with # are skipped.
// A line with only a code prints the file's pass (Lifetime unless you add `founding`, the 1-year card).
// One line can name its own pass after a comma:  BL-ACDE-FGHJ, founding
// The founding card leaves the price paid blank, to write in.
import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { BASE_CSS, fontLinks, LOOKS, peso } from './kit.mjs';
import { CARD_MM, cardFront, cardBack, passFor } from './booth.mjs';
import { pageCss, pdfOptions, trimPdf } from './pdf.mjs';

const [file, look = 'v1', filePass = ''] = process.argv.slice(2);
if (!file || !LOOKS.some((L) => L.id === look)) {
  console.error('Use: npm run cards -- <codes.txt> [v1 | v2 | v3] [lifetime | founding]');
  process.exit(1);
}
const cards = (await readFile(file, 'utf8')).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { const [code, pass = filePass] = l.split(',').map((x) => x.trim()); return { code, pass }; });
if (!cards.length) { console.error(`No codes in ${file}`); process.exit(1); }
const bad = cards.find((c) => !passFor(c.pass));
if (bad) { console.error(`No pass called "${bad.pass}" (code ${bad.code}). Use lifetime or founding.`); process.exit(1); }

const [w, h] = CARD_MM;
const pg = (inner) => `<section class="pg" style="width:${w}mm;height:${h}mm">${peso(inner)}</section>`;
const html = `<!doctype html><html><head><meta charset="utf-8">${fontLinks()}
<style>${pageCss(CARD_MM)}${BASE_CSS}</style></head><body>${cards.map((c) => pg(cardFront(look, passFor(c.pass))) + pg(cardBack(look, c))).join('')}</body></html>`;

const out = join(dirname(resolve(file)), `voucher-cards-${look}.pdf`);
const browser = await chromium.launch();
try {
  const tab = await browser.newPage();
  await tab.setContent(html, { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.pdf(pdfOptions(out, CARD_MM));
} finally {
  await browser.close();
}
await trimPdf(out, CARD_MM); // exactly 90 × 54 mm, no white edge (see pdf.mjs)
console.log(`${cards.length} cards, ${cards.length * 2} pages: ${out}`);
