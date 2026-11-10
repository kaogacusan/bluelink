// Exact-size print PDFs, with the design running right to the edge.
// Chrome gets the size slightly wrong in two ways, and each leaves a thin white strip on the right and bottom:
//   1. it rounds the PDF page to whole points (105 × 74 mm came out 105.16 × 74.08 mm), and
//   2. it draws each page's box at whole CSS pixels (90 mm is 340.16 px, drawn as 340 px = 89.96 mm).
// So: print on a page PAD mm bigger than the design (the design sits in its top-left corner), then trim every
// page to exactly w × h mm and stretch the drawn box to fill it (by well under 0.2%, too little to see).
// The content stays vector.
import { readFile, writeFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

export const PAD = 2; // mm of spare page on the right and bottom, cut off by trimPdf()
const PT_PER_MM = 72 / 25.4;
const PX_PER_MM = 96 / 25.4;
const PT_PER_PX = 72 / 96;

// the @page rule for a design w × h mm
export const pageCss = ([w, h]) => `@page{size:${w + PAD}mm ${h + PAD}mm;margin:0}`;

// Chrome page options for the same page
export const pdfOptions = (path, [w, h]) => ({ path, width: `${w + PAD}mm`, height: `${h + PAD}mm`, printBackground: true, preferCSSPageSize: true });

// Trims every page of the PDF at `file` to exactly w × h mm. Each page's design is the box Chrome drew in its
// top-left corner, at whole CSS px; it is moved and stretched to fill the trimmed page.
export async function trimPdf(file, [w, h]) {
  const doc = await PDFDocument.load(await readFile(file));
  const W = w * PT_PER_MM, H = h * PT_PER_MM;
  const drawnW = Math.round(w * PX_PER_MM) * PT_PER_PX, drawnH = Math.round(h * PX_PER_MM) * PT_PER_PX;
  for (const page of doc.getPages()) {
    const { height } = page.getSize();
    // PDF y runs up from the bottom: first bring the drawn box down to y = 0, then stretch it to W × H
    page.translateContent(0, drawnH - height);
    page.scaleContent(W / drawnW, H / drawnH);
    page.setSize(W, H);
    page.setTrimBox(0, 0, W, H);
  }
  await writeFile(file, await doc.save());
}
