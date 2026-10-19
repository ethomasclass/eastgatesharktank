// The pitch player: a promoter on the set, captions, exhibits on the easel, and a mouth that
// moves with the voice. With no audio file yet it runs on a simulated clock at speaking pace,
// so the whole game can be tried before the voices exist.
import { characterSVG } from './chars.js';
import { loadExhibits, exhibitCard } from './exhibits.js';

let spriteIndex = null;
async function sprites() {
  if (spriteIndex) return spriteIndex;
  try { spriteIndex = await (await fetch('content/sprites.json')).json(); } catch { spriteIndex = {}; }
  return spriteIndex;
}

/** A promoter figure. Uses Google Flow sprites when content/sprites.json lists them. */
export async function makeActor(pid) {
  const el = document.createElement('div');
  el.className = 'actor';
  el.dataset.mouth = 'closed';
  const idx = await sprites();
  const frames = idx[pid];
  if (frames && frames.closed) {
    const box = document.createElement('div');
    box.className = 'sprite';
    const imgs = {};
    for (const k of ['closed', 'mid', 'open', 'blink']) {
      if (!frames[k]) continue;
      const img = new Image();
      img.src = `assets/sprites/${pid}/${frames[k]}`;
      img.alt = '';
      box.append(img);
      imgs[k] = img;
    }
    const show = () => {
      const m = el.dataset.mouth;
      // a missing frame falls back to its neighbour: no "mid" means flap between closed and open
      const k = el.dataset.blink === '1' && m === 'closed' && imgs.blink ? 'blink'
        : imgs[m] ? m : m === 'mid' && imgs.open ? 'open' : 'closed';
      for (const [n, img] of Object.entries(imgs)) img.style.visibility = n === k ? 'visible' : 'hidden';
    };
    new MutationObserver(show).observe(el, { attributes: true, attributeFilter: ['data-mouth', 'data-blink'] });
    show();
    el.append(box);
  } else {
    el.innerHTML = characterSVG(pid);
  }
  const sh = document.createElement('div');
  sh.className = 'shadow';
  el.append(sh);

  let blinkTimer;
  const blink = () => {
    el.dataset.blink = '1';
    setTimeout(() => { el.dataset.blink = '0'; }, 130);
    blinkTimer = setTimeout(blink, 2200 + Math.random() * 3200);
  };
  blinkTimer = setTimeout(blink, 1500);
  el.stop = () => clearTimeout(blinkTimer);
  el.setMouth = (m) => { if (el.dataset.mouth !== m) el.dataset.mouth = m; };
  return el;
}

/** Silent "talking" for typed answers: flap the mouth while text appears. */
export function flap(actor) {
  let on = true, t = 0;
  const seq = ['mid', 'open', 'mid', 'closed', 'open', 'mid', 'closed'];
  const id = setInterval(() => { if (on) actor.setMouth(seq[t++ % seq.length]); }, 95);
  actor.classList.add('talking');
  return () => { on = false; clearInterval(id); actor.setMouth('closed'); actor.classList.remove('talking'); };
}

// The theme is decoded once and looped with Web Audio, which (unlike <audio loop>) has no gap at
// the loop point. Leading/trailing encoder silence is skipped via loopStart/loopEnd.
let themeBuffer;
async function themeLoop(volume) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (themeBuffer === undefined) {
      const r = await fetch('assets/audio/theme.mp3');
      themeBuffer = r.ok ? await ctx.decodeAudioData(await r.arrayBuffer()) : null;
    }
    if (!themeBuffer) { ctx.close(); return null; }
    const ch = themeBuffer.getChannelData(0);
    let a = 0, b = ch.length - 1;
    while (a < b && Math.abs(ch[a]) < 1e-3) a++;
    while (b > a && Math.abs(ch[b]) < 1e-3) b--;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    let src = null;
    return {
      play() {
        ctx.resume();
        if (src) return;
        src = ctx.createBufferSource();
        src.buffer = themeBuffer;
        src.loop = true;
        src.loopStart = a / themeBuffer.sampleRate;
        src.loopEnd = b / themeBuffer.sampleRate;
        src.connect(gain);
        src.start(0, src.loopStart);
      },
      pause() { ctx.suspend(); },
      stop() { try { src?.stop(); } catch { /* not started */ } ctx.close(); },
    };
  } catch { return null; }
}

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9'-]/g, '');

