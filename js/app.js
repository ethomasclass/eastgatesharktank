// For Lease: Vine & 18th. Game flow, teacher tools and the "Five Years Later" reveal.
// Built on The Tank (Transportation Revolution): the same mechanics, plus a neighborhood briefing.
// Routes: #/            lobby
//         #/play/class  projector run (students write on their worksheets)
//         #/play/solo   catch-up run for an absent student (invests on screen)
//         #/teacher     teacher tools (password)
//         #/reveal/class, #/reveal/solo   Where Are They Now (password)
import { makeActor, flap, playPitch } from './stage.js';
import { store } from './store.js';
import { unlock, unlocked, lock } from './vault.js';
import { openGallery, artHTML } from './exhibits.js';
import { tankEmblem } from './tanklogo.js';

const app = document.getElementById('app');
const START = 1000;
let C = null;          // public content
let stopCurrent = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => '$' + (Math.abs(n - Math.round(n)) < 0.005 ? Math.round(n).toLocaleString('en-US')
  : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
// Scoring matches the Investor Tracker: C = made per $1 (a whole number, +4 ... -1),
// D = worth at end = B (invested) x C, and the final total is the sum of the D's.
const profitPer = (c) => c.profit ?? Math.round(c.payout / 1000 - 1);
const worthOf = (inv, c) => (Number(inv) || 0) * profitPer(c);
const signed = (n) => `<span class="nw">${n < 0 ? '&minus;' : '+'}${money(Math.abs(n))}</span>`;
const perOne = (c) => (profitPer(c) < 0 ? '&minus;$' : '+$') + Math.abs(profitPer(c));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- settings and runs ----------
const DEFAULTS = { period: '1', orders: {}, qLimit: 2, timer: 60, music: 0.1 };
const MUSIC = [[0, 'off'], [0.06, 'very soft'], [0.1, 'soft'], [0.16, 'medium']];
const settings = () => ({ ...DEFAULTS, ...store.local.get('eastgate.settings', {}) });
const saveSettings = (s) => store.local.set('eastgate.settings', s);
const periodOrder = (s = settings()) => s.orders[s.period] || C.defaultOrder;
const getRun = (mode) => store.local.get(`eastgate.run.${mode}`);
const saveRun = (run) => store.local.set(`eastgate.run.${run.mode}`, run);

function newRun(mode) {
  const s = settings();
  if (mode === 'class' && !s.orders[s.period]) { s.orders[s.period] = shuffle(C.defaultOrder); saveSettings(s); }
  return { mode, order: mode === 'class' ? periodOrder(s) : shuffle(C.defaultOrder),
    period: s.period, i: 0, step: 'welcome', asked: {}, invest: {} };
}
// Each venture's logo (js/logos/<pitch id>.js: { mark, icon }), or null if it hasn't been made.
const logos = {};
async function logoFor(pid) {
  if (!(pid in logos)) { try { logos[pid] = (await import(`./logos/${pid}.js`)).default; } catch { logos[pid] = null; } }
  return logos[pid];
}
const spent = (run) => Object.values(run.invest).reduce((a, b) => a + b, 0);

// ---------- layout helpers ----------
function setScene(inner, { spot = '25%', sign = true, gobo = '' } = {}) {
  if (stopCurrent) { stopCurrent(); stopCurrent = null; }
  app.innerHTML = `<div class="set"><div class="wall"></div><div class="windows"><i></i><i></i><i></i></div><div class="floor"></div><div class="lamp l"></div><div class="lamp r"></div>${sign ? '<div class="sign">FOR LEASE</div>' : ''}${gobo ? `<div class="gobo ${gobo}">${tankEmblem('gobo')}</div>` : ''}</div>
    <div class="spot" style="--spot-x:${spot}"></div><div class="layer" style="position:absolute;inset:0">${inner}</div>`;
  return app.querySelector('.layer');
}
function topbar(left = '', right = '') {
  return `<div class="topbar"><div style="display:flex;gap:.8cqw;align-items:center"><button class="homebtn" data-go="#/">&larr; Lobby</button>${left}</div><div style="display:flex;gap:.8cqw">${right}</div></div>`;
}
// In-page yes/no box. window.confirm() is blocked when the game runs inside a sandboxed frame
// (the published artifact), where it silently returns false, so every confirmation uses this.
function ask(message, { ok = 'Yes', cancel = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    const d = document.createElement('div');
    d.className = 'modal';
    d.innerHTML = `<div class="ask panel" role="alertdialog" aria-modal="true"><p>${esc(message)}</p>
      <div class="ask-btns"><button class="btn ghost" data-a="no">${esc(cancel)}</button><button class="btn primary" data-a="yes">${esc(ok)}</button></div></div>`;
    app.append(d);
    const done = (v) => { d.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') done(false); };
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (b) done(b.dataset.a === 'yes'); else if (e.target === d) done(false);
    });
    document.addEventListener('keydown', onKey);
    d.querySelector('[data-a=yes]').focus();
  });
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; app.append(t);
  setTimeout(() => t.remove(), 2200);
}
app.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); location.hash = g.dataset.go; }
  const x = e.target.closest('[data-exhibits]');
  if (x) openGallery(app, x.dataset.exhibits, (C.pitches[x.dataset.exhibits] || C.briefing).title);
});
const reviewBtn = (pid) => `<button class="btn small ghost" data-exhibits="briefing">&#127968; The neighborhood</button><button class="btn small" data-exhibits="${pid}">&#128444; Review the exhibits</button>`;

