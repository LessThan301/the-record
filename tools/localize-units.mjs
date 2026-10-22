// One-off migration (Oct 2026): convert imperial distances to metric and normalize dollar amounts
// to each language's number format. Prints every change so it can be reviewed.
import fs from 'fs';
const LANGS = ['en', 'de', 'fr', 'es', 'it', 'nl', 'zh', 'ja', 'ko'];
const TOPICS = ['elon', 'spacex', 'tesla', 'evs', 'capitalism'];
const MI = 1.609344;
const UNIT = { en: 'miles?', de: 'Meilen', fr: 'miles', es: 'millas', it: 'miglia', nl: 'mijl', zh: '(?:miles|英里)', ja: 'マイル', ko: '마일(?!스톤|리지)' };
const SCALE = { en: 'thousand|million|billion', de: 'Tausend|Millionen', fr: 'milliers de|millions de', es: 'mil|millones de|million', it: 'mila|milioni di', nl: 'duizend|miljoen', zh: 'thousand|million', ja: '', ko: '' };
const SCALEV = (w) => (/^(thousand|Tausend|milliers|mil$|mila|duizend)/i.test(w) ? 1e3 : /^(billion)/i.test(w) ? 1e9 : 1e6);
const US = { en: 'US', de: 'USA', fr: 'États-Unis', es: 'EE. UU.', it: 'USA', nl: 'VS', zh: '美国', ja: '米国', ko: '미국' };
const DEC = { de: ',', fr: ',', es: ',', it: ',', nl: ',' };
const log = [];

function parseNum(s, L) {
  s = s.trim();
  let k = 1; if (/k$/i.test(s)) { k = 1e3; s = s.slice(0, -1); }
  if (/[万億만억]/.test(s)) { // CJK myriads, e.g. 1億3500万 / 1억 3,500만
    let v = 0; const m = s.replace(/[,\s]/g, '').match(/(?:(\d+)[億억])?(?:(\d+)[万만])?(\d+)?/);
    v = (+(m[1] || 0)) * 1e8 + (+(m[2] || 0)) * 1e4 + (+(m[3] || 0)); return { v, sig: sigOf(String(v)) };
  }
  const grp = { de: '.', es: '.', it: '.', nl: '.', fr: ' ' }[L] || ',';
  let t = s.replace(/[\u202f\u00a0]/g, ' ');
  if (grp === '.' && /^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  else t = t.replace(/[, ]/g, (c) => (c === ',' && DEC[L] && !/,\d{3}\b/.test(t) ? '.' : ''));
  return { v: parseFloat(t) * k, sig: sigOf(t) };
}
const sigOf = (t) => Math.max(2, t.replace(/[^\d]/g, '').replace(/^0+/, '').replace(/0+$/, '').length);
const round = (v, sig) => { const p = Math.pow(10, Math.floor(Math.log10(v)) - sig + 1); return Math.round(v / p) * p; };
function fmt(v, L, sig) {
  if (v >= 1e6) return new Intl.NumberFormat(L, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: sig }).format(v);
  return new Intl.NumberFormat(L).format(v);
}

function convertDistances(s, L, id) {
  const NUM = L === 'ja' || L === 'ko' ? '\\d+k|\\d[\\d,]*(?:\\s?[万億만억]\\s?(?:\\d[\\d,]*\\s?[万만]?)?)?' : '\\d[\\d.,\\u202f ]*\\d(?:k)?|\\d+k?';
  const sc = SCALE[L] ? `(?:\\s(${SCALE[L]}))?` : '()';
  const re = new RegExp(`(${NUM})(?:\\s?[–〜-]\\s?(${NUM}))?(\\+)?${sc}\\s?(${UNIT[L]})`, 'g');
  return s.replace(re, (all, a, b, plus, scale) => {
    const sv = scale ? SCALEV(scale) : 1;
    const A = parseNum(a, L), B = b ? parseNum(b, L) : null;
    const ka = round(A.v * sv * MI, A.sig), kb = B ? round(B.v * sv * MI, B.sig) : null;
    const sig = Math.max(A.sig, B?.sig || 0);
    let out = (B ? `${fmt(ka, L, sig)}–${fmt(kb, L, sig)}` : fmt(ka, L, sig)) + (plus || '') + (L === 'ja' || L === 'ko' || L === 'zh' ? ' km' : ' km');
    if (L === 'en') out += ` (${all.replace(/^~/, '')})`;
    if ((id === 'tesla-battery-die' || id === 'ev-range') && !out.includes(US[L])) out += L === 'en' ? '' : '';
    log.push(`${L} ${id}: "${all}" -> "${out}"`);
    return out;
  });
}

