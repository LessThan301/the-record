// The Record: progressive enhancement. Pages are fully readable without this script.
import { backHTML, fmt } from './render.js';
const cfg = JSON.parse(document.getElementById('cfg').textContent);
const u = cfg.ui;
const live = document.getElementById('live');
const say = (t) => { live.textContent = ''; setTimeout(() => (live.textContent = t), 30); };
const cache = {};
const loadTopic = (t) => (cache[t] ??= fetch(`${cfg.base}/data/${cfg.lang}/${t}.json`).then((r) => { if (!r.ok) throw r; return r.json(); }));

// language switcher
const sel = document.querySelector('.js-lang');
sel?.addEventListener('change', () => { try { localStorage.setItem('the-record-lang', sel.value.split('/').filter(Boolean)[cfg.base ? 1 : 0] || 'en'); } catch {} location.href = sel.value; });

function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 2200); }

// Only one card may be expanded. Collapse all others and keep `keep` at the same place on screen.
function collapseOthers(keep) {
  const before = keep.getBoundingClientRect().top;
  document.querySelectorAll('.card.is-open, .card.is-current').forEach((c) => {
    if (c === keep) return;
    c.classList.remove('is-current');
    if (c.classList.contains('is-open')) closeCard(c, false);
  });
  const delta = keep.getBoundingClientRect().top - before;
  if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
}

async function openCard(card) {
  collapseOthers(card);
  const back = card.querySelector('.face.back');
  const btn = card.querySelector('.js-believe');
  if (!back.innerHTML.trim()) {
    btn.setAttribute('aria-busy', 'true');
    say(u.home.flipping);
    try {
      const list = await loadTopic(card.dataset.topic);
      const c = list.find((x) => x.id === card.dataset.id);
      back.innerHTML = backHTML(c, { lang: cfg.lang, ui: u, cardUrl: c.url, absUrl: cfg.origin + c.url, imgUrl: `${cfg.base}/share/${cfg.lang}/${c.id}.png`, repo: cfg.repo, nextUrl: null, counter: !!cfg.counter });
    } catch { location.href = card.querySelector('.claim a')?.href || location.href; return; }
    finally { btn.removeAttribute('aria-busy'); }
  }
  back.hidden = false; card.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
  const h = back.querySelector('.headline');
  say(`${back.querySelector('.banner-label').textContent}. ${h.textContent}`);
  h.focus({ preventScroll: true });
  card.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  initCounter(back);
}
function closeCard(card, focus = true) {
  const back = card.querySelector('.face.back');
  back.hidden = true; card.classList.remove('is-open');
  const btn = card.querySelector('.js-believe'); btn.setAttribute('aria-expanded', 'false');
  if (focus) btn.focus();
}

// Present a card's front as the current claim: full width, scrolled to the top, focus on the claim.
function showFront(card) {
  collapseOthers(card);
  card.classList.add('is-current');
  const claim = card.querySelector('.claim');
  card.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'instant' });
  card.querySelector('.js-believe').focus({ preventScroll: true });
  say(claim.textContent.trim());
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('button, a'); if (!b) return;
  const card = b.closest('.card');
  if (b.matches('.js-believe')) openCard(card);
  else if (b.matches('.js-unflip')) closeCard(card);
  else if (b.matches('.js-next')) {
    const all = [...document.querySelectorAll('.topic:not([hidden]) .card')];
    const next = all[(all.indexOf(card) + 1) % all.length];
    closeCard(card, false);
    showFront(next);
  } else if (b.matches('.js-share')) {
    const url = cfg.origin + b.dataset.url;
    const back = b.closest('.face.back');
    const claim = card.querySelector('.claim').textContent.trim();
    const verdict = back.querySelector('.banner-label').textContent;
    const text = fmt(u.shareText, { claim, verdict });
    if (navigator.share) { try { await navigator.share({ title: 'The Record', text, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(`${text} ${url}`); toast(u.copied); say(u.copied); } catch { prompt(u.share, url); } }
  } else if (b.matches('.js-filter')) {
    const f = b.dataset.f;
    document.querySelectorAll('.js-filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.querySelectorAll('.topic').forEach((s) => (s.hidden = f !== 'all' && s.dataset.topic !== f));
  } else if (b.matches('.js-vote')) vote(b);
});

// Esc closes an open card
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const c = document.activeElement?.closest?.('.card.is-open'); if (c && cfg.page === 'home') closeCard(c); } });

