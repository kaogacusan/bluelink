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
| `/` | The booth: our half (1.5 × 3 m, assumed) of a shared 3 × 3 m tent. 3D model, numbered parts list, print files, the sale in 5 steps, fixes, open and close, materials, what we know and what is still to check. |
| `/kit/` | The brand kit: logo, colors, type, motifs, share cards, words and rules. Every file downloads. One zip with everything. |

## Files

| File | What to change there |
|---|---|
| `booth.js` | The booth: sizes at the top (`HALF`, `DEPTH`, `EAVE`, the table `T`, the tarp `TP`, the QR sign `QR`), the parts list with costs, the 5 sale steps, the fixes, and the 3D model. |
| `index.html` | The booth page text: the facts at the top, "What we know", "Still to check". |
| `kit/` | The brand kit page. It reads `assets/kit/index.json`. |
| `render/` | The 3D engine and page wiring. Colors are the Deep Field tokens (top of `render/render.css`, `COL` in `render/stage.js`). |
| `scripts/print/kit.mjs` | The facts on every print (`F`), the passes (`PASSES`), the links behind the QR (`URLS`), the three looks (`LOOKS`, `LOOK`), the legal lines, and the logo, sky, horizon, constellation, plate-mark, and QR helpers. |
| `scripts/print/booth.mjs` | One entry per printed piece, three looks each. The staff FAQ words are here too (`FAQ`, `NEVER`, `CONCERN`, `SALE`). |
| `scripts/kit/` | `wordmark.py` outlines "BlueLink" from the app's Inter. `build.mjs` makes every brand file, the zip, and the laptop screen in the 3D model. |

## Print files

| Piece | Size |
|---|---|
| Tarpaulin | 4 × 3 ft (1219 × 914 mm), landscape, on the back bar |
| QR sign | A4, QR 10 cm, in an A4 acrylic stand |
| Flyer | A6, two sides, 4 per A4 sheet |
| Hook flyers | A6, two sides. One short question on the front (HOOKS with `flyer: true` in `kit.mjs`), the flyer back |
| Voucher card | A7 landscape (105 × 74 mm), two sides, 8 per A4 sheet. Fronts: Semester pass and Founding member |
| Instagram posts | 1080 × 1350 px, one post per hook (HOOKS in `kit.mjs`). Not for print. `npm run posts` saves PNGs and captions.txt to `~/Downloads/ADVO/BLUELINK/Instagram` |
| Staff FAQ | A4, two pages, for the team only |

Each visitor piece has three looks:

- **V1 Deep Field**: the night sky. Near-black, real stars, one constellation, catalog labels, plate marks. The planet’s edge is on the tarpaulin only.
- **QR sign**: flat in every look. One ground color, no sky, no planet.
- **V2 Paper**: the same layout on light paper. Navy type, one blue word. Cheapest to print.
- **V3 Big type**: fewest words, biggest type. "Find your people."

Each version has a print **PDF** (vector) and a **JPG**, in `assets/print/booth/`. Pick a look on the page and the 3D model changes.

```bash
npm install                     # once
npm run print                   # every piece
npm run print -- booth tarp     # one piece
npm run kit                     # every brand file and the zip
```

There is one QR on every print: `URLS.home`. **It is a placeholder (`bluelink.example`) until BlueLink has a domain.**
Change `F.site`, `F.privacy`, `F.terms`, and `URLS` in `kit.mjs`, run `npm run print` and `npm run kit`, then test the QR on 2 phones.

## Legal lines

Every print follows the rules in `BRAND.md` (PH Data Privacy Act, Consumer Act, Internet Transactions Act, Safe Spaces Act, school rules):

- No promise of replies, jobs, or results. No member counts, made-up members, or testimonials. No "free", raffles, or prizes.
- No Ateneo logo, seal, or Blue Eagle. Every tarpaulin, flyer, and QR sign says "Not an official Ateneo de Manila University service."
- "18+ only" on the flyer back and the QR sign. The privacy line on the flyer back.
- The voucher back is kept simple, like profstopick: the code, one line on how to use it, and where to redeem it. The terms are in the app (`#/terms`).
- Legal lines are at least 8 pt on print.

## Voucher cards with real codes

The voucher back on this site has a blank code box, to write the code in with a pen. Real codes never go in `assets/` (the site is public).

1. In the app: Admin → Voucher cards → Make codes → Save codes. That saves a .txt, one code per line.
2. Print them:

```bash
npm run cards -- ~/Downloads/codes.txt               # Semester pass, look v1
npm run cards -- ~/Downloads/codes.txt v2            # another look
npm run cards -- ~/Downloads/codes.txt v1 founding   # founding member codes (1 year)
```

This makes `voucher-cards-<look>.pdf` next to the codes file: front, back, front, back, one pair per code.
A line can name its own pass: `BL-ACDE-FGHJ, founding`.

## Where the words come from

- Price, who can join, codes: the BlueLink app (`~/BlueLink/shared/membership.js`, `shared/school.js`, `shared/legal.js`, Admin and Join screens).
- Headline, look, voice, legal lines: `~/BlueLink/BRAND.md`.
- Booth size and tent rules: the same as the profstopick booth. Not confirmed for BlueLink.