// Phrase fixes (per-distance rates, leftover words, US labels). Applied after number conversion.
const PHRASES = {
  en: [['Per mile, Tesla', 'Per distance driven, Tesla'], ['fewer crashes per mile', 'fewer crashes per km'], ['drivers per mile', 'drivers per km'], ['Fewer crashes per mile', 'Fewer crashes per km'], ['billions of real-world miles', 'billions of real-world kilometres'], ['8 years / mileage cap', '8 years / distance cap'], ['8 years, mileage cap by model', '8 years, distance cap by model (US terms)'], ['depending on model, to a capacity floor', 'depending on model (US terms), to a capacity floor'], ['EPA: most new models', 'EPA (US): most new models'], ['miles EPA (US)', 'miles EPA'], ['Typically 320+', 'Typically 320+']],
  de: [['Pro Meile', 'Pro gefahrenem Kilometer'], ['pro Meile', 'pro Kilometer'], ['Milliarden realer Meilen', 'Milliarden realer Kilometer'], ['Meilendeckel', 'Kilometergrenze'], ['je nach Modell, bis', 'je nach Modell (US-Garantie), bis'], ['EPA: Die meisten', 'EPA (USA): Die meisten']],
  fr: [['10 à 20 milliers de miles', '16 000 à 32 000 km'], ['millions km', 'millions de km'], ['Au mile,', 'Au kilomètre,'], ['par mile', 'par kilomètre'], ['au mile', 'au kilomètre'], ['milliards de miles', 'milliards de kilomètres'], ['selon le modèle, jusqu', 'selon le modèle (garantie américaine), jusqu'], ['EPA : la plupart', 'EPA (États-Unis) : la plupart']],
  es: [['~2.5\u00a0%', '~2,5\u00a0%'], ['2.31 billion people', '2.310 millones de personas'], ['~808 million', '~808 millones'], ['millones km', 'millones de km'], ['Por milla,', 'Por kilómetro,'], ['por milla', 'por kilómetro'], ['miles de millones de millas', 'miles de millones de kilómetros'], ['tope de millas', 'tope de kilómetros'], ['8 years', '8 años'], ['según el modelo, h', 'según el modelo (garantía de EE. UU.), h'], ['EPA: la mayoría', 'EPA (EE. UU.): la mayoría']],
  it: [['Per miglio', 'Per chilometro'], ['per miglio', 'per chilometro'], ['milioni km', 'milioni di km'], ['miliardi di miglia', 'miliardi di chilometri'], ['a seconda del modello, fino', 'a seconda del modello (garanzia USA), fino']],
  nl: [['Per mijl', 'Per kilometer'], ['per mijl', 'per kilometer'], ['afhankelijk van het model, tot', 'afhankelijk van het model (Amerikaanse garantie), tot'], ['EPA: de meeste', 'EPA (VS): de meeste']],
  zh: [['按英里计', '按行驶里程计'], ['每英里', '每公里'], ['数十亿英里', '数十亿公里'], ['质保（视车型而定）', '质保（美国条款，视车型而定）'], ['EPA：大多数', 'EPA（美国）：大多数']],
  ja: [['マイルあたり', 'キロあたり'], ['数十億マイル', '数十億キロ'], ['マイル上限', '走行距離上限'], ['モデルにより8年', '米国ではモデルにより8年'], ['新型の多くは公称', '米国EPAでは新型の多くが公称']],
  ko: [['마일당', 'km당'], ['수십억 마일', '수십억 km'], ['마일리지 상한', '주행거리 상한'], ['Tesla는 모델에 따라', 'Tesla는 미국에서 모델에 따라'], ['EPA: 대부분', 'EPA(미국): 대부분']],
};