function simulate(paras) {
  const words = [];
  let t = 0.6;
  paras.forEach((p, pi) => {
    for (const w of p.split(/\s+/).filter(Boolean)) {
      const d = 0.16 + 0.045 * w.replace(/[^A-Za-z]/g, '').length;
      words.push({ w, s: t, e: t + d, p: pi });
      t += d + 0.06;
      if (/[.?!]["']?$/.test(w)) t += 0.35;
      else if (/[,;:]$/.test(w)) t += 0.15;
    }
    t += 0.5;
  });
  return { words, duration: t };
}

/** Break the words into caption chunks: sentences, split again if long. */
function chunk(words) {
  const out = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(i);
    const end = /[.?!]["']?$/.test(w.w) || (cur.length >= 9 && /[,;:]$/.test(w.w)) || cur.length >= 16;
    if (end || i === words.length - 1) { out.push(cur); cur = []; }
  });
  return out;
}

function cueTimes(words, exhibits) {
  const seq = words.map((w) => norm(w.w));
  return exhibits.map((ex) => {
    const cue = ex.cue.split(/\s+/).map(norm);
    for (let i = 0; i + cue.length <= seq.length; i++) {
      if (cue.every((c, j) => seq[i + j] === c || seq[i + j].startsWith(c))) return { ...ex, t: words[i].s };
    }
    return null;
  }).filter(Boolean).sort((a, b) => a.t - b.t);
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const ICON = {
  play: '<svg viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9 Z"/></svg>',
  pause: '<svg viewBox="0 0 10 10"><path d="M2 1h2v8H2zM6 1h2v8H6z"/></svg>',
  restart: '<svg viewBox="0 0 10 10"><path d="M1 1h1.6v8H1zM9 1 3.4 5 9 9z"/></svg>',
  cc: '<svg viewBox="0 0 10 10"><path d="M1 2h8v6H1z" fill="none" stroke="currentColor" stroke-width="1"/><path d="M2.6 4h2v.8h-2zM5.4 4h2v.8h-2zM2.6 5.4h4.8v.8H2.6z"/></svg>',
};

/**
 * Plays one pitch inside `root`. Resolves nothing; calls onDone() when the pitch ends or is skipped.
 */
export async function playPitch(root, { pid, pitch, paras, cut, music = 0, onDone }) {
  const base = `assets/audio/${pid}-${cut}`;
  let timing = null;
  try {
    const r = await fetch(`${base}.words.json`);
    if (r.ok) timing = await r.json();
  } catch { /* no voice yet */ }
  const hasAudio = !!timing;
  if (!timing) timing = simulate(paras);
  const words = timing.words;
  const duration = timing.duration || words[words.length - 1].e;
  const chunks = chunk(words);
  const cues = cueTimes(words, await loadExhibits(pid));

  root.innerHTML = `
    <div class="easel"></div>
    <div class="captions"><div class="line"></div></div>
    <div class="transport">
      <button class="icon" data-act="restart" aria-label="Restart">${ICON.restart}</button>
      <button class="icon" data-act="toggle" aria-label="Play">${ICON.play}</button>
      <div class="time">0:00 / ${fmt(duration)}</div>
      <div class="bar" title="Jump"><i></i></div>
      <button class="icon" data-act="cc" aria-label="Captions on or off" title="Captions">${ICON.cc}</button>
      <button class="btn small ghost" data-act="done">End pitch &rarr;</button>
    </div>
    <button class="btn primary big bigplay" data-act="toggle">&#9654;&nbsp; Play the pitch</button>`;
  const actor = await makeActor(pid);
  root.prepend(actor);
  const $ = (s) => root.querySelector(s);
  const line = $('.captions .line');
  const easel = $('.easel');
  const bar = $('.bar i');
  const time = $('.time');
  const toggleBtn = $('[data-act=toggle].icon');

  // clock: the audio element when there is audio, otherwise a simulated one
  let audio = null, analyser = null, buf = null, ctx = null;
  let simT = 0, simStart = 0, playing = false, finished = false;
  if (hasAudio) {
    audio = new Audio(`${base}.mp3`);
    audio.preload = 'auto';
    audio.addEventListener('ended', () => end());
  }
  // optional background theme, looped gaplessly and quietly under the pitch
  let bgm = null, stopped = false;
  if (music > 0) themeLoop(music).then((b) => { if (stopped) b?.stop(); else { bgm = b; if (playing) b?.play(); } });
  const now = () => (audio ? audio.currentTime : playing ? simT + (performance.now() - simStart) / 1000 : simT);

  function setupAnalyser() {
    if (!audio || analyser) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      buf = new Float32Array(analyser.fftSize);
      src.connect(analyser);
      analyser.connect(ctx.destination);
    } catch { analyser = null; }
  }

  function play() {
    if (finished) return;
    $('.bigplay')?.remove();
    playing = true;
    toggleBtn.innerHTML = ICON.pause;
    toggleBtn.setAttribute('aria-label', 'Pause');
    actor.classList.add('talking');
    if (audio) { setupAnalyser(); ctx?.resume(); audio.play(); } else simStart = performance.now();
    bgm?.play();
  }
  function pause() {
    if (!playing) return;
    if (audio) audio.pause(); else simT = now();
    bgm?.pause();
    playing = false;
    toggleBtn.innerHTML = ICON.play;
    toggleBtn.setAttribute('aria-label', 'Play');
    actor.classList.remove('talking');
    actor.setMouth('closed');
  }
  function seek(t) {
    t = Math.max(0, Math.min(duration, t));
    if (audio) audio.currentTime = t; else { simT = t; simStart = performance.now(); }
    lastChunk = -1; lastCue = -2;
  }
  function end() {
    if (finished) return;
    pause();
    finished = true;
    cleanup();
    onDone();
  }

  let lastChunk = -1, lastCue = -2, raf = 0, level = 0, lastMouth = 0;
  function frame() {
    const t = now();
    if (!audio && playing && t >= duration) { simT = duration; end(); return; }
    bar.style.width = `${(100 * t) / duration}%`;
    time.textContent = `${fmt(t)} / ${fmt(duration)}`;

    // captions
    let ci = chunks.findIndex((c) => words[c[c.length - 1]].e + 0.25 >= t);
    if (ci < 0) ci = chunks.length - 1;
    if (ci !== lastChunk) {
      line.innerHTML = chunks[ci].map((i) => `<span class="w" data-i="${i}">${words[i].w}</span>`).join(' ');
      lastChunk = ci;
    }
    for (const sp of line.children) sp.classList.toggle('said', words[+sp.dataset.i].s <= t);

    // exhibits
    let k = -1;
    cues.forEach((c, i) => { if (c.t <= t) k = i; });
    if (k !== lastCue) {
      easel.innerHTML = k >= 0 ? exhibitCard(cues[k], k, cues.length) : '';
      lastCue = k;
    }

    // mouth
    if (playing) {
      if (analyser) {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        level = level * 0.5 + rms * 0.5;
        // thresholds from the voiced clips: roughly a third of the time each closed, mid and open;
        // hold each shape at least 70 ms so the mouth doesn't flicker
        const want = level > 0.13 ? 'open' : level > 0.045 ? 'mid' : 'closed';
        const nowMs = performance.now();
        if (want !== actor.dataset.mouth && nowMs - lastMouth > 70) { actor.setMouth(want); lastMouth = nowMs; }
      } else {
        const w = words.find((x) => x.s <= t && t <= x.e);
        actor.setMouth(w ? ['mid', 'open', 'open', 'mid', 'closed'][Math.floor((t - w.s) / 0.085) % 5] : 'closed');
      }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  root.addEventListener('click', onClick);
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (b) {
      const act = b.dataset.act;
      if (act === 'toggle') playing ? pause() : play();
      else if (act === 'restart') { seek(0); play(); }
      else if (act === 'cc') root.querySelector('.captions').classList.toggle('off');
      else if (act === 'done') end();
      return;
    }
    const barEl = e.target.closest('.bar');
    if (barEl) {
      const r = barEl.getBoundingClientRect();
      seek(((e.clientX - r.left) / r.width) * duration);
    }
  }
  function onKey(e) {
    if (e.target.matches('input, textarea, select')) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  }
  document.addEventListener('keydown', onKey);

  function cleanup() {
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
    root.removeEventListener('click', onClick);
    actor.stop();
    if (audio) { audio.pause(); audio.src = ''; }
    stopped = true;
    bgm?.stop();
    ctx?.close();
  }
  return { stop: () => { if (!finished) { finished = true; pause(); cleanup(); } } };
}
