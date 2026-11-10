# BlueLink — booth render and brand kit

A small site for the BlueLink team: the bazaar booth in 3D, the print files, and every brand file.
It is a copy of the profstopick booth site (`~/profstopick-booth`), which is a copy of the Blueprint render pages,
changed to BlueLink and its "Deep Field" look (`~/BlueLink/BRAND.md`).

No build step for the site. Plain HTML, CSS, and JS.

```bash
cd ~/bluelink-booth
npm run dev                     # then open http://localhost:5191/
```

## Pages

| Page | What it is |
|---|---|
| `/` | The booth: our half (1.5 × 3 m, assumed) of a shared 3 × 3 m tent. 3D model, numbered parts list, print files, Instagram posts, the sale in 5 steps, fixes, open and close, materials, what we know and what is still to check. |
| `/kit/` | The brand kit: logo, colors, type, motifs, share cards, words and rules. Every file downloads. One zip with everything. |

## Files

| File | What to change there |
|---|---|
| `booth.js` | The booth: sizes at the top (`HALF`, `DEPTH`, `EAVE`, the table `T`, the standee `SD`, the header `HD`, the QR sign `QR`), the parts list with costs, the 5 sale steps, the fixes, and the 3D model. |
| `index.html` | The booth page text: the facts at the top, "What we know", "Still to check". |
| `kit/` | The brand kit page. It reads `assets/kit/index.json`. |
| `render/` | The 3D engine and page wiring. Colors are the Deep Field tokens (top of `render/render.css`, `COL` in `render/stage.js`). |
| `scripts/print/kit.mjs` | The facts on every print (`F`), the bazaar and the road for the booth posts (`EVENT`, `ROUTE`), the Instagram words (`INFO`, `BOOTH`), the passes (`PASSES`), the links behind the QR (`URLS`), the three looks (`LOOKS`, `LOOK`), the legal lines, and the logo, sky, horizon, constellation, plate-mark, and QR helpers. |
| `scripts/print/booth.mjs` | One entry per printed piece (three looks each) and Instagram post (one design). Each flyer front's composition is in `HOOK_FRONT`. The staff FAQ words are here too (`FAQ`, `NEVER`, `CONCERN`, `SALE`). |
| `scripts/social/posts.mjs` | Saves every Instagram post as a PNG, with captions.txt. |
| `scripts/kit/` | `wordmark.py` outlines "BlueLink" from the app's Inter. `build.mjs` makes every brand file, the zip, and the laptop screen in the 3D model. |

## Print files

| Piece | Size |
|---|---|
| Standee | 2 × 5 ft (610 × 1524 mm), portrait, tarpaulin on an X-stand at the back of the walkway. One picture: the planet’s edge with a blue glow, with nothing in front of it. The QR (plain navy on white) sits on the planet’s night side beside “Scan to join.”. The sky has the logo, the headline, and a hand-placed constellation of what people are open to (`LABELS`). The night side has “Scan to join”, the link, both plans in one sentence, and the legal line. The QR is at waist height |
| Header (optional) | 3.5 × 1.25 ft (1067 × 381 mm), landscape, hung from the front bar. The booth’s name sign: the logo big, a hairline, and the line the standee does not use (“Find your people.” in V1 and V2, “Welcome to Atenean Networking” in V3). The planet’s edge along the bottom. No QR. With a 2.0 m eave its bottom edge is at 1.62 m. Toggle it with the Header switch on the model |
| QR sign | A4, QR 12–14 cm on the centre line, both plans at the bottom, in an A4 acrylic stand |
| Flyer | A6, two sides, 4 per A4 sheet. One design: the headline over the planet’s edge, dark back |
| Hook flyers | A6, two sides. One short question on the front (HOOKS with `flyer: true` in `kit.mjs`), the flyer back. One design each, no looks. Each front has its own composition (`HOOK_FRONT` in `booth.mjs`): a constellation, two stars, plain big type, the app’s profile card, a star-chart week, a sunrise. Backs alternate white and dark through the set |
| Voucher card | Business card size (90 × 54 mm), two sides, 10 per A4 sheet (2 × 5). Fronts: Lifetime (“Lifetime access to BlueLink”) and Founding member (“1 year of BlueLink”). No badges or tags on the front: it only says what the card is worth (the founding card has one warm star); the back names the pass |
| Staff FAQ | A4, two pages, for the team only |

The standee, header, QR sign, and voucher cards have three looks (flyers and Instagram posts have one design each):