// Dollar amounts in non-English text -> locale currency format.
function convertDollars(s, L, id) {
  if (L === 'en') return s;
  const W = 'k|K|M|B|bn|billion|million|Millionen|Milliarden|milliards|millions|miliardi|milioni|miljard|miljoen';
  const re = new RegExp(`(~)?\\$\\s?(\\d+(?:[.,]\\d+)?)(?:\\s?[–-]\\s?\\$?(\\d+(?:[.,]\\d+)?))?(?:\\s?(${W})\\b)?(?:\\s(?:de |di )?dollars?)?`, 'g');
  return s.replace(re, (all, tilde, a, b, w) => {
    const mult = !w ? 1 : /^k$/i.test(w) ? 1e3 : /^(M|million|Millionen|millions|milioni|miljoen)$/.test(w) ? 1e6 : 1e9;
    const p = (x) => (/^\d{1,3}([.,])\d{3}$/.test(x) ? parseFloat(x.replace(/[.,]/, '')) : parseFloat(x.replace(',', '.'))) * mult;
    const dec = Math.max((a.split(/[.,]/)[1] || '').length, 0);
    const nf = new Intl.NumberFormat(L, { style: 'currency', currency: 'USD', notation: mult >= 1e6 ? 'compact' : 'standard', compactDisplay: L === 'es' ? 'long' : 'short', minimumFractionDigits: 0, ...(['zh','ja','ko'].includes(L) && mult >= 1e6 ? { maximumSignificantDigits: 3 } : {}), maximumFractionDigits: /^\d{1,3}[.,]\d{3}$/.test(a) ? 0 : Math.min(dec, 2) });
    const out = (tilde || '') + (b ? nf.formatRange(p(a), p(b)) : nf.format(p(a)));
    log.push(`${L} ${id}: "${all}" -> "${out}"`);
    return out;
  });
}

const walk = (x, f) => (typeof x === 'string' ? f(x) : Array.isArray(x) ? x.map((v) => walk(v, f)) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, walk(v, f)])) : x);
let total = 0;
for (const L of LANGS) for (const T of TOPICS) {
  const f = `data/cards/${L}/${T}.json`;
  const cards = JSON.parse(fs.readFileSync(f, 'utf8')).map((c) => {
    for (const k of ['myth', 'headline', 'kernel', 'body', 'keyFacts']) {
      c[k] = walk(c[k], (s) => {
        if (L === 'es') s = s.replace('~11k–20k miles', '~11k–20k millas').replace(/(\d+) million miles/g, '$1 millones de millas');
        let o = L === 'fr' ? s.split('10 à 20 milliers de miles').join('16 000 à 32 000 km') : s;
        o = convertDollars(convertDistances(o, L, c.id), L, c.id);
        if (L === 'zh') o = o.replace(/(\d+(?:\.\d+)?) (billion|million)(?! miles)/g, (m, n, w) => { const out = new Intl.NumberFormat('zh', { notation: 'compact', maximumSignificantDigits: 4 }).format(n * (w === 'billion' ? 1e9 : 1e6)); log.push(`zh ${c.id}: "${m}" -> "${out}"`); return out; });
        if (L === 'de' || L === 'es' || L === 'fr') o = o.replace(/(\d)\s?%/g, '$1\u00a0%');
        for (const [a, b] of PHRASES[L]) if (o.includes(a)) { o = o.split(a).join(b); log.push(`${L} ${c.id}: phrase "${a}" -> "${b}"`); }
        return o;
      });
    }
    return c;
  });
  fs.writeFileSync(f, JSON.stringify(cards, null, 2) + '\n');
}
fs.writeFileSync('/tmp/units-log.txt', log.join('\n') + '\n');
console.log(log.length, 'changes');
