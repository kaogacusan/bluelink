// Draws the link preview picture (public/og.jpg, 1200x630) that Messenger, Facebook, and Google show for bluelinkph.com.
// Run: node scripts/og.mjs
import { chromium } from 'playwright'
import { C, BASE_CSS, markSvg, skySvg, horizonSvg, constellationSvg, plateSvg } from '../boothrender/scripts/print/kit.mjs'

const W = 1200
const H = 630
const RIM = 548

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
body{background:${C.void};color:${C.star}}
.pg{width:${W}px;height:${H}px;background:${C.void}}
</style></head><body><div class="pg">
  ${skySvg({ w: W, h: H, seed: 'bluelink-og', density: 0.035, band: 0.3, avoid: [[60, 60, 640, 420]] })}
  ${constellationSvg({ w: W, h: H, box: [790, 96, 330, 300], seed: 'og-link', count: 6 })}
  ${horizonSvg({ w: W, h: H, top: RIM, curve: 2.2 })}
  ${plateSvg({ w: W, h: H, inset: 28, opacity: 0.35 })}
  <div class="abs lockup" style="left:72px;top:68px;gap:14px">
    ${markSvg({ front: '#fff', back: C.peri, size: '46px' })}
    <span class="wm" style="font-size:32px;color:#fff">BlueLink</span>
  </div>
  <div class="abs" style="left:72px;top:178px;width:760px">
    <div class="d" style="font-size:82px;color:#fff">Welcome to<br><span style="color:${C.peri}">Atenean Networking</span></div>
    <div class="t" style="margin-top:26px;font-size:27px;color:${C.sub}">Find opportunities, network with each other.<br>Exclusive for the Ateneo community.</div>
  </div>
  <div class="abs" style="left:72px;right:72px;top:${RIM + 30}px;display:flex;justify-content:space-between;align-items:baseline">
    <span style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#fff">bluelinkph.com</span>
    <span style="font-size:16px;font-weight:500;color:${C.muted}">Made by Ateneans. Not an official Ateneo service.</span>
  </div>
</div></body></html>`

const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: W, height: H } })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: new URL('../public/og.jpg', import.meta.url).pathname, type: 'jpeg', quality: 90 })
await b.close()
console.log('Saved public/og.jpg')
