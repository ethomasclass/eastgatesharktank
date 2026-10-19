// Stand-in cartoon promoters drawn in SVG. They use the same states as the finished sprites
// (mouth closed / mid / open, eyes open / blink), so the stage animates them identically.
// Once the Google Flow art exists, drop PNGs into assets/sprites/<id>/ and list them in
// content/sprites.json; the stage uses those instead of these drawings.

const INK = '#1b1410';
const S = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const s4 = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

const CAST = {
  turnpike: {
    skin: '#e7b58c', coat: '#6b4a2b', shirt: '#efe6d2', hair: '#8f877c',
    face: { rx: 92, ry: 108 },
    brows: `<path d="M148 208 L186 212 M214 212 L252 208" ${S} stroke-width="9"/>`,
    eyes: 'droopy',
    mouthClosed: `<path d="M176 298 L224 298" ${S}/>`,
    under: `<path d="M108 250 Q112 368 200 382 Q288 368 292 250 Q282 306 244 318 Q200 332 156 318 Q118 306 108 250 Z" fill="#9b9287" ${S}/>`,
    over: '',
    hat: `<path d="M136 146 L144 70 Q200 58 256 70 L264 146 Z" fill="#2d241b" ${S}/>
          <path d="M136 132 L264 132" stroke="#5a4632" stroke-width="10"/>
          <ellipse cx="200" cy="148" rx="158" ry="22" fill="#2d241b" ${S}/>`,
    neckwear: `<path d="M170 372 L200 410 L230 372" fill="#efe6d2" ${s4}/>`,
    extra: `<path d="M135 520 L150 400 M265 520 L250 400" stroke="#3b2a18" stroke-width="12"/>`,
  },
  slater: {
    skin: '#f0c7a2', coat: '#2f4a3a', shirt: '#f5f1e8', hair: '#7a5a3c',
    face: { rx: 84, ry: 110 },
    brows: `<path d="M150 214 Q168 204 186 212 M214 204 Q234 190 254 200" ${S} stroke-width="7"/>`,
    eyes: 'sly',
    mouthClosed: `<path d="M176 300 Q204 308 228 290" ${S}/>`,
    under: `<path d="M118 190 Q104 250 120 282 L130 230 Z M282 190 Q296 250 280 282 L270 230 Z" fill="#7a5a3c" ${S}/>`,
    over: `<g fill="none" ${s4}><circle cx="168" cy="236" r="20"/><circle cx="232" cy="236" r="20"/><path d="M188 236 L212 236"/></g>`,
    hat: `<path d="M96 150 Q200 40 304 150 Q250 120 200 128 Q150 120 96 150 Z" fill="#1f2a24" ${S}/>
          <path d="M112 146 Q200 96 288 146" fill="none" stroke="#c9a54a" stroke-width="5"/>`,
    neckwear: `<path d="M178 360 Q200 350 222 360 Q230 390 200 420 Q170 390 178 360 Z" fill="#f5f1e8" ${s4}/>
               <path d="M186 372 Q200 382 214 372 M184 390 Q200 400 216 390" fill="none" ${s4} stroke-width="3"/>`,
    extra: '',
  },
  steamboat: {
    skin: '#f3c39a', coat: '#b3262d', shirt: '#fbf3dc', hair: '#d9662a',
    face: { rx: 90, ry: 104 },
    brows: `<path d="M146 196 Q166 180 188 194 M212 194 Q234 180 254 196" ${S} stroke-width="8"/>`,
    eyes: 'wide',
    mouthClosed: `<path d="M160 286 Q200 330 240 286 Z" fill="#fff" ${S}/><path d="M166 294 L234 294" ${s4} stroke-width="3"/>`,
    under: `<path d="M112 200 q-14 -20 4 -34 q-6 -24 20 -28 q6 -26 34 -18 q20 -22 44 -4 q26 -18 44 6 q30 -2 30 26 q24 10 14 36 q14 20 -6 34" fill="#d9662a" ${S}/>`,
    over: `<g fill="#c9793e"><circle cx="160" cy="268" r="3"/><circle cx="172" cy="276" r="3"/><circle cx="150" cy="278" r="3"/><circle cx="240" cy="268" r="3"/><circle cx="228" cy="276" r="3"/><circle cx="250" cy="278" r="3"/></g>`,
    hat: `<g transform="rotate(-12 200 120)"><path d="M146 136 L152 34 L252 34 L258 136 Z" fill="#7a1a1f" ${S}/>
          <path d="M150 112 L254 112" stroke="#f2c14e" stroke-width="14"/>
          <ellipse cx="202" cy="138" rx="92" ry="16" fill="#7a1a1f" ${S}/></g>`,
    neckwear: `<path d="M168 368 L198 384 L168 402 Z M232 368 L202 384 L232 402 Z" fill="#f2c14e" ${s4}/><circle cx="200" cy="384" r="9" fill="#f2c14e" ${s4}/>`,
    extra: `<path d="M150 520 L170 410 L200 440 L230 410 L250 520 Z" fill="#f2c14e" ${s4}/>
            <path d="M176 440 L176 520 M200 450 L200 520 M224 440 L224 520" stroke="#e59a2f" stroke-width="7"/>`,
  },
  erie: {
    skin: '#e5ae86', coat: '#233a63', shirt: '#f3efe4', hair: '#b8b2aa',
    face: { rx: 100, ry: 112 },
    brows: `<path d="M140 204 Q164 186 190 202 M210 202 Q236 186 260 204" ${S} stroke-width="13" stroke="#8e8880"/>`,
    eyes: 'proud',
    mouthClosed: `<path d="M178 300 Q200 310 222 300" ${S}/>`,
    under: `<path d="M104 210 Q92 300 150 330 Q160 300 150 270 Q130 250 128 210 Z M296 210 Q308 300 250 330 Q240 300 250 270 Q270 250 272 210 Z" fill="#b8b2aa" ${S}/>`,
    over: '',
    hat: `<path d="M140 150 L132 20 L268 20 L260 150 Z" fill="#141414" ${S}/>
          <path d="M138 126 L262 126" stroke="#3a3a3a" stroke-width="14"/>
          <ellipse cx="200" cy="150" rx="118" ry="18" fill="#141414" ${S}/>`,
    neckwear: `<path d="M166 356 L166 396 L200 408 L234 396 L234 356" fill="#f3efe4" ${s4}/><path d="M180 380 L220 380" ${s4} stroke-width="8" stroke="#141414"/>`,
    extra: `<path d="M110 440 L310 520 L330 490 L130 410 Z" fill="#b8323a" ${s4}/>
            <g fill="#e2b447" ${s4} stroke-width="3"><circle cx="165" cy="470" r="8"/><circle cx="235" cy="470" r="8"/><circle cx="165" cy="505" r="8"/></g>`,
  },
  northerncross: {
    skin: '#eeb48a', coat: '#efe9dc', shirt: '#ffffff', hair: '#f3f0ea',
    face: { rx: 96, ry: 106 },
    brows: `<path d="M148 202 Q168 190 188 200 M212 200 Q232 190 252 202" ${S} stroke-width="8" stroke="#d6d0c6"/>`,
    eyes: 'twinkle',
    mouthClosed: `<path d="M158 292 Q200 332 242 292" fill="#fff" ${S}/>`,
    under: `<path d="M186 316 Q200 368 214 316 Z" fill="#f3f0ea" ${S}/>`,
    over: `<path d="M150 290 Q170 262 200 276 Q230 262 250 290 Q226 284 200 290 Q174 284 150 290 Z" fill="#f3f0ea" ${S}/>
           <g fill="#e98a7a" opacity=".55"><ellipse cx="146" cy="276" rx="18" ry="11"/><ellipse cx="254" cy="276" rx="18" ry="11"/></g>`,
    hat: `<path d="M142 148 Q146 70 200 66 Q254 70 258 148 Z" fill="#f7f3ea" ${S}/>
          <path d="M142 132 L258 132" stroke="#2b2b2b" stroke-width="12"/>
          <path d="M40 156 Q200 110 360 156 Q200 176 40 156 Z" fill="#f7f3ea" ${S}/>`,
    neckwear: `<path d="M200 372 L186 440 M200 372 L214 440" ${s4} stroke-width="5"/><circle cx="200" cy="374" r="8" fill="#1b1410"/>`,
    extra: '',
  },
};