// ---------- lobby ----------
function lobby() {
  const s = settings();
  const cls = getRun('class'), solo = getRun('solo');
  const L = setScene(`
    <div class="lobby"><div>
      <div class="marquee"><h1>FOR LEASE</h1><div class="years">The old parish hall at Vine &amp; 18th</div></div>
      <p class="sub">Five people have an idea for this hall. You have <b>$1,000</b> to spread across the ideas you believe in. Read the neighborhood, hear the pitches, and invest after each one. No take-backs.</p>
      <div class="choices">
        <button class="btn primary big" data-act="class">${cls && cls.step !== 'done' ? 'Resume class game' : 'Start class game'}</button>
        <button class="btn big" data-act="solo">${solo ? 'Resume catch-up' : 'Catch-up (play on your own)'}</button>
        <button class="btn ghost big" data-go="#/teacher">Teacher</button>
      </div>
      <div class="lobby-tools"><button class="btn small ghost" data-act="howto">&#10067; How to play</button><button class="btn small ghost" data-act="clear">&#10227; Clear class &amp; catch-up games</button></div>
      <div class="meta">Class setup: Period ${esc(s.period)} · briefing + five 90-second pitches · ${s.qLimit} question${s.qLimit === 1 ? '' : 's'} per pitch${cls ? ` · <button class="homebtn" data-act="restart-class" style="text-decoration:underline">start class game over</button>` : ''}</div>
    </div></div>`, { spot: '50%', sign: false });
  L.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'class') { if (!cls) saveRun(newRun('class')); location.hash = '#/play/class'; }
    if (a === 'solo') { if (!solo) saveRun(newRun('solo')); location.hash = '#/play/solo'; }
    if (a === 'restart-class' && await ask('Start the class game over from the briefing?', { ok: 'Start over' })) { saveRun(newRun('class')); location.hash = '#/play/class'; }
    if (a === 'howto') directions();
    if (a === 'clear' && await ask('Clear the class game and the catch-up game on this computer? Everyone starts over at the briefing with $1,000. Teacher settings and leaderboards are kept.', { ok: 'Clear both games' })) {
      store.local.del('eastgate.run.class');
      store.local.del('eastgate.run.solo');
      store.session.del('eastgate.reveal.class');
      store.session.del('eastgate.reveal.solo');
      lobby();
      toast('Class and catch-up games cleared');
    }
  });
  if (!store.session.get('eastgate.howto.seen')) { store.session.set('eastgate.howto.seen', true); directions(); }
}

