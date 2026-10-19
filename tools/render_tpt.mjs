// Renders the Teachers Pay Teachers images from brand/tpt/*.html to PNG.
// Needs the site served at http://localhost:8765 (e.g. python3 -m http.server 8765) and Playwright.
//   node tools/render_tpt.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium } = require('playwright');
const OUT = new URL('../brand/tpt/', import.meta.url).pathname;
const jobs = [['thumbnail', 2000, 2000], ['preview', 1920, 1080], ['preview-printables', 1920, 1080]];
const b = await chromium.launch();
for (const [name, w, h] of jobs) {
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  pg.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  const r = await pg.goto(`http://localhost:8765/brand/tpt/${name}.html`).catch(() => null);
  if (!r || !r.ok()) { console.log('skip', name); continue; }
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(600);
  await pg.screenshot({ path: `${OUT}${name}.png` });
  console.log('wrote', `brand/tpt/${name}.png`);
}
await b.close();