function eyes(kind) {
  const open = {
    droopy: `<g><ellipse cx="168" cy="236" rx="14" ry="10" fill="#fff" ${s4}/><ellipse cx="232" cy="236" rx="14" ry="10" fill="#fff" ${s4}/>
      <circle cx="168" cy="239" r="5" fill="${INK}"/><circle cx="232" cy="239" r="5" fill="${INK}"/>
      <path d="M152 232 L184 232 M216 232 L248 232" ${s4}/></g>`,
    sly: `<g><ellipse cx="168" cy="236" rx="13" ry="9" fill="#fff" ${s4}/><ellipse cx="232" cy="236" rx="13" ry="9" fill="#fff" ${s4}/>
      <circle cx="175" cy="237" r="5" fill="${INK}"/><circle cx="239" cy="237" r="5" fill="${INK}"/></g>`,
    wide: `<g><ellipse cx="166" cy="232" rx="17" ry="20" fill="#fff" ${s4}/><ellipse cx="234" cy="232" rx="17" ry="20" fill="#fff" ${s4}/>
      <circle cx="168" cy="234" r="8" fill="${INK}"/><circle cx="232" cy="234" r="8" fill="${INK}"/>
      <circle cx="171" cy="230" r="2.5" fill="#fff"/><circle cx="235" cy="230" r="2.5" fill="#fff"/></g>`,
    proud: `<g><ellipse cx="166" cy="232" rx="15" ry="12" fill="#fff" ${s4}/><ellipse cx="234" cy="232" rx="15" ry="12" fill="#fff" ${s4}/>
      <circle cx="166" cy="229" r="6" fill="${INK}"/><circle cx="234" cy="229" r="6" fill="${INK}"/></g>`,
    twinkle: `<g><path d="M150 238 Q168 220 186 238" fill="none" ${S}/><path d="M214 238 Q232 220 250 238" fill="none" ${S}/>
      <path d="M144 246 L136 252 M256 246 L264 252" ${s4} stroke-width="3"/></g>`,
  }[kind];
  const shut = kind === 'twinkle'
    ? `<g><path d="M150 236 Q168 244 186 236" fill="none" ${S}/><path d="M214 236 Q232 244 250 236" fill="none" ${S}/></g>`
    : `<g><path d="M152 236 Q168 244 184 236" fill="none" ${S}/><path d="M216 236 Q232 244 248 236" fill="none" ${S}/></g>`;
  return { open, shut };
}

