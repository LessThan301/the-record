// Shared by the build (Node) and the browser: renders the "record" side of a card.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

export function correctionUrl(repo, card, url) {
  const q = new URLSearchParams({ template: 'correction.yml', title: `Correction: ${card.id}`, card: url });
  return `https://github.com/${repo}/issues/new?${q}`;
}

export function fmtDate(iso, lang) {
  try { return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z')); } catch { return iso; }
}

/** ctx: { lang, ui, cardUrl, imgUrl, repo, nextUrl (card page) | null (home), counter: bool } */
export function backHTML(card, ctx) {
  const u = ctx.ui, id = esc(card.id);
  const kernel = card.kernel ? `<div class="kernel"><h4>${esc(u.kernelLabel)}</h4><p>${esc(card.kernel)}</p></div>` : '';
  const body = (card.body || []).map((p) => `<p>${esc(p)}</p>`).join('');
  const facts = card.keyFacts?.length ? `<h4>${esc(u.keyFacts)}</h4><dl class="facts">${card.keyFacts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>` : '';
  const sources = `<h4>${esc(u.home.sources)}</h4><ol class="sources">${card.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> <span class="pub">${esc(s.publisher)}</span></li>`).join('')}</ol>`;
  const next = ctx.nextUrl
    ? `<a class="btn primary" href="${esc(ctx.nextUrl)}">${esc(u.nextClaim)} <span aria-hidden="true">→</span></a>`
    : `<button type="button" class="btn primary js-next">${esc(u.nextClaim)} <span aria-hidden="true">→</span></button>`;
  const counter = ctx.counter ? `<div class="counter" data-id="${id}" hidden><p class="counter-q">${esc(u.believedQ)}</p><div class="counter-btns"><button type="button" class="btn small js-vote" data-v="1">${esc(u.yes)}</button><button type="button" class="btn small js-vote" data-v="0">${esc(u.no)}</button></div><p class="counter-result" aria-live="polite"></p></div>` : '';
  return `<div class="banner v-${esc(card.verdict)}"><span class="banner-label">${esc(u.verdict[card.verdict])}</span><span class="banner-hint">${esc(u.verdictHint[card.verdict])}</span></div>
<div class="back-body">
<p class="picked"><span class="picked-label">${esc(u.home.claimPicked)}</span> ${esc(card.myth)}</p>
<h3 class="headline" tabindex="-1">${esc(card.headline)}</h3>
${kernel}<div class="prose">${body}</div>${facts}${sources}
<p class="checked">${esc(u.lastChecked)}: <time datetime="${esc(card.lastChecked)}">${esc(fmtDate(card.lastChecked, ctx.lang))}</time></p>
${counter}
<div class="actions">${next}<button type="button" class="btn js-share" data-url="${esc(ctx.cardUrl)}">${esc(u.share)}</button><a class="btn ghost" href="${esc(ctx.imgUrl)}" download="the-record-${id}.png">${esc(u.shareImage)}</a></div>
<p class="meta-links"><a href="${esc(correctionUrl(ctx.repo, card, ctx.absUrl || ctx.cardUrl))}" target="_blank" rel="noopener">${esc(u.suggestCorrection)}</a><span aria-hidden="true"> · </span><button type="button" class="linkish js-unflip">${esc(u.home.showMyth)}</button></p>
</div>`;
}
