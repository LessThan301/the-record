// Static build: prerenders every page into dist/. Usage: BASE=/the-record SITE_URL=https://x.github.io node tools/build.mjs
import fs from 'fs';
import path from 'path';
import { esc, fmt, backHTML } from '../src/render.js';
import { renderShareImages } from './share-images.mjs';

const cfg = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const BASE = (process.env.BASE ?? '').replace(/\/$/, '');
const ORIGIN = (process.env.SITE_ORIGIN ?? 'http://localhost:8080').replace(/\/$/, '');
const PREVIEW = process.env.PREVIEW ? process.env.PREVIEW === '1' : cfg.preview;
const COUNTER = process.env.COUNTER_ENDPOINT ?? cfg.counterEndpoint ?? '';
const DONATE = process.env.DONATION_URL ?? cfg.donationUrl ?? '';
const SKIP_IMG = process.env.SKIP_IMAGES === '1';
const LANGS = ['en', 'de', 'fr', 'es', 'it', 'nl', 'zh', 'ja', 'ko'];
const TOPICS = ['elon', 'spacex', 'tesla', 'evs', 'capitalism'];
const OUT = 'dist';
const extra = JSON.parse(fs.readFileSync('data/ui-extra.json', 'utf8'));
const UI = Object.fromEntries(LANGS.map((l) => [l, { ...JSON.parse(fs.readFileSync(`data/ui/${l}.json`, 'utf8')), ...extra[l] }]));
const CARDS = Object.fromEntries(LANGS.map((l) => [l, Object.fromEntries(TOPICS.map((t) => [t, JSON.parse(fs.readFileSync(`data/cards/${l}/${t}.json`, 'utf8'))]))]));
import crypto from 'crypto';
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
const renderSrc = fs.readFileSync('src/render.js'); const RENDER = `render.${hash(renderSrc)}.js`;
const appSrc = fs.readFileSync('src/app.js', 'utf8').replace("from './render.js'", `from './${RENDER}'`); const APP = `app.${hash(appSrc)}.js`;
const cssSrc = fs.readFileSync('src/style.css'); const CSS = `style.${hash(cssSrc)}.css`;

fs.rmSync(OUT, { recursive: true, force: true });
const write = (rel, s) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const lp = (l) => (l === 'en' ? '' : '/' + l);
const url = (l, p = '') => `${BASE}${lp(l)}/${p}`;
const cardPath = (t, c) => `${t}/${c.slug}/`;
const imgPath = (l, c) => `${BASE}/share/${l}/${c.id}.png`;
const sitemap = [];

