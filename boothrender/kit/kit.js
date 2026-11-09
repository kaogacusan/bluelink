// Brand kit page (/kit/). Fills the grids from /assets/kit/index.json (written by `npm run kit`).

const COLORS = [
  { name: 'Void', hex: '#03050d', use: 'The sky. Main dark ground.' },
  { name: 'Deep', hex: '#070c1f', use: 'Panels on dark. The night side.' },
  { name: 'Ink', hex: '#0a1540', use: 'Text on light. Brand navy.' },
  { name: 'Signal', hex: '#1d45e5', use: 'The BlueLink blue. One key word.' },
  { name: 'Glow', hex: '#3a5fff', use: 'Blue on dark. The atmosphere rim.' },
  { name: 'Peri', hex: '#93a8ff', use: 'Lines and labels on dark.' },
  { name: 'Starlight', hex: '#eef1fa', use: 'Text on dark.' },
  { name: 'Paper', hex: '#f5f6fa', use: 'Light ground for long reading.' },
  { name: 'Flare', hex: '#ffc48a', use: 'A warm star. One small thing, never a ground.' },
];

// which logo files sit on a dark tile
const DARK = /-dark|-white|app-icon/;
const NAMES = {
  'lockup-light': 'Logo on light', 'lockup-dark': 'Logo on dark', 'lockup-ink': 'One color, navy', 'lockup-white': 'One color, white',
  mark: 'Mark on light', 'mark-dark': 'Mark on dark', 'mark-ink': 'Mark, navy', 'mark-white': 'Mark, white',
  'wordmark-ink': 'Word, navy', 'wordmark-white': 'Word, white', 'app-icon': 'App icon',
  'star-field': 'Star field', constellation: 'Constellation', horizon: 'Horizon', 'plate-marks': 'Plate marks', 'deep-field-background': 'Deep Field background',
  'ig-post': 'Instagram post', 'ig-story': 'Instagram story', 'link-preview': 'Link preview',
  colors: 'Color sheet', type: 'Type sheet',
};

function h(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  n.append(...kids.flat().filter((k) => k != null && k !== false));
  return n;
}
const statusEl = document.getElementById('status');
const say = (t) => { statusEl.textContent = ''; requestAnimationFrame(() => { statusEl.textContent = t; }); };
const png = (f) => f.replace(/\.svg$/, '.png');

// One tile: the picture on the right ground, the name, what it is for, and the downloads.
function tile(f, { dark = true } = {}) {
  const isSvg = f.file.endsWith('.svg');
  const view = h('div', { class: `tile__view${dark ? ' tile__view--dark' : ''}` }, h('img', { src: f.file, alt: NAMES[f.name] || f.name, loading: 'lazy', decoding: 'async' }));
  const dl = h('div', { class: 'tile__dl' });
  if (isSvg) dl.append(h('a', { class: 'btn btn--sm', href: f.file, download: `bluelink-${f.name}.svg` }, 'SVG'));
  dl.append(h('a', { class: 'btn btn--sm', href: png(f.file), download: `bluelink-${f.name}.png` }, 'PNG'));
  if (f.name === 'app-icon') [512, 192, 180, 32].forEach((s) => dl.append(h('a', { class: 'btn btn--sm', href: `/assets/kit/brand/icon-${s}.png`, download: `bluelink-icon-${s}.png` }, `${s}`)));
  return h('article', { class: 'tile' }, view, h('div', { class: 'tile__body' }, h('h3', {}, NAMES[f.name] || f.name), h('p', {}, f.about), dl));
}

function renderSwatches() {
  const host = document.getElementById('swatches');
  COLORS.forEach((c) => {
    const b = h('button', { type: 'button', class: 'swatch', style: `--c:${c.hex}`, 'aria-label': `Copy ${c.name}, ${c.hex}` },
      h('span', { class: 'swatch__chip' }),
      h('span', { class: 'swatch__meta' }, h('b', {}, c.name), h('span', { class: 'swatch__hex' }, c.hex.toUpperCase()), h('span', { class: 'swatch__use' }, c.use)),
      h('span', { class: 'swatch__tip', 'aria-hidden': 'true' }, 'Copy'));
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(c.hex); } catch { /* no clipboard: the hex is on the card */ }
      b.classList.add('is-copied');
      b.querySelector('.swatch__tip').textContent = 'Copied';
      say(`Copied ${c.hex}`);
      setTimeout(() => { b.classList.remove('is-copied'); b.querySelector('.swatch__tip').textContent = 'Copy'; }, 1400);
    });
    host.append(b);
  });
}

async function main() {
  renderSwatches();
  let idx = { files: [] };
  try { idx = await (await fetch('/assets/kit/index.json', { cache: 'no-cache' })).json(); } catch { /* run npm run kit */ }
  if (idx.zip) document.getElementById('zipSize').textContent = `${(idx.zip.kb / 1024).toFixed(1)} MB`;
  const by = (g) => idx.files.filter((f) => f.group === g);
  document.getElementById('logoTiles').append(...by('logo').map((f) => tile(f, { dark: DARK.test(f.name) })));
  document.getElementById('motifTiles').append(...by('motif').map((f) => tile(f)));
  document.getElementById('shareTiles').append(...by('share').map((f) => tile(f)));
  document.getElementById('sheetTiles').append(...by('sheet').map((f) => tile(f)));

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.rise').forEach((el) => io.observe(el));
}
main();
