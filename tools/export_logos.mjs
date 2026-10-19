// Exports every logo to brand/logos/ as standalone SVG (fonts embedded, so they render the same
// anywhere) and transparent PNG, plus a contact sheet.  Needs the site served at http://localhost:8765
// and Playwright:   node tools/export_logos.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = ROOT + 'brand/logos/';
mkdirSync(OUT, { recursive: true });
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium } = require('playwright');

const NAMES = { turnpike: 'lancaster-turnpike', slater: 'slaters-mill', steamboat: 'north-river-steamboat', erie: 'erie-canal', northerncross: 'northern-cross-railroad' };
const FONTS = [...readFileSync(ROOT + 'css/fonts.css', 'utf8').matchAll(/font-family: '([^']+)'; font-style: (\w+); font-weight: (\d+);[^}]*url\(\.\.\/([^)]+)\)/g)]
  .map(([, fam, style, weight, path]) => ({ fam, style, weight, path }));

function standalone(svg) {
  const used = FONTS.filter((f) => svg.includes(f.fam));
  if (!used.length) return svg;
  const css = used.map((f) => `@font-face{font-family:'${f.fam}';font-style:${f.style};font-weight:${f.weight};src:url(data:font/woff2;base64,${readFileSync(ROOT + f.path).toString('base64')}) format('woff2');}`).join('');
  return svg.replace(/<svg([^>]*)>/, (m, a) => `<svg${a.includes('xmlns=') ? a : a + ' xmlns="http://www.w3.org/2000/svg"'}><style>${css}</style>`);
}

const items = [];
for (const [pid, name] of Object.entries(NAMES)) {
  const L = (await import(ROOT + `js/logos/${pid}.js`)).default;
  items.push({ file: `${name}-logo`, svg: L.mark, w: 2400, h: 1200 }, { file: `${name}-icon`, svg: L.icon, w: 1024, h: 1024 });
}
const { tankEmblem } = await import(ROOT + 'js/tanklogo.js');
items.push({ file: 'the-tank-emblem-gold', svg: tankEmblem('tk').replace('fill="currentColor"', 'fill="#e2b95a"').replaceAll('stroke="currentColor"', 'stroke="#e2b95a"'), w: 1024, h: 1024 });
items.push({ file: 'the-tank-badge', svg: tankEmblem('tk').replace('viewBox="0 0 400 400"', 'viewBox="-8 -8 416 416"').replace('fill="currentColor">', 'fill="#e2b95a"><circle cx="200" cy="200" r="206" fill="#0b2230"/><circle cx="200" cy="200" r="150" fill="#12394b"/>').replaceAll('stroke="currentColor"', 'stroke="#e2b95a"'), w: 1024, h: 1024 });
items.push({ file: 'the-tank-emblem-white', svg: tankEmblem('tk').replace('fill="currentColor"', 'fill="#ffffff"').replaceAll('stroke="currentColor"', 'stroke="#ffffff"'), w: 1024, h: 1024 });

const b = await chromium.launch();
const pg = await b.newPage();
for (const it of items) {
  const svg = standalone(it.svg);
  writeFileSync(OUT + it.file + '.svg', svg);
  await pg.setViewportSize({ width: it.w, height: it.h });
  await pg.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg', `<svg width="${it.w}" height="${it.h}"`)}</body></html>`);
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(150);
  await pg.screenshot({ path: OUT + it.file + '.png', omitBackground: true, clip: { x: 0, y: 0, width: it.w, height: it.h } });
  console.log('wrote', it.file);
}
// contact sheet
const cards = items.filter((i) => i.file.endsWith('-logo')).map((i) => `<div class="c">${standalone(i.svg)}</div>`).join('');
const icons = items.filter((i) => !i.file.endsWith('-logo')).map((i) => `<div class="i ${i.file.includes('white') ? 'dk' : ''}">${standalone(i.svg)}</div>`).join('');
await pg.setViewportSize({ width: 1600, height: 1150 });
await pg.setContent(`<html><body style="margin:0;background:#f4ead3;font-family:sans-serif">
  <style>.g{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:28px}.c svg{width:100%;height:auto}.row{display:flex;gap:22px;padding:0 28px 28px;align-items:center}.i{width:150px;height:150px}.i svg{width:100%;height:100%}.dk{background:#0b2230;border-radius:12px}</style>
  <div class="g">${cards}</div><div class="row">${icons}</div></body></html>`);
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(300);
const h = await pg.evaluate(() => document.body.scrollHeight);
await pg.screenshot({ path: OUT + 'contact-sheet.png', clip: { x: 0, y: 0, width: 1600, height: h } });
await b.close();
console.log('done');