function head(l, { title, desc, canonical, alt, image }) {
  const u = UI[l];
  const alts = alt ? LANGS.map((x) => `<link rel="alternate" hreflang="${x}" href="${ORIGIN}${alt(x)}">`).join('') : '';
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${PREVIEW ? '<meta name="robots" content="noindex,nofollow">' : ''}
<meta name="theme-color" content="#000000"><meta name="color-scheme" content="dark">
<link rel="canonical" href="${ORIGIN}${canonical}">${alts}
<meta property="og:type" content="website"><meta property="og:site_name" content="The Record"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${ORIGIN}${canonical}">
${image ? `<meta property="og:image" content="${ORIGIN}${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="preload" href="${BASE}/assets/InterTight-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${BASE}/assets/${CSS}">
<link rel="icon" href="${BASE}/assets/icon.svg" type="image/svg+xml">
<script type="module" src="${BASE}/assets/${APP}"></script>
</head><body>
<a class="skip" href="#main">${esc(u.skip)}</a>`;
}

function header(l, altPath) {
  const u = UI[l];
  const opts = LANGS.map((x) => `<option value="${esc(altPath(x))}"${x === l ? ' selected' : ''}>${esc(UI[x].language === undefined ? x : LABELS[x])}</option>`).join('');
  return `<header class="top"><div class="wrap top-in">
<a class="logo" href="${url(l)}">The Record</a>${PREVIEW ? `<span class="preview-badge" title="Not public yet">${esc(u.preview)}</span>` : ''}
<nav class="topnav" aria-label="Topics">${TOPICS.map((t) => `<a href="${url(l)}#${t}">${esc(u.categories[t].shortName)}</a>`).join('')}<a href="${url(l, 'method/')}">${esc(u.nav.method)}</a></nav>
<label class="lang"><span class="sr">${esc(u.language)}</span><span aria-hidden="true" class="lang-ico">文A</span><select class="js-lang" aria-label="${esc(u.language)}">${opts}</select></label>
</div></header>`;
}
const LABELS = { en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', it: 'Italiano', nl: 'Nederlands', zh: '中文', ja: '日本語', ko: '한국어' };

function footer(l) {
  const u = UI[l];
  const donate = DONATE
    ? `<a class="btn donate" href="${esc(DONATE)}" rel="noopener">${esc(u.donate)}</a>`
    : `<span class="btn donate is-disabled" aria-disabled="true">${esc(u.donate)} · ${esc(u.donateSoon)}</span>`;
  return `<footer class="foot"><div class="wrap">
<p class="foot-brand">The Record</p><p class="muted">${esc(u.footer.independent)}</p>
<p class="foot-links"><a href="${url(l, 'method/')}">${esc(u.nav.method)}</a><a href="${url(l, 'legal/')}">${esc(u.legalNav)}</a><a href="${BASE}/privacy/">${esc(u.privacy)}</a><a href="${BASE}/imprint/">${esc(u.imprint)}</a></p>
${donate}
<p class="muted small">${esc(u.footer.trademarks)}</p>
<nav class="foot-langs" aria-label="${esc(u.language)}">${LANGS.map((x) => `<a href="${url(x)}" lang="${x}" hreflang="${x}"${x === l ? ' aria-current="page"' : ''}>${LABELS[x]}</a>`).join('')}</nav>
</div></footer><div class="sr" aria-live="polite" id="live"></div></body></html>`;
}

const pageCfg = (l, extraCfg = {}) => `<script type="application/json" id="cfg">${JSON.stringify({ lang: l, base: BASE, lp: lp(l), origin: ORIGIN, counter: COUNTER, repo: cfg.repo, ui: pick(UI[l]), ...extraCfg }).replace(/</g, '\\u003c')}</script>`;
const pick = (u) => ({ ...Object.fromEntries(Object.keys(extra.en).map((k) => [k, u[k]])), verdict: u.verdict, verdictHint: u.verdictHint, home: u.home, categories: Object.fromEntries(TOPICS.map((t) => [t, { name: u.categories[t].name }])) });

function legend(u) {
  return `<section class="legend" aria-labelledby="legend-h"><h2 id="legend-h" class="kicker">${esc(u.home.gradeKey)}</h2><ul class="legend-list">${['false', 'misleading', 'overstated'].map((v) => `<li class="legend-item v-${v}"><span class="legend-label">${esc(u.verdict[v])}</span><span class="legend-hint">${esc(u.verdictHint[v])}</span></li>`).join('')}</ul></section>`;
}

function front(l, t, c, { headingTag = 'h3', link = true } = {}) {
  const u = UI[l];
  const n = String(c.number).padStart(2, '0');
  return `<div class="face front"><div class="front-top"><span class="kicker">${esc(u.categories[t].shortName)} · ${n}</span><span class="stamp" aria-hidden="true">${esc(u.home.mythStamp)}</span></div>
<${headingTag} class="claim" id="claim-${c.id}">${link ? `<a href="${url(l, cardPath(t, c))}">${esc(c.myth)}</a>` : esc(c.myth)}</${headingTag}>
<button type="button" class="believe js-believe" aria-expanded="false" aria-controls="back-${c.id}" aria-describedby="claim-${c.id}">${esc(u.home.iBelieve)}<span class="believe-arrow" aria-hidden="true">↻</span></button></div>`;
}

// ---------- pages ----------
for (const l of LANGS) {
  const u = UI[l];
  // Home
  const sections = TOPICS.map((t) => {
    const cat = u.categories[t];
    const cards = CARDS[l][t].map((c) => `<article class="card" data-id="${c.id}" data-topic="${t}" data-verdict="${c.verdict}">${front(l, t, c)}<div class="face back" id="back-${c.id}" hidden></div></article>`).join('');
    return `<section class="topic" id="${t}" data-topic="${t}" aria-labelledby="h-${t}"><div class="topic-head"><p class="kicker">${esc(cat.kicker)}</p><h2 id="h-${t}">${esc(cat.name)}</h2><p class="muted">${esc(cat.blurb)}</p></div><div class="grid">${cards}</div></section>`;
  }).join('');
  const filters = `<div class="filters" role="group" aria-label="${esc(u.allTopics)}"><button type="button" class="chip js-filter" data-f="all" aria-pressed="true">${esc(u.nav.all)}</button>${TOPICS.map((t) => `<button type="button" class="chip js-filter" data-f="${t}" aria-pressed="false">${esc(u.categories[t].shortName)}</button>`).join('')}</div>`;
  write(`${lp(l).slice(1)}/index.html`.replace(/^\//, ''), head(l, { title: `The Record · ${u.home.title}`, desc: u.home.lede, canonical: url(l), alt: (x) => url(x) }) + header(l, (x) => url(x)) +
    `<main id="main" class="wrap home"><div class="hero"><p class="kicker">${esc(u.home.kicker)}</p><h1>${esc(u.home.title)}</h1><p class="lede">${esc(u.home.lede)}</p></div>${legend(u)}${filters}<div class="topics">${sections}</div></main>` + pageCfg(l, { page: 'home' }) + footer(l));
  sitemap.push({ loc: url(l), alt: (x) => url(x) });

  // Card pages
  for (const t of TOPICS) {
    const list = CARDS[l][t];
    list.forEach((c, i) => {
      const all = TOPICS.flatMap((tt) => CARDS[l][tt].map((cc) => [tt, cc]));
      const idx = all.findIndex(([, cc]) => cc.id === c.id);
      const [nt, nc] = all[(idx + 1) % all.length];
      const p = url(l, cardPath(t, c));
      const ctx = { lang: l, ui: u, cardUrl: p, absUrl: ORIGIN + p, imgUrl: imgPath(l, c), repo: cfg.repo, nextUrl: url(l, cardPath(nt, nc)), counter: !!COUNTER };
      const verdictWord = u.verdict[c.verdict];
      write(path.join(lp(l).slice(1), t, c.slug, 'index.html'),
        head(l, { title: `${c.myth} · The Record`, desc: `${verdictWord}: ${c.headline}`, canonical: p, alt: (x) => url(x, cardPath(t, CARDS[x][t][i])), image: imgPath(l, c) }) +
        header(l, (x) => url(x, cardPath(t, CARDS[x][t][i]))) +
        `<main id="main" class="wrap single"><p class="crumbs"><a href="${url(l)}#${t}">← ${esc(u.backHome)}</a></p><article class="card is-single" data-id="${c.id}" data-topic="${t}" data-verdict="${c.verdict}">${front(l, t, c, { headingTag: 'h1', link: false })}<div class="face back" id="back-${c.id}" hidden>${backHTML(c, ctx)}</div></article></main>` +
        pageCfg(l, { page: 'card' }) + footer(l));
      sitemap.push({ loc: p, alt: (x) => url(x, cardPath(t, CARDS[x][t][i])) });
    });
    // split data for home (lazy loaded per topic)
    write(`data/${l}/${t}.json`, JSON.stringify(list.map((c) => ({ ...c, url: url(l, cardPath(t, c)) }))));
  }

  // Method
  const m = u.method;
  write(path.join(lp(l).slice(1), 'method', 'index.html'), head(l, { title: `${m.title} · The Record`, desc: m.p1, canonical: url(l, 'method/'), alt: (x) => url(x, 'method/') }) + header(l, (x) => url(x, 'method/')) +
    `<main id="main" class="wrap text"><p class="kicker">${esc(m.kicker)}</p><h1>${esc(m.title)}</h1><p class="lede">${esc(m.affiliation)}</p>${['p1', 'p2', 'p3', 'p4'].map((k) => `<p>${esc(m[k])}</p>`).join('')}${legend(u)}</main>` + pageCfg(l, { page: 'text' }) + footer(l));
  sitemap.push({ loc: url(l, 'method/'), alt: (x) => url(x, 'method/') });

  // Legal (disclaimer, terms, trademarks) – privacy & imprint are separate bilingual pages
  const g = u.legal;
  const sec = (h, arr) => `<h2>${esc(h)}</h2>${arr.map((p) => `<p>${esc(p)}</p>`).join('')}`;
  write(path.join(lp(l).slice(1), 'legal', 'index.html'), head(l, { title: `${g.title} · The Record`, desc: g.disclaimer[0], canonical: url(l, 'legal/'), alt: (x) => url(x, 'legal/') }) + header(l, (x) => url(x, 'legal/')) +
    `<main id="main" class="wrap text"><p class="kicker">${esc(g.kicker)}</p><h1>${esc(g.title)}</h1>${sec(g.disclaimerTitle, g.disclaimer)}${sec(g.termsTitle, g.terms)}${sec(g.ipTitle, g.ip)}<p><a href="${BASE}/privacy/">${esc(u.privacy)}</a> · <a href="${BASE}/imprint/">${esc(u.imprint)}</a></p></main>` + pageCfg(l, { page: 'text' }) + footer(l));
}

// Imprint + privacy (German and English on one page; German version is the binding one)
import { imprintHTML, privacyHTML } from './legal-pages.mjs';
for (const [slug, fn, title] of [['imprint', imprintHTML, 'Impressum / Imprint'], ['privacy', privacyHTML, 'Datenschutzerklärung / Privacy policy']]) {
  write(`${slug}/index.html`, head('de', { title: `${title} · The Record`, desc: title, canonical: `${BASE}/${slug}/` }) + header('en', (x) => url(x)) +
    `<main id="main" class="wrap text legal-page">${fn({ op: cfg.operator, counter: !!COUNTER, repo: cfg.repo })}</main>` + pageCfg('en', { page: 'text' }) + footer('en'));
  sitemap.push({ loc: `${BASE}/${slug}/` });
}

// 404
write('404.html', head('en', { title: 'Not found · The Record', desc: '', canonical: `${BASE}/404.html` }) + header('en', (x) => url(x)) +
  `<main id="main" class="wrap text"><h1>${esc(UI.en.notFoundTitle)}</h1><p>${esc(UI.en.notFoundBody)}</p><p><a class="btn primary" href="${url('en')}">${esc(UI.en.notFoundBack)}</a></p></main>` + pageCfg('en', { page: 'text' }) + footer('en'));

// sitemap + robots
const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.map((s) => `<url><loc>${ORIGIN}${s.loc}</loc>${s.alt ? LANGS.map((x) => `<xhtml:link rel="alternate" hreflang="${x}" href="${ORIGIN}${s.alt(x)}"/>`).join('') : ''}</url>`).join('\n')}\n</urlset>\n`;
write('sitemap.xml', sm);
write('robots.txt', PREVIEW ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}${BASE}/sitemap.xml\n`);

// assets
fs.mkdirSync(`${OUT}/assets`, { recursive: true });
fs.copyFileSync('src/icon.svg', `${OUT}/assets/icon.svg`);
fs.writeFileSync(`${OUT}/assets/${RENDER}`, renderSrc); fs.writeFileSync(`${OUT}/assets/${APP}`, appSrc); fs.writeFileSync(`${OUT}/assets/${CSS}`, cssSrc);
fs.copyFileSync('src/fonts/InterTight-var.woff2', `${OUT}/assets/InterTight-var.woff2`);
fs.writeFileSync(`${OUT}/.nojekyll`, '');

if (!SKIP_IMG) await renderShareImages({ LANGS, TOPICS, CARDS, UI, OUT });
console.log(`built ${sitemap.length} sitemap urls, preview=${PREVIEW}, base='${BASE}'`);
