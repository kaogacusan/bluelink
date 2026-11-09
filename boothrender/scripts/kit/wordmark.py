# Outlines the "BlueLink" wordmark from the app's Inter (assets/kit/fonts), so the logo files need no font.
# Inter 700, optical size 32, tracking -0.03em, the tailed l (cv05), with the font's own kerning.
# Writes scripts/kit/wordmark.json: { d: path data, w, h, asc, desc } in font units scaled to a 1000-unit em.
#   python3 scripts/kit/wordmark.py
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent.parent.parent
font = instantiateVariableFont(TTFont(ROOT / 'assets/kit/fonts/InterVariable-latin.woff2'), {'wght': 700, 'opsz': 32})
upm = font['head'].unitsPerEm
cmap = font.getBestCmap()
gsub = font['GSUB'].table


def alt(feature, name):
    for fr in gsub.FeatureList.FeatureRecord:
        if fr.FeatureTag != feature:
            continue
        for li in fr.Feature.LookupListIndex:
            for st in gsub.LookupList.Lookup[li].SubTable:
                m = getattr(st, 'mapping', None)
                if m and name in m:
                    return m[name]
    return name


def kern(a, b):
    gpos = font['GPOS'].table
    total = 0
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag != 'kern':
            continue
        for li in fr.Feature.LookupListIndex:
            lk = gpos.LookupList.Lookup[li]
            for st in lk.SubTable:
                if lk.LookupType == 9:
                    st = st.ExtSubTable
                if getattr(st, 'LookupType', 2) != 2 and lk.LookupType not in (2, 9):
                    continue
                cov = st.Coverage.glyphs
                if a not in cov:
                    continue
                if st.Format == 1:
                    ps = st.PairSet[cov.index(a)]
                    for pv in ps.PairValueRecord:
                        if pv.SecondGlyph == b and pv.Value1 is not None:
                            return getattr(pv.Value1, 'XAdvance', 0) or 0
                elif st.Format == 2:
                    c1 = st.ClassDef1.classDefs.get(a, 0)
                    c2 = st.ClassDef2.classDefs.get(b, 0)
                    v = st.Class1Record[c1].Class2Record[c2].Value1
                    x = getattr(v, 'XAdvance', 0) or 0 if v is not None else 0
                    if x:
                        return x
    return total


text = 'BlueLink'
names = [alt('cv05', alt('cv11', cmap[ord(c)])) for c in text]
gs = font.getGlyphSet()
hmtx = font['hmtx']
scale = 1000 / upm
track = -0.03 * upm
pen_x = 0
parts = []
bp = BoundsPen(gs)
for i, n in enumerate(names):
    sp = SVGPathPen(gs)
    # flip y: font units go up, SVG goes down
    gs[n].draw(TransformPen(sp, (scale, 0, 0, -scale, pen_x * scale, 0)))
    gs[n].draw(TransformPen(bp, (scale, 0, 0, -scale, pen_x * scale, 0)))
    parts.append(sp.getCommands())
    adv = hmtx[n][0] + (kern(n, names[i + 1]) if i + 1 < len(names) else 0)
    pen_x += adv + (track if i + 1 < len(names) else 0)
os2 = font['OS/2']
out = {
    'd': ' '.join(parts),
    'w': round(pen_x * scale, 2),
    'cap': round(os2.sCapHeight * scale, 2),
    'asc': round(os2.sTypoAscender * scale, 2),
    'desc': round(-os2.sTypoDescender * scale, 2),
    'xh': round(os2.sxHeight * scale, 2),
    'bounds': [round(v, 2) for v in bp.bounds],   # xMin, yMin, xMax, yMax in SVG space (y down)
}
Path(__file__).with_name('wordmark.json').write_text(json.dumps(out))
print('wordmark', names, out['w'], out['cap'])