export function characterSVG(id) {
  const c = CAST[id];
  if (!c) return '<svg class="char" viewBox="0 0 400 520" aria-hidden="true"></svg>';
  const e = eyes(c.eyes);
  const mid = `<path d="M174 290 Q200 294 226 290 Q220 314 200 316 Q180 314 174 290 Z" fill="#4a1414" ${S}/>
               <path d="M186 306 Q200 298 214 306 Q206 314 200 314 Q192 314 186 306 Z" fill="#d9636b"/>`;
  const open = `<path d="M166 284 Q200 288 234 284 Q228 338 200 342 Q172 338 166 284 Z" fill="#4a1414" ${S}/>
                <path d="M172 290 Q200 294 228 290 L226 300 Q200 304 174 300 Z" fill="#fff"/>
                <path d="M180 326 Q200 312 220 326 Q210 338 200 338 Q190 338 180 326 Z" fill="#d9636b"/>`;
  return `<svg class="char" viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g class="bob">
      <path d="M40 520 C 48 420 110 372 200 366 C 290 372 352 420 360 520 Z" fill="${c.coat}" ${S}/>
      <path d="M160 366 L200 440 L240 366 Z" fill="${c.shirt}" ${s4}/>
      ${c.extra}
      ${c.neckwear}
      <g class="head">
        <path d="M174 330 L174 372 L226 372 L226 330 Z" fill="${c.skin}" ${S}/>
        <ellipse cx="${200 - c.face.rx + 2}" cy="248" rx="16" ry="24" fill="${c.skin}" ${S}/>
        <ellipse cx="${200 + c.face.rx - 2}" cy="248" rx="16" ry="24" fill="${c.skin}" ${S}/>
        <ellipse cx="200" cy="240" rx="${c.face.rx}" ry="${c.face.ry}" fill="${c.skin}" ${S}/>
        ${c.under}
        <g class="eyes-open">${e.open}</g><g class="eyes-shut">${e.shut}</g>
        ${c.brows}
        <path d="M200 240 Q192 268 186 272 Q200 282 214 272" fill="none" ${s4}/>
        <g class="m-closed">${c.mouthClosed}</g><g class="m-mid">${mid}</g><g class="m-open">${open}</g>
        ${c.over}
        ${c.hat}
      </g>
    </g>
  </svg>`;
}
