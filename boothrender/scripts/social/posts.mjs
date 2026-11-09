// Instagram posts as PNGs, 1080 × 1350 (4:5), one folder per look, plus captions.txt.
// The designs are `instaPost` in scripts/print/booth.mjs and the words are HOOKS in scripts/print/kit.mjs,
// so the posts here match "Instagram posts" in Print files.
//
//   npm run posts                       ~/Downloads/ADVO/BLUELINK/Instagram
//   npm run posts -- <folder>           somewhere else
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { BASE_CSS, fontLinks, LOOKS, HOOKS, hookText, peso } from '../print/kit.mjs';
import { instaPost, INSTA_CSS, INSTA_PX } from '../print/booth.mjs';

const OUT = process.argv[2] || join(homedir(), 'Downloads/ADVO/BLUELINK/Instagram');
const LEGAL = 'Made by Ateneans. Not an official Ateneo de Manila University service. 18+ only.';
const [W, H] = INSTA_PX;
const num = (i) => String(i + 1).padStart(2, '0');

const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  for (const L of LOOKS) {
    const dir = join(OUT, `${L.id}-${L.label.toLowerCase().replace(/\s+/g, '-')}`);
    await mkdir(dir, { recursive: true });
    for (const [i, h] of HOOKS.entries()) {
      await tab.setContent(`<!doctype html><html><head><meta charset="utf-8">${fontLinks()}<style>${BASE_CSS}${INSTA_CSS}</style></head><body>${peso(instaPost(L.id, h))}</body></html>`, { waitUntil: 'networkidle' });
      await tab.evaluate(() => window.__fit);
      await tab.locator('.post').screenshot({ path: join(dir, `${num(i)}-${h.id}.png`) });
    }
  }
} finally {
  await browser.close();
}
const txt = HOOKS.map((h, i) => `${num(i)}  ${hookText(h)}${h.sub ? ` / ${h.sub}` : ''}\n    ${h.cap} Link in bio.\n    ${LEGAL}`).join('\n\n');
await writeFile(join(OUT, 'captions.txt'), `BlueLink Instagram posts. Same number in every look folder. Caption under each.\n\n${txt}\n`);
console.log(`${HOOKS.length} posts × ${LOOKS.length} looks: ${OUT}`);