- **V1 Deep Field**: the night sky. Near-black, real stars, one constellation, catalog labels, plate marks. The planet’s edge is on the standee only.
- **V2 Paper**: the same layout on light paper. Navy type, one blue word. Cheapest to print.
- **V3 Big type**: fewest words, biggest type. "Find your people."
- **QR sign**: flat in every look (one ground color, no sky, no planet), with a different layout per look: V1 centred, V2 a ruled price list, V3 big type.

Each version has a print **PDF** (vector) and a **JPG**, in `assets/print/booth/`. Pick a look on the page and the 3D model changes.

```bash
npm install                     # once
npm run print                   # every piece
npm run print -- booth standee  # one piece (or: header)
npm run kit                     # every brand file and the zip
```

## Instagram

Its own section on the booth page, under the print files. Not for print. One design for every post: Deep Field.
The words are in `kit.mjs` (`HOOKS`, `INFO`, `BOOTH`), polite and professional, short, and nothing the app does not do. Flyers and teasers carry only the question (no taglines).

| Post | Size | What it is |
|---|---|---|
| Teaser posts | 1080 × 1350 px, 12 posts | One question each (HOOKS). Promo, before and during the bazaar |
| Info carousel | 1080 × 1350 px, 5 slides | Welcome, what you can do, members only, membership, how to join. One idea per slide, each with its own layout. Polite, professional copy. One constellation runs through all 5 slides |
| Booth carousel | 1080 × 1350 px, 3 slides | Where and when, a map of the bazaar from above, and how signing up at the booth works |
| Booth story | 1080 × 1920 px | The map, the dates, and the time |

The map (`bazaarMap` in `booth.mjs`) shows the bazaar from above, simplified from the organizers' floor plan: Red Brick Road, a row of tents on each side, JSEC, PIPAC, Faura Hall, and MVP, and a dashed path from JSEC to our glowing tent.
We are **Tent 34B, Section D** (the slot that was Profs To Pick), across from the Bazaar Committee booth, Nov 9–13.
**The time (8 AM to 5 PM) comes from the booth plan. Confirm it with the organizers.**

```bash
npm run posts                   # PNGs + captions.txt to ~/Downloads/ADVO/BLUELINK/Instagram (teasers/, info-carousel/, booth-carousel/, booth-story.png)
npm run posts -- ~/somewhere    # somewhere else
```

There is one QR on every print: `URLS.home`, which is **https://bluelinkph.com**. Make sure the site is live before printing.
To change the domain: change `F.site`, `F.privacy`, `F.terms`, and `URLS` in `kit.mjs`, run `npm run print` and `npm run kit`, then test the QR on 2 phones.

## Legal lines

Every print follows the rules in `BRAND.md` (PH Data Privacy Act, Consumer Act, Internet Transactions Act, Safe Spaces Act, school rules):

- No promise of replies, jobs, or results. No member counts, made-up members, or testimonials. No "free", raffles, or prizes.
- No Ateneo logo, seal, or Blue Eagle. Every standee, header, flyer, and QR sign says "Not an official Ateneo de Manila University service."
- No "18+" on any visitor piece (it reads as NSFW). The age rule is in the app's terms, and staff check it at the table.
- No privacy line on the flyers (the team took it off). The privacy notice is in the app (`#/privacy`).
- The voucher back is kept simple, like profstopick: the code, one line on how to use it, and where to redeem it. The terms are in the app (`#/terms`).
- Legal lines are at least 8 pt on print.

## Voucher cards with real codes

The voucher back on this site has a blank code box, to write the code in with a pen. Real codes never go in `assets/` (the site is public).

1. In the app: Admin → Voucher cards → Make codes → Save codes. That saves a .txt, one code per line.
2. Print them:

```bash
npm run cards -- ~/Downloads/codes.txt               # Lifetime, look v1
npm run cards -- ~/Downloads/codes.txt v2            # another look
npm run cards -- ~/Downloads/codes.txt v1 founding   # founding member codes (1 year)
```

This makes `voucher-cards-<look>.pdf` next to the codes file: front, back, front, back, one pair per code.
A line can name its own pass: `ACD-FGH, founding`.

## Where the words come from

- Price, who can join, codes: the BlueLink app (`~/BlueLink/shared/membership.js`, `shared/school.js`, `shared/legal.js`, Admin and Join screens).
- Headline, look, voice, legal lines: `~/BlueLink/BRAND.md`.
- Booth size and tent rules: the same as the profstopick booth. Not confirmed for BlueLink.
