// "The Tank" emblem: a shark fin cutting through the waves, ringed by a paddle-wheel rim.
// Drawn in currentColor so the same art works as a full-colour badge or as a light
// projection (gobo) on the wall behind the promoters.
const teeth = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180;
  const x = 200 + 188 * Math.sin(a), y = 200 - 188 * Math.cos(a);
  return `<rect x="${(x - 7).toFixed(1)}" y="${(y - 11).toFixed(1)}" width="14" height="22" rx="3" transform="rotate(${i * 15} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
}).join('');

export const tankEmblem = (id = 'tk') => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
  <defs>
    <path id="${id}-top" d="M 64 200 A 136 136 0 0 1 336 200"/>
    <path id="${id}-bot" d="M 40 200 A 160 160 0 0 0 360 200"/>
    <clipPath id="${id}-inner"><circle cx="200" cy="200" r="116"/></clipPath>
  </defs>
  ${teeth}
  <circle cx="200" cy="200" r="178" fill="none" stroke="currentColor" stroke-width="12"/>
  <circle cx="200" cy="200" r="122" fill="none" stroke="currentColor" stroke-width="5"/>
  <text font-family="'Rye', Georgia, serif" font-size="40" letter-spacing="7" text-anchor="middle"><textPath href="#${id}-top" startOffset="50%">THE TANK</textPath></text>
  <text font-family="'Playfair Display', Georgia, serif" font-weight="900" font-size="21" letter-spacing="4" text-anchor="middle"><textPath href="#${id}-bot" startOffset="50%">&#9733; VINE &amp; 18TH &#9733;</textPath></text>
  <g clip-path="url(#${id}-inner)">
    <path d="M 128 236 C 150 196 172 132 238 104 C 226 146 232 196 266 236 Z"/>
    <path d="M 70 250 q 22 -16 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 v 14 q -22 -16 -44 0 t -44 0 t -44 0 t -44 0 t -44 0 t -44 0 t -44 0 Z"/>
    <path d="M 70 280 q 22 -14 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 v 10 q -22 -14 -44 0 t -44 0 t -44 0 t -44 0 t -44 0 t -44 0 t -44 0 Z" opacity=".75"/>
    <path d="M 70 306 q 22 -12 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 v 8 q -22 -12 -44 0 t -44 0 t -44 0 t -44 0 t -44 0 t -44 0 t -44 0 Z" opacity=".5"/>
  </g>
</svg>`;
