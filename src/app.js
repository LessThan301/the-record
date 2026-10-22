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