// The directions panel: pops up on the lobby once per browser session, and on "How to play".
function directions() {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="howto panel" role="dialog" aria-modal="true" aria-labelledby="howto-title">
    <div class="howto-head"><div class="howto-emblem">${tankEmblem('howto')}</div>
      <div><div class="kicker">Welcome, investor</div><h2 id="howto-title">How to play For Lease</h2>
      <p class="lede">The old parish hall at Vine and 18th is for lease. Five people will pitch what it should become, and you have <b>$1,000</b> to split across as many of their ideas as you like. Finish with the most money by reading the neighborhood like a geographer. <span class="howto-unit">AP Human Geography, Unit 3, Topic 3.2: Cultural Landscapes</span></p></div></div>
    <ol class="howto-steps">
      <li><b>Read the neighborhood.</b> A local historian shows you Eastgate first. Its clues decide which pitches fit.</li>
      <li><b>Meet the pitcher.</b> See who they are and what they want to build.</li>
      <li><b>Hear the pitch.</b> Watch the exhibits and take notes on your worksheet: the promise, what fits the neighborhood's cultural landscape, and any red flags.</li>
      <li><b>Question the promoter.</b> The class chooses questions from the list. Read the answers carefully.</li>
      <li><b>Make your offer.</b> Invest anywhere from $0 to everything you have left. It's final, and you won't hear the next pitch first.</li>
      <li><b>Spend it all.</b> Money you still have after the last pitch is worth nothing.</li>
      <li><b>Five years later.</b> See what each idea would have done to the block if it had opened in the hall, and what your money became.</li>
    </ol>
    <div class="howto-tip"><b>Think like a geographer:</b> the best investment fits the people who already live here. Check every pitch against the briefing: the layers on the building, the names people use, who feels safe where, and who would actually walk in the door.</div>
    <div class="howto-foot"><span>Absent? Choose <b>Catch-up</b> to play on your own.</span><button class="btn primary big" data-act="close-howto">Let's go!</button></div>
  </div>`;
  app.append(d);
  const close = () => { d.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-act=close-howto]')) close(); });
  document.addEventListener('keydown', onKey);
  d.querySelector('[data-act=close-howto]').focus({ preventScroll: true });
  d.querySelector('.howto').scrollTop = 0;
}

// ---------- the run ----------
function play(mode) {
  let run = getRun(mode);
  if (!run) { run = newRun(mode); saveRun(run); }
  if (run.step === 'done') return closed(run);
  const go = (step) => { run.step = step; saveRun(run); play(mode); };
  if (run.step === 'welcome') return welcome(run, go);
  if (run.step === 'briefing' || run.step === 'briefingPlay') return (run.step === 'briefing' ? briefingCard : briefingPlay)(run, go);
  const pid = run.order[run.i];
  const pitch = C.pitches[pid];
  const chips = `<span class="chip">Pitch <b>${run.i + 1}</b> of ${run.order.length}</span>${mode === 'solo' ? `<span class="chip">Balance <b>${money(START - spent(run))}</b></span>` : ''}`;
  ({ intro, pitch: pitchStep, questions, decide })[run.step === 'pitch' ? 'pitch' : run.step](run, pid, pitch, chips, go);
}

// ---------- welcome: what students do and what they're learning (first screen of a game) ----------
const TERMS = [
  ['Cultural landscape', 'the visible mark people leave on a place: buildings, signs, languages, businesses'],
  ['Sequent occupancy', 'different groups leave layers on the same place over time'],
  ['Charter group', 'the first group to settle a place and shape it'],
  ['Ethnic enclave', 'a neighborhood where one group clusters, with its own shops, churches and job networks'],
  ['Neolocalism', 'businesses that build their identity on a place\'s real history'],
  ['Gendered space', 'a place shaped by who is expected, welcome or safe there'],
  ['Reactions to new residents', 'how longtime residents respond when newcomers change a neighborhood'],
];
function welcome(run, go) {
  const L = setScene(`${topbar('<span class="chip">Before you start</span>')}
    <div class="welcome panel">
      <div class="w-col">
        <h2>Welcome to pitch night</h2>
        <p class="w-lede">The old parish hall at Vine and 18th has been empty since 2019. Five people want to lease it, and each idea would change the neighborhood in a different way. You're not picking who gets the lease. You're an investor with <b>$1,000</b>: put money behind any of the ideas you think would succeed here, as many as you want.</p>
        <ol class="w-steps">
          <li><b>Read the neighborhood.</b> Dolores Vega from the historical society walks you through Eastgate. Write her clues on your worksheet.</li>
          <li><b>Hear five pitches.</b> Watch the exhibits and listen for what fits the neighborhood and what doesn't.</li>
          <li><b>Ask, then invest.</b> Choose questions, then invest after each pitch. It's final, and you won't hear the next pitch first. Spend all $1,000.</li>
          <li><b>Five years later.</b> The hall can only hold one idea, so you'll see five possible futures: what each idea would have done to the block. Ideas that fit Eastgate's cultural landscape earn the most.</li>
        </ol>
        <div class="w-go"><button class="btn primary big" data-act="go">Meet the neighborhood</button></div>
      </div>
      <div class="w-col w-learn">
        <div class="w-unit">AP Human Geography <span>Unit 3, Topic 3.2: Cultural Landscapes</span></div>
        <p>Every investment is a bet on the next layer of Eastgate's cultural landscape. To pick winners, use these ideas:</p>
        <ul class="w-terms">${TERMS.map(([t, d]) => `<li><b>${esc(t)}:</b> ${esc(d)}</li>`).join('')}</ul>
        <p class="w-goal">Invest like a geographer: the money follows the evidence, not the best salesperson.</p>
      </div>
    </div>`, { spot: '50%' });
  L.querySelector('[data-act=go]').addEventListener('click', () => go('briefing'));
}

// ---------- the neighborhood briefing (before pitch 1) ----------
async function briefingCard(run, go) {
  const B = C.briefing;
  const L = setScene(`${topbar('<span class="chip">Before the pitches</span>')}
    <div class="intro">
      <div class="door"></div>
      <div class="card panel">
        <div class="kicker">Read the neighborhood first</div>
        <div class="year word stamp-year">Eastgate</div>
        <div class="place">${esc(B.place)}</div>
        <h2 class="who">${esc(B.speaker)}</h2>
        <div class="role">${esc(B.role)}</div>
        <div class="tagline">&ldquo;Take notes, because the clues are in what you hear.&rdquo;</div>
        <dl class="prospectus">
          <dt>The building</dt><dd>An 1893 church and its parish hall, empty since 2019</dd>
          <dt>The question</dt><dd>Five people want to lease it. Which ideas would succeed in Eastgate?</dd>
          <dt>Your job</dt><dd>Spot the clues in the cultural landscape before you invest</dd>
        </dl>
        <div class="go"><button class="btn ghost" data-act="skip">Skip the briefing</button> <button class="btn primary big" data-act="go">Hear the briefing &#9654;</button></div>
      </div>
    </div>`, { spot: '22%' });
  const actor = await makeActor('briefing');
  actor.classList.add('offstage');
  actor.style.left = '6%';
  L.querySelector('.intro').append(actor);
  requestAnimationFrame(() => requestAnimationFrame(() => actor.classList.remove('offstage')));
  stopCurrent = () => actor.stop();
  L.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'go') go('briefingPlay');
    if (a === 'skip') go('intro');
  });
}

async function briefingPlay(run, go) {
  const L = setScene(`${topbar('<span class="chip"><b>Briefing</b> · Welcome to Eastgate</span>')}<div class="stage" style="position:absolute;inset:0"></div>
    <div class="podium"><div class="podium-top"></div><div class="podium-face"><span class="podium-name">Eastgate Historical Society</span></div></div>`, { spot: '22%', sign: false, gobo: 'left' });
  const player = await playPitch(L.querySelector('.stage'), {
    pid: 'briefing', pitch: C.briefing, paras: C.scripts.briefing.scripts.short, cut: 'short', music: settings().music, onDone: () => go('intro'),
  });
  stopCurrent = player.stop;
}

async function intro(run, pid, p, chips, go) {
  const L = setScene(`${topbar(chips)}
    <div class="intro">
      <div class="door"></div>
      <div class="card panel">
        <div class="card-logo">${(await logoFor(pid))?.mark || ''}</div>
        <div class="kicker">Next up at the podium</div>
        <div class="year stamp-year ${/^\d+$/.test(p.year) ? '' : 'word'}">${esc(p.year)}</div>
        <div class="place">${esc(p.place)}</div>
        <h2 class="who">${esc(p.speaker)}</h2>
        <div class="role">${esc(p.role)}</div>
        <div class="tagline">&ldquo;${esc(p.tagline)}&rdquo;</div>
        <div class="seeking">Seeking: <b>${esc(p.seeking)}</b></div>
        <dl class="prospectus">
          <dt>You'd be buying</dt><dd>${esc(p.prospectus.buying)}</dd>
          <dt>How it makes money</dt><dd>${esc(p.prospectus.earns)}</dd>
          <dt>The promise</dt><dd>${esc(p.prospectus.promise)}</dd>
        </dl>
        <div class="go"><button class="btn primary big" data-act="go">Hear the pitch &#9654;</button></div>
      </div>
    </div>`, { spot: '22%' });
  const actor = await makeActor(pid);
  actor.classList.add('offstage');
  actor.style.left = '6%';
  L.querySelector('.intro').append(actor);
  requestAnimationFrame(() => requestAnimationFrame(() => actor.classList.remove('offstage')));
  stopCurrent = () => actor.stop();
  L.querySelector('[data-act=go]').addEventListener('click', () => go('pitch'));
}

async function pitchStep(run, pid, p, chips, go) {
  const lg = await logoFor(pid);
  const L = setScene(`${topbar(`${chips}<span class="chip"><b>${esc(p.year)}</b> · ${esc(p.title)}</span>`)}<div class="stage" style="position:absolute;inset:0"></div>
    <div class="podium"><div class="podium-top"></div><div class="podium-face">${lg?.mark || `<span class="podium-name">${esc(p.title)}</span>`}</div></div>`, { spot: '22%', sign: false, gobo: 'left' });
  const player = await playPitch(L.querySelector('.stage'), {
    pid, pitch: p, paras: C.scripts[pid].scripts.short, cut: 'short', music: settings().music, onDone: () => go('questions'),
  });
  stopCurrent = player.stop;
}

async function questions(run, pid, p, chips, go) {
  const limit = settings().qLimit;
  const qs = C.faq[pid] || [];
  const asked = run.asked[pid] || [];
  const L = setScene(`${topbar(chips, `${reviewBtn(pid)}<button class="btn small ghost" data-act="replay">&#8634; Hear the pitch again</button>`)}
    <div class="qa">
      <div class="head"><div class="qa-title"><div class="qa-icon">${(await logoFor(pid))?.icon || ''}</div><div><div class="kicker">Your questions</div><h2>${run.mode === 'class' ? `Choose ${limit === 1 ? 'one question' : `${limit} questions`} for ${esc(p.speaker.split(' ').slice(-1)[0])}` : `Ask ${esc(p.speaker)} ${limit === 1 ? 'one question' : `${limit} questions`}`}</h2></div></div>
        <div class="count"></div></div>
      <div class="qlist"></div>
      <div class="foot"><button class="btn primary big" data-act="next">Decision time &rarr;</button></div>
    </div>`, { spot: '14%', sign: false, gobo: 'qa' });
  const actor = await makeActor(pid);
  L.querySelector('.qa').prepend(actor);
  const list = L.querySelector('.qlist');
  let stopFlap = null, typing = null;
  const draw = () => {
    const used = (run.asked[pid] || []).length;
    L.querySelector('.count').textContent = `Asked: ${used} of ${limit}`;
    list.innerHTML = qs.map((q, i) => {
      const was = (run.asked[pid] || []).includes(i);
      return `<button class="qbtn ${was ? 'asked' : ''} ${!was && used >= limit ? 'spent' : ''}" data-q="${i}" ${!was && used >= limit ? 'disabled' : ''}><span class="n">${i + 1}</span><span>${esc(q.q)}</span></button>`;
    }).join('');
  };
  const closeBubble = () => { clearInterval(typing); stopFlap?.(); stopFlap = null; L.querySelector('.bubble')?.remove(); list.style.visibility = ''; };
  const answer = (i) => {
    closeBubble();
    const q = qs[i];
    const b = document.createElement('div');
    b.className = 'bubble';
    b.innerHTML = `<div class="asked-q">&ldquo;${esc(q.q)}&rdquo;</div><div class="txt"></div><div class="back"><button class="btn small" data-act="back">Back to the questions</button></div>`;
    L.querySelector('.qa').append(b);
    list.style.visibility = 'hidden';
    const txt = b.querySelector('.txt');
    let n = 0;
    stopFlap = flap(actor);
    const finish = () => { clearInterval(typing); txt.textContent = q.a; stopFlap?.(); stopFlap = null; };
    typing = setInterval(() => {
      n += 2;
      txt.innerHTML = esc(q.a.slice(0, n)) + '<span class="caret">&nbsp;</span>';
      if (n >= q.a.length) finish();
    }, 45);
    b.addEventListener('click', (e) => { if (!e.target.closest('[data-act]')) finish(); });
  };
  draw();
  L.addEventListener('click', (e) => {
    const qb = e.target.closest('[data-q]');
    if (qb && !qb.disabled) {
      const i = +qb.dataset.q;
      run.asked[pid] = run.asked[pid] || [];
      if (!run.asked[pid].includes(i)) { run.asked[pid].push(i); saveRun(run); }
      draw();
      answer(i);
      return;
    }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'back') closeBubble();
    if (a === 'replay') go('pitch');
    if (a === 'next') go('decide');
  });
  stopCurrent = () => { closeBubble(); actor.stop(); };
  if (!asked.length) actor.setMouth('closed');
}

function decide(run, pid, p, chips, go) {
  const last = run.i === run.order.length - 1;
  const next = () => {
    if (last) { run.step = 'done'; saveRun(run); play(run.mode); return; }
    run.i += 1; go('intro');
  };
  if (run.mode === 'class') {
    const secs = settings().timer;
    const L = setScene(`${topbar(chips, reviewBtn(pid))}
      <div class="decide"><div class="panel">
        ${last ? '<div class="final-banner">Final pitch</div>' : '<div class="kicker">Decision time</div>'}
        <h2>${last ? 'Everything you have left goes to ' + esc(p.speaker) : 'Investors, make your offer to ' + esc(p.speaker)}</h2>
        <ul class="rules">
          ${last ? '<li>Unspent money is worth nothing, so your whole remaining balance goes into this pitch.</li><li>Write it on your worksheet. Your five investments must add up to <b>$1,000</b>.</li>'
                 : `<li>Write your investment in <b>${esc(p.title)}</b> on your worksheet, from $0 up to everything you have left.</li><li>Subtract it from your balance. This choice is <b>final</b>.</li><li>You won't hear the next pitch first. Is this one good enough, or is something better coming?</li>`}
        </ul>
        ${secs ? `<div class="timer" aria-live="off">${secs}</div><div style="display:flex;gap:1cqw;justify-content:center"><button class="btn" data-act="timer">Start the clock</button><button class="btn primary" data-act="next">${last ? 'End pitch night' : 'Next entrepreneur &rarr;'}</button></div>`
               : `<button class="btn primary big" data-act="next">${last ? 'End pitch night' : 'Next entrepreneur &rarr;'}</button>`}
      </div></div>`, { spot: '50%' });
    let left = secs, id = null;
    const timer = L.querySelector('.timer');
    L.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'next') next();
      if (a === 'timer') {
        if (id) { clearInterval(id); id = null; e.target.textContent = 'Resume the clock'; return; }
        e.target.textContent = 'Pause the clock';
        id = setInterval(() => {
          left -= 1; timer.textContent = Math.max(0, left);
          if (left <= 0) { clearInterval(id); id = null; timer.classList.add('done'); timer.textContent = "Time's up"; }
        }, 1000);
      }
    });
    stopCurrent = () => clearInterval(id);
    return;
  }
  // solo: invest on screen
  const bal = START - spent(run);
  const L = setScene(`${topbar(chips, reviewBtn(pid))}
    <div class="decide"><div class="panel">
      ${last ? '<div class="final-banner">Final pitch</div>' : '<div class="kicker">Decision time</div>'}
      <h2>${last ? 'Your remaining money goes to ' + esc(p.speaker) : 'How much will you invest in ' + esc(p.title) + '?'}</h2>
      <div class="ledger">
        <div class="cell"><div class="k">You have</div><div class="v">${money(bal)}</div></div>
        <div class="cell"><div class="k">Pitches left after this</div><div class="v">${run.order.length - run.i - 1}</div></div>
      </div>
      ${last ? `<p>Money you don't spend is worth nothing, so all <b>${money(bal)}</b> goes into ${esc(p.title)}. Write it on your worksheet too.</p>
                <button class="btn primary big" data-act="confirm">I'm in for ${money(bal)}</button>`
             : `<div class="offer"><label for="amt">I'm in for</label><span class="money">$<input id="amt" type="number" inputmode="numeric" min="0" max="${bal}" step="1" value="0"></span></div>
                <input class="slider" type="range" min="0" max="${bal}" step="10" value="0" aria-label="Investment amount">
                <div class="err"></div>
                <div style="display:flex;gap:1cqw;justify-content:center;margin-top:.6cqw"><button class="btn" data-act="out">I'm out ($0)</button><button class="btn primary big" data-act="confirm">Make the offer</button></div>
                <p style="font-size:1.2cqw;color:var(--muted)">Whole dollars. Once you confirm, it's final. Write it on your worksheet.</p>`}
    </div></div>`, { spot: '50%' });
  const inp = L.querySelector('#amt'), sl = L.querySelector('.slider'), err = L.querySelector('.err');
  inp?.addEventListener('input', () => { sl.value = inp.value; err.textContent = ''; });
  sl?.addEventListener('input', () => { inp.value = sl.value; err.textContent = ''; });
  const commit = async (amt) => {
    if (!await ask(`Invest ${money(amt)} in ${p.title}? This is final.`, { ok: `Invest ${money(amt)}` })) return;
    run.invest[pid] = amt; saveRun(run); next();
  };
  L.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'out') commit(0);
    if (a === 'confirm') {
      if (last) return commit(bal);
      const v = Number(inp.value);
      if (!Number.isInteger(v) || v < 0) { err.textContent = 'Enter a whole number of dollars.'; return; }
      if (v > bal) { err.textContent = `You only have ${money(bal)} left.`; return; }
      commit(v);
    }
  });
  inp?.focus();
}

function closed(run) {
  if (run.mode === 'class') {
    setScene(`${topbar()}
      <div class="closed"><div class="panel">
        <div class="kicker">Pitch night is over</div>
        <h2>Check your worksheet</h2>
        <p>You heard all five pitches. Your five investments should add up to exactly <b>$1,000</b>.</p>
        <p>The hall could only become one thing, so Five Years Later shows five possible futures: what each idea would have done to Vine and 18th if it had opened there, and what your money in it became.</p>
        <div style="margin-top:1.6cqw;display:flex;gap:1cqw;justify-content:center"><button class="btn primary big" data-go="#/reveal/class">Five years later &#128274;</button></div>
      </div></div>`, { spot: '50%' });
    return;
  }
  const rows = run.order.map((id) => `<tr><td>${esc(C.pitches[id].title)} <span style="color:var(--muted)">(${esc(C.pitches[id].year)})</span></td><td class="num">${money(run.invest[id] || 0)}</td></tr>`).join('');
  setScene(`${topbar()}
    <div class="closed"><div class="panel">
      <div class="kicker">Pitch night is over</div>
      <h2>Your investments</h2>
      <table class="summary"><tbody>${rows}</tbody><tfoot><tr><td>Total</td><td class="num">${money(spent(run))}</td></tr></tfoot></table>
      <p>Copy these onto your worksheet if you haven't. Then ask your teacher to unlock <b>Five Years Later</b>.</p>
      <div style="display:flex;gap:1cqw;justify-content:center"><button class="btn primary big" data-go="#/reveal/solo">Five years later &#128274;</button>
      <button class="btn ghost" data-act="again">Start catch-up over</button></div>
    </div></div>`, { spot: '50%' }).addEventListener('click', async (e) => {
    if (e.target.closest('[data-act=again]') && await ask('Erase these investments and start over?', { ok: 'Start over' })) { store.local.del('eastgate.run.solo'); location.hash = '#/'; }
  });
}

// ---------- password gate ----------
async function gate(title, then) {
  const T = await unlocked();
  if (T) return then(T);
  const L = setScene(`${topbar()}
    <div class="lock"><form class="panel">
      <div class="kicker">Teacher only</div><h2 style="font-family:var(--serif);font-size:2.6cqw;margin:.4cqw 0">${esc(title)}</h2>
      <input type="password" autocomplete="current-password" placeholder="Teacher password" aria-label="Teacher password">
      <div class="err"></div>
      <button class="btn primary big" type="submit">Unlock</button>
    </form></div>`, { spot: '50%' });
  const f = L.querySelector('form'), inp = f.querySelector('input'), err = f.querySelector('.err');
  inp.focus();
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = 'Checking...';
    const B = await unlock(inp.value);
    if (!B) { err.textContent = 'That password did not work.'; inp.select(); return; }
    then(B);
  });
}

// ---------- Five Years Later ----------
function reveal(mode, T) {
  const run = getRun(mode);
  if (mode === 'solo' && (!run || run.step !== 'done')) {
    setScene(`${topbar()}<div class="closed"><div class="panel"><h2>No finished catch-up game on this device</h2><p>Play the briefing and all five pitches in catch-up mode first.</p></div></div>`);
    return;
  }
  const order = run?.order || periodOrder();
  const n = order.length;
  // steps: 0 intro, then for each venture a newspaper (odd) and "why it mattered" (even),
  // then the big picture, then the final tally
  const LAST = 2 * n + 2;
  let k = Math.min(store.session.get(`eastgate.reveal.${mode}`, 0), LAST);
  const total = (upto) => order.slice(0, upto).reduce((a, id) => a + worthOf(run?.invest[id], T.pitches[id]), 0);
  const artFor = (id) => artHTML({ img: T.pitches[id].img, art: T.pitches[id].art, title: C.pitches[id].title });
  const list = (xs) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

  const draw = async () => {
    store.session.set(`eastgate.reveal.${mode}`, k);
    const label = k === 0 ? 'Open the first paper' : k <= 2 * n && k % 2 === 1 ? 'Why it mattered &rarr;'
      : k < 2 * n ? 'Next paper &rarr;' : k === 2 * n ? 'Big picture &rarr;' : 'The final tally';
    const nav = `<div class="nav">${k > 0 ? '<button class="btn ghost" data-act="prev">&larr; Back</button>' : ''}${k < LAST ? `<button class="btn primary big" data-act="next">${label}</button>` : ''}</div>`;
    const shown = Math.min(Math.floor((k + 1) / 2), n);
    const running = mode === 'solo' ? `<span class="chip">Total worth so far <b>${signed(total(shown))}</b></span>` : '';
    let body;
    if (k === 0) {
      body = `<div class="curtain"><div class="panel"><div class="kicker">Five years later...</div><h2 style="font-size:4.4cqw">What Happened at Vine &amp; 18th?</h2>
        <p style="font-size:1.8cqw">Five ideas, five possible futures. Each front page shows what Vine and 18th would look like five years after that idea opened in the hall, and what it did to Eastgate's cultural landscape. ${mode === 'class' ? 'Each front page shows how much the venture <b>made per $1</b>. On your tracker, multiply: <b>Worth at end = what you invested &times; made per $1</b>.' : "Let's see what your money became."}</p></div></div>`;
    } else if (k <= 2 * n && k % 2 === 1) {
      const id = order[(k - 1) / 2], c = T.pitches[id], p = C.pitches[id];
      const inv = run?.invest[id];
      const you = mode === 'solo' ? `<div class="you">You invested ${money(inv || 0)}: worth at end <b>${signed(worthOf(inv, c))}</b></div>` : '';
      body = `<div class="paper">
        <div class="mast"><div class="name">${esc(c.paper)}</div><div class="dateline"><span>Vine &amp; 18th</span><span>${esc(c.date)}</span><span>Free &middot; Gratis</span></div></div>
        <h3>${esc(c.headline)}</h3><div class="subhead">${esc(c.subhead)}</div>
        <div class="cols"><figure class="reveal-art">${await artFor(id)}</figure>${c.outcome.map((o) => `<p>${esc(o)}</p>`).join('')}<p class="impact">${esc(c.impact)}</p></div>
      </div>
      <div class="payout-stamp ${profitPer(c) > 0 ? 'win' : ''}"><div class="k">${esc(p.title)}<br>made per $1</div><div class="v">${perOne(c)}</div>
        <div class="eg">$100 &times; ${String(profitPer(c)).replace('-', '&minus;')} = ${signed(100 * profitPer(c))}</div>${you}</div>`;
    } else if (k <= 2 * n) {
      const id = order[k / 2 - 1], c = T.pitches[id], p = C.pitches[id];
      body = `<div class="why panel">
        <div class="why-head"><div><div class="kicker">Why it mattered</div><h2>${esc(p.title)} <span class="yr">${p.year}</span></h2></div><div class="why-art">${await artFor(id)}</div></div>
        <div class="why-grid">
          <section><h3>Key concepts</h3>${list(c.concepts || [])}</section>
          <section><h3>What it did to the block</h3>${list(c.impacts || [])}</section>
        </div>
        <div class="why-connect"><b>Connect it:</b> ${esc(c.connection || '')}</div>
      </div>`;
    } else if (k === 2 * n + 1) {
      const B = T.bigPicture;
      body = `<div class="why panel big">
        <div class="kicker">The big picture</div><h2>${esc(B.title || 'The big picture')}</h2>
        <ol class="timeline">${B.timeline.map(([y, t, d]) => `<li><div class="ty">${esc(y)}</div><div class="tt">${esc(t)}</div><div class="td">${esc(d)}</div></li>`).join('')}</ol>
        <div class="why-grid">
          <section><h3>What it all added up to</h3>${list(B.points)}</section>
          <section class="lowell"><h3>Your turn</h3><p>${esc(B.lowell)}</p></section>
        </div>
      </div>`;
    } else {
      const rows = order.map((id) => {
        const c = T.pitches[id], inv = run?.invest[id] || 0;
        return `<tr><td>${esc(C.pitches[id].title)}</td>${mode === 'solo' ? `<td class="num">${money(inv)}</td>` : ''}<td class="num"><b>${perOne(c)}</b></td>${mode === 'solo' ? `<td class="num">${signed(worthOf(inv, c))}</td>` : ''}</tr>`;
      }).join('');
      body = `<div class="curtain"><div class="panel" style="width:66%">
        <div class="kicker">The final tally</div><h2>${mode === 'solo' ? `Your total worth: ${signed(total(n))}` : 'Add up your five returns'}</h2>
        <table class="summary"><thead><tr><th>Venture</th>${mode === 'solo' ? '<th class="num">B &middot; You invested</th>' : ''}<th class="num">C &middot; Made per $1</th>${mode === 'solo' ? '<th class="num">D &middot; Worth at end</th>' : ''}</tr></thead><tbody>${rows}</tbody>
        ${mode === 'solo' ? `<tfoot><tr><td>Total worth at the end</td><td class="num">${money(spent(run))}</td><td></td><td class="num">${signed(total(n))}</td></tr></tfoot>` : ''}</table>
        <p style="font-size:1.5cqw"><b>Worth at end (D) = what you invested (B) &times; made per $1 (C).</b> Then add up D for all five pitches.${mode === 'class' ? '<br>Example: $300 &times; 3 = $900. For the bust: $300 &times; &minus;1 = &minus;$300.' : ''}</p>
      </div></div>`;
    }
    const L = setScene(`${topbar(running, mode === 'class' ? '<button class="btn small ghost" data-go="#/teacher">Teacher tools</button>' : '')}<div class="reveal">${body}${nav}</div>`, { spot: '50%', sign: false });
    L.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'next') { k += 1; draw(); }
      if (a === 'prev') { k -= 1; draw(); }
    });
  };
  draw();
}

