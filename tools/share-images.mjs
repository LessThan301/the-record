// Renders a 1200x630 PNG per card and language: "I believed X. The record says: ..."
import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { esc } from '../src/render.js';

const CJK_DIRS = ['/usr/share/fonts/opentype/noto', '/usr/share/fonts/noto-cjk'];
const cjkFonts = CJK_DIRS.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => /NotoSansCJK-(Regular|Bold)\.ttc$/.test(f)).map((f) => path.join(d, f)) : []));
const FONT_FILES = ['tools/fonts/InterTight-500.ttf', 'tools/fonts/InterTight-700.ttf', ...cjkFonts];
const COLORS = { false: '#e31937', misleading: '#1d2433', overstated: '#3d3d3d' };
const CJK_FAMILY = { zh: 'Noto Sans CJK SC', ja: 'Noto Sans CJK JP', ko: 'Noto Sans CJK KR' };

const isWide = (ch) => /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(ch);
const charW = (ch) => (isWide(ch) ? 1 : /[A-Z0-9]/.test(ch) ? 0.64 : ch === ' ' ? 0.26 : /[.,:;'’!|il]/.test(ch) ? 0.28 : 0.53);
const width = (s) => [...s].reduce((a, c) => a + charW(c), 0);

function wrap(text, size, maxW, maxLines) {
  const tokens = text.match(/[\u1100-\u11ff\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]|[^\s\u2e80-\u9fff\uff00-\uffef]+\s*|\s+/g) || [];
  const lines = []; let cur = '';
  for (const t of tokens) {
    if (width(cur + t) * size > maxW && cur.trim()) { lines.push(cur.trimEnd()); cur = t.trimStart(); } else cur += t;
  }
  if (cur.trim()) lines.push(cur.trimEnd());
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S{0,3}$/, '') + '…'; }
  return lines;
}

export function shareSVG(card, u, lang) {
  const fam = `${CJK_FAMILY[lang] ? CJK_FAMILY[lang] + ', ' : ''}Inter Tight, Noto Sans CJK SC`;
  let size = 60, lines;
  for (size of [60, 54, 48, 42, 38]) { lines = wrap(`“${card.myth}”`, size, 1060, 5); if (lines.length * size * 1.18 <= 300 && !lines.at(-1).endsWith('…')) break; }
  const top = 190;
  const claim = lines.map((l, i) => `<text x="70" y="${top + i * size * 1.18}" font-size="${size}" font-weight="700" fill="#ffffff">${esc(l)}</text>`).join('');
  const verdictText = `${u.shareImgSays}: ${u.verdict[card.verdict]}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="${fam}">
<rect width="1200" height="630" fill="#000"/>
<text x="70" y="88" font-size="26" font-weight="700" letter-spacing="5" fill="#ffffff">THE RECORD</text>
<text x="70" y="${top - size - 6}" font-size="30" font-weight="500" fill="#a3a3a3">${esc(u.shareImgLead)}</text>
${claim}
<rect x="0" y="500" width="1200" height="130" fill="${COLORS[card.verdict]}"/>
<text x="70" y="580" font-size="50" font-weight="700" fill="#ffffff">${esc(verdictText)}</text>
</svg>`;
}

export async function renderShareImages({ LANGS, TOPICS, CARDS, UI, OUT }) {
  let n = 0;
  for (const l of LANGS) {
    fs.mkdirSync(`${OUT}/share/${l}`, { recursive: true });
    for (const t of TOPICS) for (const c of CARDS[l][t]) {
      const r = new Resvg(shareSVG(c, UI[l], l), { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter Tight' }, fitTo: { mode: 'original' } });
      fs.writeFileSync(`${OUT}/share/${l}/${c.id}.png`, r.render().asPng()); n++;
    }
  }
  if (!cjkFonts.length) console.warn('WARNING: Noto Sans CJK not found; zh/ja/ko share images will be missing glyphs. Install fonts-noto-cjk.');
  console.log(`share images: ${n}`);
}
