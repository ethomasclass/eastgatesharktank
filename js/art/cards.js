// Data and fact exhibits for Eastgate, drawn as SVG cards (400 x 300) in the palette of the
// Google Flow art: brick, teal, marigold, copper green and ink on cream.
const K = { ink: '#1b1410', cream: '#f6ecd6', paper: '#efe2c4', brick: '#b5462e', teal: '#2f7f7a', gold: '#e0a526', green: '#4f8f6f', muted: '#7a6a55', night: '#1d2a3a' };
const SLAB = "'Alfa Slab One', Georgia, serif", SANS = "'Atkinson Hyperlegible', system-ui, sans-serif";
const svg = (body, bg = K.cream) => `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect x="4" y="4" width="392" height="292" rx="12" fill="${bg}" stroke="${K.ink}" stroke-width="5"/>${body}</svg>`;
const t = (x, y, s, txt, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || SANS}" font-size="${s}" font-weight="${o.w || 700}" fill="${o.c || K.ink}" text-anchor="${o.a || 'middle'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${txt}</text>`;
const person = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${K.ink}" stroke-width="2.4"><circle cx="0" cy="-30" r="9"/><path d="M-13 0 Q-13 -18 0 -18 Q13 -18 13 0 Z"/></g>`;
const big = (txt, sub, c = K.brick, sub2 = '') => svg(`${t(200, 150, 92, txt, { f: SLAB, c, w: 400 })}${t(200, 205, 22, sub)}${sub2 ? t(200, 235, 18, sub2, { c: K.muted }) : ''}`);

function stack(y, label, parts) {
  let x = 110, out = t(96, y + 24, 20, label, { a: 'end' });
  for (const [pct, c, name] of parts) {
    const w = pct * 2.6;
    out += `<rect x="${x}" y="${y}" width="${w}" height="34" fill="${c}" stroke="${K.ink}" stroke-width="2.5"/>`;
    if (pct >= 14) out += t(x + w / 2, y + 23, 15, `${name} ${pct}%`, { c: '#fff' });
    x += w;
  }
  return out;
}

export default {
  language: svg(`${t(200, 40, 22, 'LANGUAGE SPOKEN AT HOME', { f: SLAB, w: 400, ls: 1 })}
    ${stack(66, '1950', [[38, K.brick, 'Czech'], [50, K.muted, 'English'], [12, '#a99a80', '']])}
    ${stack(128, '2000', [[71, K.teal, 'Spanish'], [25, K.muted, 'Eng.'], [4, '#a99a80', '']])}
    ${stack(190, 'Today', [[54, K.teal, 'Spanish'], [31, K.muted, 'English'], [15, '#a99a80', '']])}
    ${t(200, 262, 15, 'Gray: English only. Light gray: other languages.', { w: 400, c: K.muted })}`),

  society: svg(`${t(200, 52, 24, 'THE CZECH HERITAGE SOCIETY', { f: SLAB, w: 400 })}
    ${Array.from({ length: 11 }, (_, i) => person(52 + i * 29.6, 150, 1, i < 9 ? K.gold : K.paper)).join('')}
    ${t(200, 200, 26, '11 members')}${t(200, 232, 19, 'All live in the suburbs. Zero in Eastgate.', { w: 400 })}
    ${t(200, 262, 16, 'Gold: the 9 who told Gerry yes', { w: 400, c: K.muted })}`),

  names: svg(`<rect x="196" y="40" width="8" height="240" fill="${K.ink}"/>
    ${[[60, K.gold, 'EASTGATE ARTS DISTRICT', 'what realtors say'], [135, K.teal, 'THE BARRIO', 'what longtime neighbors say'], [210, K.brick, 'LITTLE PRAGUE', 'what the heritage society says']].map(([y, c, n, who], i) =>
      `<path d="M${i % 2 ? 330 : 70} ${y} h${i % 2 ? -260 : 260} l${i % 2 ? -20 : 20} 24 l${i % 2 ? 20 : -20} 24 h${i % 2 ? 260 : -260} Z" fill="${c}" stroke="${K.ink}" stroke-width="3.5"/>
       ${t(200, y + 22, n.length > 16 ? 15 : 19, n, { f: SLAB, w: 400, c: '#fff' })}${t(200, y + 40, 13, who, { c: '#fff' })}`).join('')}`),

  night: svg(`<rect x="4" y="4" width="392" height="292" rx="12" fill="${K.night}" stroke="${K.ink}" stroke-width="5"/>
    <path d="M30 230 V120 l40 -30 l40 30 V230 Z M140 230 V80 h70 V230 Z" fill="#111a26"/>
    <rect x="250" y="110" width="120" height="120" fill="#2b2014"/><rect x="262" y="130" width="40" height="40" fill="${K.gold}"/><rect x="318" y="130" width="40" height="40" fill="${K.gold}"/>
    <circle cx="225" cy="70" r="7" fill="#444"/><path d="M225 70 V230" stroke="#333" stroke-width="5"/>
    <ellipse cx="310" cy="236" rx="80" ry="10" fill="${K.gold}" opacity=".45"/>
    ${t(110, 270, 44, '7 in 10', { f: SLAB, w: 400, c: K.gold })}${t(290, 262, 15, 'women avoid the dark', { c: '#f6ecd6' })}${t(290, 280, 15, 'stretch by the church', { c: '#f6ecd6' })}
    ${t(110, 60, 13, 'broken light', { c: '#9fb0c4' })}`, K.night),

  landscape: svg(`${t(200, 44, 24, 'CULTURAL LANDSCAPE', { f: SLAB, w: 400 })}${t(200, 70, 16, 'the visible mark people leave on a place', { c: K.muted })}
    ${[[200, K.brick, '1893 · Czech church, cornerstone, beer ad'], [160, K.teal, '1976 · Spanish Mass, tortillería sign'], [120, K.gold, 'Next · whatever opens in the hall']].map(([y, c, s]) =>
      `<rect x="40" y="${y}" width="320" height="38" rx="4" fill="${c}" stroke="${K.ink}" stroke-width="3"/>${t(200, y + 25, 13, s, { c: '#fff' })}`).join('')}
    ${t(200, 270, 15, 'Each group adds a layer on top of the last', { c: K.muted })}`),

  network: svg(`${(() => { const pts = Array.from({ length: 14 }, (_, i) => [200 + 130 * Math.cos(i * 2 * Math.PI / 14), 140 + 95 * Math.sin(i * 2 * Math.PI / 14)]);
      let s = ''; for (let i = 0; i < 11; i++) for (let j = i + 1; j < 11; j++) if ((i + j) % 3 === 0 || j === i + 1) s += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="${K.teal}" stroke-width="2.5"/>`;
      return s + pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="13" fill="${i < 11 ? K.gold : K.paper}" stroke="${K.ink}" stroke-width="3"/>`).join(''); })()}
    ${t(200, 150, 44, '11 of 14', { f: SLAB, w: 400, c: K.brick })}${t(200, 272, 17, 'vendors are family or neighbors from the same towns')}`),

  choice: svg(`<rect x="24" y="30" width="170" height="240" rx="8" fill="${K.paper}" stroke="${K.ink}" stroke-width="3"/><rect x="206" y="30" width="170" height="240" rx="8" fill="${K.paper}" stroke="${K.ink}" stroke-width="3"/>
    ${t(109, 66, 22, 'THEN', { f: SLAB, w: 400, c: K.brick })}${t(291, 66, 22, 'NOW', { f: SLAB, w: 400, c: K.teal })}
    ${t(109, 120, 16, 'Landlords in other')}${t(109, 142, 16, 'neighborhoods')}${t(109, 164, 16, 'would not rent')}${t(109, 186, 16, 'to us.')}${t(109, 240, 14, 'limited choices', { c: K.muted })}
    ${t(291, 120, 16, 'We stay because')}${t(291, 142, 16, 'we want to.')}${t(291, 186, 16, '"A cushion against')}${t(291, 208, 16, 'the world."')}${t(291, 240, 14, 'choice', { c: K.muted })}`),

  mercadomoney: big('$4,200', '14 stalls x $300 a month', K.green, 'Cash only. No website. Full from day one.'),
  brewjobs: big('12 jobs', 'for people within 10 blocks', K.teal, 'Menu from the bakery and tortillería'),
  daycare: svg(`<path d="M50 220 C120 120 180 260 250 150 S330 90 350 70" fill="none" stroke="${K.brick}" stroke-width="6" stroke-dasharray="14 10"/>
    <circle cx="50" cy="220" r="12" fill="${K.gold}" stroke="${K.ink}" stroke-width="3"/><rect x="336" y="54" width="30" height="30" fill="${K.teal}" stroke="${K.ink}" stroke-width="3"/>
    ${t(70, 255, 14, 'the hall', { a: 'start' })}${t(330, 108, 14, 'nearest daycare', { a: 'end' })}
    ${t(150, 80, 48, '14 blocks', { f: SLAB, w: 400, c: K.brick })}${t(150, 112, 20, '26 minutes with a stroller')}`),
  classes: svg(`<rect x="40" y="70" width="150" height="110" rx="6" fill="${K.teal}" stroke="${K.ink}" stroke-width="4"/><rect x="210" y="70" width="150" height="110" rx="6" fill="${K.brick}" stroke="${K.ink}" stroke-width="4"/>
    ${t(115, 135, 30, 'English', { f: SLAB, w: 400, c: '#fff' })}${t(285, 135, 30, 'Español', { f: SLAB, w: 400, c: '#fff' })}
    ${t(200, 225, 20, 'Classes in the old Circle room')}${t(200, 252, 16, 'open to everyone', { c: K.muted })}`),
  rent: svg(`${t(200, 46, 20, 'ONE STUDIO, ONE YEAR', { f: SLAB, w: 400 })}
    <rect x="40" y="80" width="320" height="44" fill="${K.paper}" stroke="${K.ink}" stroke-width="3"/><rect x="40" y="80" width="224" height="44" fill="${K.brick}" stroke="${K.ink}" stroke-width="3"/>
    ${t(152, 109, 18, '$28,800 rent', { c: '#fff' })}${t(312, 109, 15, '$12,200 left')}
    ${t(200, 160, 16, 'Median Eastgate household income: $41,000')}
    ${t(200, 232, 64, '70%', { f: SLAB, w: 400, c: K.brick })}${t(200, 268, 16, 'of a typical household\'s income', { c: K.muted })}`),
  bricks: svg(`${[90, 170, 250].map((x) => `<rect x="${x - 36}" y="110" width="72" height="36" rx="3" fill="${K.brick}" stroke="${K.ink}" stroke-width="4"/>`).join('')}
    <rect x="80" y="170" width="240" height="40" rx="4" fill="#c9b27a" stroke="${K.ink}" stroke-width="3"/>${t(200, 196, 15, 'SAINT WENCESLAS · 1893 · HERITAGE')}
    ${t(200, 74, 34, '3 bricks', { f: SLAB, w: 400, c: K.brick })}${t(200, 250, 17, 'Everything else on the corner comes down')}`),
  reserved: big('90%', 'of units reserved in 48 hours', K.teal, 'by people who do not live here yet'),
  flyer: svg(`<rect x="120" y="36" width="160" height="210" rx="4" fill="#fff" stroke="${K.ink}" stroke-width="4" transform="rotate(-4 200 140)"/>
    ${t(200, 80, 18, 'SoVine', { f: SLAB, w: 400, c: K.teal })}${t(200, 104, 12, 'Exciting news!', { c: K.muted })}
    <g transform="translate(160 120)">${Array.from({ length: 25 }, (_, i) => ((i * 7) % 3) ? `<rect x="${(i % 5) * 16}" y="${Math.floor(i / 5) * 16}" width="16" height="16" fill="${K.ink}"/>` : '').join('')}</g>
    ${t(200, 278, 17, 'The whole community engagement plan')}`),
  kitsch: svg(`${t(200, 44, 22, 'IS THAT CZECH?', { f: SLAB, w: 400, c: K.brick })}
    ${[[80, 'Lederhosen', 'Bavaria, Alps'], [200, 'Feathered hat', 'the Alps'], [320, 'Cuckoo clock', 'Black Forest']].map(([x, a, b]) =>
      `<circle cx="${x}" cy="125" r="44" fill="${K.paper}" stroke="${K.ink}" stroke-width="3"/>${t(x, 132, 40, '?', { f: SLAB, w: 400, c: K.muted })}${t(x, 198, 16, a)}${t(x, 220, 14, b, { c: K.muted })}`).join('')}
    ${t(200, 268, 16, 'Mostly German and Alpine, not Czech')}`),
  buses: svg(`<rect x="40" y="70" width="200" height="90" rx="14" fill="${K.gold}" stroke="${K.ink}" stroke-width="4"/>${[60, 100, 140, 180].map((x) => `<rect x="${x}" y="84" width="30" height="30" rx="3" fill="#cfe6ea" stroke="${K.ink}" stroke-width="2.5"/>`).join('')}
    <circle cx="80" cy="165" r="15" fill="${K.ink}"/><circle cx="200" cy="165" r="15" fill="${K.ink}"/>
    ${t(320, 112, 40, '40', { f: SLAB, w: 400, c: K.brick })}${t(320, 140, 15, 'per bus, eventually')}
    ${t(200, 230, 20, 'Customers from the suburbs')}${t(200, 258, 16, '4 in 10 Eastgate homes have no car', { c: K.muted })}`),
};