// ---------- teacher tools ----------
function teacher(T, tab = store.session.get('eastgate.ttab', 'setup')) {
  const s = settings();
  const tabs = [['setup', 'Game setup'], ['reveal', 'Five Years Later'], ['calc', 'Calculator'], ['board', 'Leaderboard'], ['debrief', 'Debrief notes']];
  const L = setScene(`${topbar('', '<button class="btn small ghost" data-act="lock">Lock</button>')}
    <div class="teacher"><h2>Teacher tools</h2>
      <div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}">${n}</button>`).join('')}</div>
      <div class="tpane"></div></div>`, { spot: '50%', sign: false });
  const pane = L.querySelector('.tpane');
  L.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) { store.session.set('eastgate.ttab', b.dataset.tab); teacher(T, b.dataset.tab); }
  });
  L.querySelector('[data-act=lock]').addEventListener('click', () => { lock(); location.hash = '#/'; });
  const title = (id) => `${esc(C.pitches[id].title)} <span style="color:var(--muted)">(${esc(C.pitches[id].year)})</span>`;

  if (tab === 'setup') {
    const order = periodOrder(s);
    pane.innerHTML = `
      <div class="row"><label>Class period <select data-k="period">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option ${String(n) === s.period ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Questions per pitch <select data-k="qLimit">${[1, 2, 3, 6].map((n) => `<option ${n === s.qLimit ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Background music <select data-k="music">${MUSIC.map(([v, n]) => `<option value="${v}" ${v === s.music ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Decision clock <select data-k="timer">${[0, 30, 45, 60, 90, 120].map((n) => `<option value="${n}" ${n === s.timer ? 'selected' : ''}>${n ? n + ' seconds' : 'off'}</option>`).join('')}</select></label></div>
      <h3>Pitch order for period ${esc(s.period)}</h3>
      <ol class="order">${order.map((id, i) => `<li><span class="n">${i + 1}</span><span class="t">${title(id)}</span>
        <button class="btn small ghost" data-mv="${i},-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">&uarr;</button>
        <button class="btn small ghost" data-mv="${i},1" ${i === order.length - 1 ? 'disabled' : ''} aria-label="Move down">&darr;</button></li>`).join('')}</ol>
      <div class="row"><button class="btn small" data-act="shuffle">Shuffle again</button><span style="color:var(--muted)">Each period gets its own shuffled order, so classes can't pass along a pattern.</span></div>
      <h3>Class game</h3>
      <div class="row"><span>${getRun('class') ? `In progress: ${/^(welcome|briefing)/.test(getRun('class').step) ? 'welcome and briefing' : `pitch ${getRun('class').i + 1} of 5 (${esc(getRun('class').step)})`}` : 'Not started'}.</span>
        <button class="btn small" data-act="newclass">Start a fresh class game with these settings</button></div>
      <p style="color:var(--muted)">Settings are saved in this browser, so set them up on the projector computer. The class game picks up the order when it starts. Catch-up mode shuffles its own order.</p>`;
    pane.querySelectorAll('select').forEach((sel) => sel.addEventListener('change', () => {
      const n = settings();
      n[sel.dataset.k] = ['qLimit', 'timer', 'music'].includes(sel.dataset.k) ? Number(sel.value) : sel.value;
      saveSettings(n); teacher(T, 'setup');
    }));
    pane.addEventListener('click', async (e) => {
      const n = settings();
      const mv = e.target.closest('[data-mv]')?.dataset.mv;
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (mv) {
        const [i, d] = mv.split(',').map(Number);
        const o = [...periodOrder(n)];
        [o[i], o[i + d]] = [o[i + d], o[i]];
        n.orders[n.period] = o; saveSettings(n); teacher(T, 'setup');
      }
      if (a === 'shuffle') { n.orders[n.period] = shuffle(C.defaultOrder); saveSettings(n); teacher(T, 'setup'); }
            if (a === 'newclass' && await ask('Start a fresh class game? The current one will be cleared.', { ok: 'Start fresh' })) { saveRun(newRun('class')); toast('Fresh class game ready'); teacher(T, 'setup'); }
    });
  }

  if (tab === 'reveal') {
    const order = getRun('class')?.order || periodOrder(s);
    pane.innerHTML = `
      <p>Plays the Five Years Later front pages one at a time in the order the class heard the pitches, then a summary of every payout.</p>
      <div class="row"><button class="btn primary" data-act="rc">Start Five Years Later (class)</button>
        <button class="btn" data-act="rs">Catch-up results on this device</button></div>
      <h3>Payouts (game design, scored on how well each venture fits Eastgate)</h3>
      <table class="calc"><thead><tr><th>Venture</th><th>Made per $1</th><th>$1,000 invested: worth at end</th></tr></thead><tbody>
        ${order.map((id) => `<tr><td>${title(id)}</td><td class="num">${perOne(T.pitches[id])}</td><td class="num">${signed(worthOf(1000, T.pitches[id]))}</td></tr>`).join('')}</tbody></table>
      <h3>Math check</h3><ul class="note-list">${T.benchmarks.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
    pane.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'rc') { store.session.del('eastgate.reveal.class'); location.hash = '#/reveal/class'; }
      if (a === 'rs') { store.session.del('eastgate.reveal.solo'); location.hash = '#/reveal/solo'; }
    });
  }

  if (tab === 'calc') {
    const order = getRun('class')?.order || periodOrder(s);
    pane.innerHTML = `<p>Type a student's five investments (B) to check their tracker. D = B &times; C.</p>
      <table class="calc"><thead><tr><th>Venture</th><th>B &middot; Invested</th><th>C &middot; Made per $1</th><th>D &middot; Worth at end</th></tr></thead><tbody>
      ${order.map((id) => `<tr><td>${title(id)}</td><td><input type="number" min="0" step="1" data-id="${id}" value="0"></td><td class="num">${perOne(T.pitches[id])}</td><td class="num" data-out="${id}">$0</td></tr>`).join('')}
      </tbody><tfoot><tr><td><b>Total</b></td><td class="num" data-sum></td><td></td><td class="num" data-total style="color:var(--brass-2);font-weight:700"></td></tr></tfoot></table>
      <div class="err" data-warn></div>`;
    const upd = () => {
      let sum = 0, tot = 0;
      pane.querySelectorAll('input[data-id]').forEach((i) => {
        const v = Math.max(0, Number(i.value) || 0), w = worthOf(v, T.pitches[i.dataset.id]);
        sum += v; tot += w;
        pane.querySelector(`[data-out="${i.dataset.id}"]`).innerHTML = signed(w);
      });
      pane.querySelector('[data-sum]').textContent = money(sum);
      pane.querySelector('[data-total]').innerHTML = signed(tot);
      pane.querySelector('[data-warn]').textContent = sum === START ? '' : `These add up to ${money(sum)}, not $1,000. Check the worksheet.`;
    };
    pane.addEventListener('input', upd); upd();
  }

  if (tab === 'board') {
    const order = getRun('class')?.order || periodOrder(s);
    const key = `eastgate.board.${s.period}`;
    let rows = store.local.get(key, []);
    const worth = (r) => order.reduce((a, id) => a + worthOf(r[id], T.pitches[id]), 0);
    const draw = () => {
      const ranked = rows.map((r, i) => ({ r, i, w: worth(r) })).sort((a, b) => b.w - a.w);
      pane.innerHTML = `<p>Period ${esc(s.period)}. Type names and investments to rank the class (saved in this browser). The money winner is here; consider a Best Analyst award for the strongest notes too.</p>
        <table class="board"><thead><tr><th>#</th><th>Name</th>${order.map((id) => `<th>${esc(C.pitches[id].title.replace(/^The /, ''))}</th>`).join('')}<th>Total</th><th></th></tr></thead><tbody>
        ${ranked.map(({ r, i, w }, rank) => `<tr><td>${rank + 1}</td><td><input class="name" type="text" data-i="${i}" data-f="name" value="${esc(r.name || '')}"></td>
          ${order.map((id) => `<td><input type="number" min="0" data-i="${i}" data-f="${id}" value="${r[id] ?? ''}"></td>`).join('')}
          <td class="num"><b>${signed(w)}</b></td><td><button class="btn small ghost" data-del="${i}" aria-label="Remove">&times;</button></td></tr>`).join('')}
        </tbody></table>
        <div class="row"><button class="btn small" data-act="add">Add student</button><button class="btn small ghost" data-act="sort">Re-rank</button><button class="btn small ghost" data-act="clear">Clear period</button></div>`;
    };
    draw();
    pane.addEventListener('change', (e) => {
      const i = e.target.dataset.i;
      if (i == null) return;
      rows[i][e.target.dataset.f] = e.target.dataset.f === 'name' ? e.target.value : Number(e.target.value);
      store.local.set(key, rows);
      const cell = e.target.closest('tr').querySelector('td.num b');
      if (cell) cell.innerHTML = signed(worth(rows[i]));
    });
    pane.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act, d = e.target.closest('[data-del]')?.dataset.del;
      if (a === 'add') { rows.push({ name: '' }); store.local.set(key, rows); draw(); pane.querySelector('tbody tr:last-child input.name')?.focus(); }
      if (a === 'sort') draw();
      if (a === 'clear' && await ask(`Clear the period ${s.period} leaderboard?`, { ok: 'Clear it' })) { rows = []; store.local.set(key, rows); draw(); }
      if (d != null) { rows.splice(Number(d), 1); store.local.set(key, rows); draw(); }
    });
  }

  if (tab === 'debrief') {
    pane.innerHTML = `<h3>Debrief questions</h3><ul class="note-list">${T.debrief.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      ${C.defaultOrder.map((id) => {
        const t = T.pitches[id];
        return `<h3>${title(id)} · ${esc(C.pitches[id].speaker)} · made ${perOne(t)} per $1</h3>
          <div><b>Clues students can catch</b></div><ul class="note-list">${t.clues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          <div><b>What each answer gives away</b></div>
          ${(C.faq[id] || []).map((q, i) => `<div class="faqnote"><div class="q">${i + 1}. ${esc(q.q)}</div><div class="n">${esc(t.faqNotes[i] || '')}</div></div>`).join('')}`;
      }).join('')}`;
  }
}

// ---------- router ----------
async function route() {
  const h = location.hash.replace(/^#\/?/, '');
  if (h === 'play/class') return play('class');
  if (h === 'play/solo') return play('solo');
  if (h === 'teacher') return gate('Teacher tools', (T) => teacher(T));
  if (h === 'reveal/class') return gate('Five Years Later', (T) => reveal('class', T));
  if (h === 'reveal/solo') return gate('Five Years Later', (T) => reveal('solo', T));
  return lobby();
}

async function boot() {
  const get = (f) => fetch(`content/${f}`).then((r) => r.json());
  const [p, scripts, faq] = await Promise.all([get('pitches.json'), get('scripts.json'), get('faq.json')]);
  C = { ...p, scripts, faq };
  window.addEventListener('hashchange', route);
  route();
}
boot();
