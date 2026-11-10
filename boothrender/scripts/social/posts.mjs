// Instagram posts as PNGs, plus captions.txt. One design (Deep Field) for every post.
//   teasers/: 1080 × 1350 (4:5), one per hook (01-want-connections.png, ...).
//   info-carousel/: the 5 info slides, in posting order.
//   booth-carousel/: the 3 booth slides, in posting order.
//   booth-story.png: 1080 × 1920 (9:16).
// The designs are in scripts/print/booth.mjs and the words in scripts/print/kit.mjs (HOOKS, INFO, BOOTH),
// so the posts here match the Instagram section of the booth page.
//
//   npm run posts                       ~/Downloads/ADVO/BLUELINK/Instagram
//   npm run posts -- <folder>           somewhere else
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { BASE_CSS, fontLinks, HOOKS, EVENT, F, hookText, peso } from '../print/kit.mjs';
import { instaPost, infoSlide, boothSlide, boothStory, INSTA_CSS, INSTA_PX, STORY_PX } from '../print/booth.mjs';

const OUT = process.argv[2] || join(homedir(), 'Downloads/ADVO/BLUELINK/Instagram');
const LEGAL = 'Made by Ateneans. Not an official Ateneo de Manila University service.';
const [W, H] = INSTA_PX;
const num = (i) => String(i + 1).padStart(2, '0');
const INFO_FILES = ['welcome', 'what-you-can-do', 'members-only', 'membership', 'how-to-join'];
const BOOTH_FILES = ['visit-us', 'where-we-are', 'signing-up'];

const browser = await chromium.launch();
let count = 0;
try {
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  const shot = async (html, path) => {
    await tab.setContent(`<!doctype html><html><head><meta charset="utf-8">${fontLinks()}<style>${BASE_CSS}${INSTA_CSS}</style></head><body>${peso(html)}</body></html>`, { waitUntil: 'networkidle' });
    await tab.evaluate(() => window.__fit);
    await tab.locator('.post').screenshot({ path });
    count++;
  };
  for (const d of ['teasers', 'info-carousel', 'booth-carousel']) await mkdir(join(OUT, d), { recursive: true });
  for (const [i, h] of HOOKS.entries()) await shot(instaPost('v1', h), join(OUT, 'teasers', `${num(i)}-${h.id}.png`));
  for (const [i, name] of INFO_FILES.entries()) await shot(infoSlide(i), join(OUT, 'info-carousel', `${num(i)}-${name}.png`));
  for (const [i, name] of BOOTH_FILES.entries()) await shot(boothSlide(i), join(OUT, 'booth-carousel', `${num(i)}-${name}.png`));
  await tab.setViewportSize({ width: STORY_PX[0], height: STORY_PX[1] });
  await shot(boothStory(), join(OUT, 'booth-story.png'));
} finally {
  await browser.close();
}

const teasers = HOOKS.map((h, i) => `${num(i)}  ${hookText(h)}${h.sub ? ` / ${h.sub}` : ''}\n    ${h.cap} Link in bio.\n    ${LEGAL}`).join('\n\n');
const info = `INFO CAROUSEL (info-carousel/, 5 slides in order). Pin it to the top of the profile.
    BlueLink is a private network for the Ateneo community. Students, alumni, and faculty can find internships, connect with mentors, and offer their skills. Membership is ${F.price} a year or ${F.life} for lifetime access, with a full refund within 7 days. Sign up through the link in our bio, or visit us at the ${EVENT.name}, ${EVENT.road}, Tent ${EVENT.tent}.
    ${LEGAL}`;
const booth = `BOOTH CAROUSEL (booth-carousel/, 3 slides in order). Post during the bazaar week.
    We have a booth at the ${EVENT.name}! Find us at the very end of ${EVENT.road}, Tent ${EVENT.tent}, across from the Bazaar Committee booth. We're there Nov 9 to 13, 8 AM to 5 PM. Drop by to sign up or just to ask us about BlueLink.
    ${LEGAL}

BOOTH STORY (booth-story.png). Post each day of the bazaar. Add a link sticker in the empty space right of the road. Stories have no caption.`;
await writeFile(join(OUT, 'captions.txt'), `BlueLink Instagram posts. Caption under each.\n\nTEASERS (teasers/)\n\n${teasers}\n\n${info}\n\n${booth}\n`);
console.log(`${count} images: ${OUT}`);
