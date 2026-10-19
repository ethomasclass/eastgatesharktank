// The For Lease emblem: a hanging red-and-white lease sign, used in the directions panel.
// (Named tankEmblem so the shared game code from The Tank keeps working unchanged.)
export const tankEmblem = () => `<svg viewBox="0 0 300 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M58 6 V52 M242 6 V52" stroke="#9b938c" stroke-width="5" stroke-dasharray="9 5"/>
  <g transform="rotate(-2 150 140)">
    <rect x="14" y="50" width="272" height="168" rx="6" fill="#fbfaf6" stroke="#d1312b" stroke-width="12"/>
    <text x="150" y="142" text-anchor="middle" font-family="'Archivo', sans-serif" font-weight="900" font-size="70" textLength="236" lengthAdjust="spacingAndGlyphs" fill="#d1312b">FOR LEASE</text>
    <rect x="44" y="160" width="212" height="4" fill="#d1312b"/>
    <text x="150" y="198" text-anchor="middle" font-family="'Archivo', sans-serif" font-weight="800" font-size="27" fill="#17110f">Vine &amp; 18th</text>
  </g>
</svg>`;