// anonymous "X% believed this" counter, only when an endpoint is configured
const voted = (id) => { try { return localStorage.getItem('tr-v-' + id); } catch { return null; } };
async function initCounter(back) {
  const box = back.querySelector('.counter'); if (!box || !cfg.counter || box.dataset.ready) return;
  box.dataset.ready = '1';
  try {
    const r = await fetch(`${cfg.counter}/counts?id=${encodeURIComponent(box.dataset.id)}`); if (!r.ok) return;
    const d = await r.json(); box.hidden = false;
    if (voted(box.dataset.id)) showResult(box, d);
  } catch { /* stay hidden */ }
}
function showResult(box, d) {
  box.querySelector('.counter-btns').hidden = true; box.querySelector('.counter-q').hidden = true;
  if (d.total >= 5) box.querySelector('.counter-result').textContent = fmt(u.believedPct, { p: Math.round((100 * d.believed) / d.total), n: d.total.toLocaleString(cfg.lang) });
  else box.querySelector('.counter-result').textContent = u.thanks;
}
async function vote(b) {
  const box = b.closest('.counter'); const id = box.dataset.id;
  if (voted(id)) return;
  try {
    const r = await fetch(`${cfg.counter}/vote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, believed: b.dataset.v === '1' }) });
    const d = await r.json(); try { localStorage.setItem('tr-v-' + id, b.dataset.v); } catch {}
    showResult(box, d); say(box.querySelector('.counter-result').textContent);
  } catch { box.hidden = true; }
}

// single card page: deep link "#record" opens the back
if (cfg.page === 'card') {
  const c = document.querySelector('.card.is-single');
  if (location.hash === '#record') openCard(c);
}

// ---------- Compare two cards ----------
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let pick = null; // first selected card element
let cmp = null; // { root, cards:[el,el], returnFocus }
const bar = document.createElement('div');
bar.className = 'cmp-bar'; bar.hidden = true; bar.setAttribute('role', 'status');
bar.innerHTML = `<span class="cmp-bar-text"></span><button type="button" class="btn small js-cmp-cancel">${u.cancel}</button>`;
document.body.append(bar);

function setToggle(card, on) {
  const t = card?.querySelector('.js-compare'); if (!t) return;
  t.setAttribute('aria-pressed', String(on)); t.textContent = on ? t.dataset.selected : t.dataset.label;
  card.classList.toggle('is-picked', on);
}
function cancelPick() { setToggle(pick, false); pick = null; bar.hidden = true; }

async function cardData(card) {
  const list = await loadTopic(card.dataset.topic);
  return list.find((x) => x.id === card.dataset.id);
}

async function openCompare(a, b, opener) {
  const [ca, cb] = await Promise.all([cardData(a), cardData(b)]);
  cancelPick();
  const col = (c, el) => `<article class="cmp-card" tabindex="0" aria-label="${el.querySelector('.claim').textContent.trim().replace(/"/g, '&quot;')}">
<div class="cmp-front"><p class="kicker">${u.categories[el.dataset.topic].name} · ${String(c.number).padStart(2, '0')}</p><p class="cmp-claim">${el.querySelector('.claim').innerHTML}</p></div>
${backHTML(c, { lang: cfg.lang, ui: u, cardUrl: c.url, repo: cfg.repo, compact: true })}</article>`;
  const root = document.createElement('div');
  root.className = 'cmp-layer';
  root.innerHTML = `<div class="cmp-backdrop js-cmp-close"></div>
<div class="cmp" role="dialog" aria-modal="true" aria-labelledby="cmp-title">
<div class="cmp-head"><h2 id="cmp-title">${u.compareTitle}</h2><span class="cmp-hint">${u.swipeHint}</span><button type="button" class="cmp-x js-cmp-close" aria-label="${u.close}">×</button></div>
<div class="cmp-cols">${col(ca, a)}${col(cb, b)}</div></div>`;
  document.body.append(root);
  document.querySelectorAll('body > header, body > main, body > footer').forEach((x) => (x.inert = true));
  document.documentElement.classList.add('cmp-open');
  cmp = { root, src: [a, b], returnFocus: opener };
  const url = new URL(location.href); url.searchParams.set('compare', `${a.dataset.id},${b.dataset.id}`); history.replaceState(null, '', url);
  const targets = [...root.querySelectorAll('.cmp-card')];
  if (!reduced()) {
    root.querySelector('.cmp-backdrop').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    targets.forEach((t, i) => flip(t, cmp.src[i], false));
  }
  root.querySelector('.cmp-x').focus();
  say(u.compareTitle);
}
function flip(target, source, reverse) {
  const s = source.getBoundingClientRect(), t = target.getBoundingClientRect();
  const from = `translate(${s.left - t.left}px, ${s.top - t.top}px) scale(${s.width / t.width}, ${Math.min(s.height, t.height) / t.height})`;
  const frames = [{ transform: from, opacity: 0.6, transformOrigin: 'top left' }, { transform: 'none', opacity: 1, transformOrigin: 'top left' }];
  return target.animate(reverse ? frames.reverse() : frames, { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished;
}
async function closeCompare() {
  if (!cmp) return; const { root, src, returnFocus } = cmp; cmp = null;
  if (!reduced()) {
    const cards = [...root.querySelectorAll('.cmp-card')];
    cards.forEach((c) => (c.scrollTop = 0));
    await Promise.all([...cards.map((c, i) => flip(c, src[i], true)), root.querySelector('.cmp-backdrop').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' }).finished]);
  }
  root.remove();
  document.querySelectorAll('body > header, body > main, body > footer').forEach((x) => (x.inert = false));
  document.documentElement.classList.remove('cmp-open');
  const url = new URL(location.href); url.searchParams.delete('compare'); history.replaceState(null, '', url);
  (returnFocus && document.contains(returnFocus) ? returnFocus : src[1].querySelector('.js-believe'))?.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('.js-compare, .js-cmp-cancel, .js-cmp-close'); if (!t) return;
  if (t.matches('.js-cmp-close')) return closeCompare();
  if (t.matches('.js-cmp-cancel')) { const p0 = pick; cancelPick(); p0?.querySelector('.js-compare')?.focus(); return; }
  const card = t.closest('.card');
  if (pick === card) return cancelPick();
  if (!pick) {
    pick = card; setToggle(card, true);
    bar.querySelector('.cmp-bar-text').textContent = u.compareBar; bar.hidden = false; return;
  }
  setToggle(card, true);
  openCompare(pick, card, t);
});
document.addEventListener('keydown', (e) => {
  if (!cmp) { if (e.key === 'Escape' && pick) cancelPick(); return; }
  if (e.key === 'Escape') { e.preventDefault(); closeCompare(); return; }
  if (e.key === 'Tab') { // focus trap
    const f = [...cmp.root.querySelectorAll('button, a[href], [tabindex="0"]')].filter((x) => x.offsetParent !== null);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}, true);

// Share link: ?compare=idA,idB
if (cfg.page === 'home') {
  const q = new URLSearchParams(location.search).get('compare');
  const ids = q?.split(',');
  const els = ids?.map((id) => document.querySelector(`.card[data-id="${CSS.escape(id)}"]`));
  if (els?.length === 2 && els.every(Boolean) && els[0] !== els[1]) { els[0].scrollIntoView({ block: 'center' }); openCompare(els[0], els[1], null); }
}
