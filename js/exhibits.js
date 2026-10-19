// Exhibits: the cards on the easel during a pitch, and the gallery students can review
// afterwards. Text lives in content/exhibits.json. Each exhibit shows either a Google Flow image
// (`img`, a file in assets/img/) or a drawn fact card (`art`, a key in js/art/cards.js).

let all = null;
let cards = null;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The picture for an exhibit or reveal: an <img> for Flow art, inline SVG for a fact card. */
export async function artHTML(ex) {
  if (ex.img) return `<img src="assets/img/${esc(ex.img)}" alt="" loading="eager">`;
  if (!cards) { try { cards = (await import('./art/cards.js')).default; } catch { cards = {}; } }
  return cards[ex.art] || placeholder(ex.title || '');
}

/** Exhibits for a pitch (or the briefing), each with its picture attached as `svg`. */
export async function loadExhibits(pid) {
  if (!all) all = await (await fetch('content/exhibits.json')).json();
  return Promise.all((all[pid] || []).map(async (ex) => ({ ...ex, svg: await artHTML(ex) })));
}

function placeholder(title) {
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="384" height="284" rx="10" fill="#e6d7b5" stroke="#1b1410" stroke-width="4" stroke-dasharray="10 8"/>
    <text x="200" y="158" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#6b4a2b">${esc(title)}</text></svg>`;
}

const letter = (i) => String.fromCharCode(65 + i);

/** One exhibit card. `i` is its position, `n` how many the pitch has. */
export function exhibitCard(ex, i, n) {
  return `<div class="exhibit">
    <div class="ex-head"><span class="label">Exhibit ${letter(i)}</span><span class="dots">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'past' : k === i ? 'now' : ''}"></i>`).join('')}</span></div>
    <div class="ex-title">${esc(ex.title)}</div>
    <div class="ex-body">
      <div class="ex-art">${ex.svg}</div>
      <div class="ex-text"><div class="ex-lead">${esc(ex.lead)}</div><ul class="ex-facts">${ex.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
    </div>
  </div>`;
}

/** Full-screen gallery of a pitch's exhibits, opened over `host`. */
export async function openGallery(host, pid, title) {
  const exs = await loadExhibits(pid);
  const g = document.createElement('div');
  g.className = 'gallery';
  host.append(g);
  let open = -1;
  const draw = () => {
    if (open < 0) {
      g.innerHTML = `<div class="g-head"><div><div class="kicker">Review the exhibits</div><h2>${esc(title)}</h2></div><button class="btn" data-g="close">Close &times;</button></div>
        <div class="g-grid">${exs.map((ex, i) => `<button class="g-thumb" data-g="${i}"><div class="g-art">${ex.svg}</div><div class="g-cap"><b>${letter(i)}</b> ${esc(ex.title)}</div></button>`).join('')}</div>`;
    } else {
      g.innerHTML = `<div class="g-one">${exhibitCard(exs[open], open, exs.length)}</div>
        <div class="g-nav"><button class="btn ghost" data-g="prev" ${open === 0 ? 'disabled' : ''}>&larr;</button><button class="btn" data-g="grid">All exhibits</button><button class="btn ghost" data-g="next" ${open === exs.length - 1 ? 'disabled' : ''}>&rarr;</button><button class="btn" data-g="close">Close &times;</button></div>`;
    }
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (open >= 0 && e.key === 'ArrowRight' && open < exs.length - 1) { open++; draw(); }
    if (open >= 0 && e.key === 'ArrowLeft' && open > 0) { open--; draw(); }
  };
  const close = () => { g.remove(); document.removeEventListener('keydown', onKey); };
  g.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    const v = b.dataset.g;
    if (v === 'close') return close();
    if (v === 'grid') open = -1;
    else if (v === 'prev') open--;
    else if (v === 'next') open++;
    else open = Number(v);
    draw();
  });
  document.addEventListener('keydown', onKey);
  draw();
}
