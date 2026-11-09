// Renders video.html (+ audio.js) in headless Chrome, frame by frame, into the blueLink reel.
//   node scripts/social/reel/render.mjs                  -> out/ frames + audio -> bluelink-reel.mp4, then copies it to assets/social/reel/
//   node scripts/social/reel/render.mjs audio            -> audio only, re-muxed onto the last out/video-silent.mp4
//   node scripts/social/reel/render.mjs stills 1.2 5.5   -> out/stills/t_<seconds>.png
//   node scripts/social/reel/render.mjs beats 0 16 24    -> out/stills/b_<beat>.png
// Needs: npm install (playwright-core), Chromium from `npx playwright-core install chromium`, and ffmpeg.
// CRF 21 keeps the stars crisp at about 17 MB. (CRF 15 looked the same and was 55 MB: a star field is all fine detail.)
import { chromium } from 'playwright-core';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out');
const SITE = path.join(here, '../../../assets/social/reel');   // what the booth site shows
mkdirSync(OUT, { recursive: true });
const [mode, ...rest] = process.argv.slice(2);

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + path.join(here, 'video.html'));
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);
const beat = await page.evaluate(() => window.BEAT);
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });

if (mode === 'stills' || mode === 'beats') {
  const dir = path.join(OUT, 'stills');
  mkdirSync(dir, { recursive: true });
  for (const v of rest.map(Number)) {
    const t = mode === 'beats' ? v * beat : v;
    await page.evaluate((t) => window.seek(t), t);
    await page.screenshot({ path: path.join(dir, `${mode === 'beats' ? 'b' : 't'}_${v.toFixed(2).padStart(5, '0')}.png`) });
  }
  console.log('stills:', rest.length, 'errors:', JSON.stringify(errors));
  await browser.close();
  process.exit(0);
}

if (mode !== 'audio') {
  const fps = +(process.env.FPS || 30);
  const frames = Math.round(duration * fps);
  const enc = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, 'video-silent.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  enc.stdin.end();
  await new Promise((r) => enc.on('close', r));
}

// ---- audio: two stems, rendered offline in the page
const cues = await page.evaluate(() => window.cueList());
for (const m of ['music', 'sfx']) {
  const b64 = await page.evaluate((a) => window.renderAudio(a), { mode: m, duration, cues });
  writeFileSync(path.join(OUT, `${m}.f32`), Buffer.from(b64, 'base64'));
}
await browser.close();
console.log('cues:', cues.length, 'errors:', JSON.stringify(errors));

const raw = (f) => ['-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', path.join(OUT, f)];
// static gain to a target loudness, then a true-peak-safe limiter (no pumping)
function norm(inArgs, chain, outWav, target) {
  const r = spawnSync('ffmpeg', ['-hide_banner', ...inArgs, '-filter_complex', `${chain},ebur128=peak=true`, '-f', 'null', '-'], { encoding: 'utf8' });
  const I = +r.stderr.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0];
  const gain = target - I;
  ff([...inArgs, '-filter_complex', `${chain},volume=${gain.toFixed(2)}dB,aresample=192000,alimiter=limit=0.8:attack=2:release=60:level=false,aresample=48000`, '-c:a', 'pcm_s24le', outWav]);
  return { input_i: I, gain: gain.toFixed(1) };
}
const MUSIC = +(process.env.MUSIC || 0.55), SFX = +(process.env.SFX || 1);
const mix = norm([...raw('music.f32'), ...raw('sfx.f32')], `[0]volume=${MUSIC}[m];[1]volume=${SFX}[s];[m][s]amix=inputs=2:normalize=0`, path.join(OUT, 'mix.wav'), -14);
console.log('mix:', mix);
ff(['-i', path.join(OUT, 'video-silent.mp4'), '-i', path.join(OUT, 'mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
  '-shortest', '-movflags', '+faststart', path.join(OUT, 'bluelink-reel.mp4')]);

// the booth site gets the reel and a poster frame
mkdirSync(SITE, { recursive: true });
copyFileSync(path.join(OUT, 'bluelink-reel.mp4'), path.join(SITE, 'bluelink-reel.mp4'));
const POSTER = +(process.env.POSTER || 22.5) * beat;   // the headline, by default
ff(['-ss', POSTER.toFixed(3), '-i', path.join(OUT, 'video-silent.mp4'), '-frames:v', '1', '-q:v', '3', path.join(SITE, 'poster.jpg')]);
console.log('wrote out/bluelink-reel.mp4, assets/social/reel/bluelink-reel.mp4 and poster.jpg');
