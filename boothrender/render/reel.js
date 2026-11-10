// The info reel card in the Instagram section: show the file size on the MP4 button, and copy the caption.
// The reel itself is made by scripts/social/reel/render.mjs into assets/social/reel/.
const size = document.getElementById('reelSize');
const mp4 = size?.closest('a')?.getAttribute('href');
if (size && mp4) {
  fetch(mp4, { method: 'HEAD' })
    .then((r) => { const n = +r.headers.get('content-length'); if (n) size.textContent = `${(n / 1048576).toFixed(1)} MB`; })
    .catch(() => {});
}

document.querySelectorAll('[data-copy]').forEach((b) => {
  const label = b.textContent;
  b.addEventListener('click', async () => {
    const text = document.querySelector(b.dataset.copy)?.innerText.trim() ?? '';
    try {
      await navigator.clipboard.writeText(text);
      b.textContent = 'Copied ✓';
    } catch {
      b.textContent = 'Select the text to copy';
    }
    setTimeout(() => (b.textContent = label), 1800);
  });
});
