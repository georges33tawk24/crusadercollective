// Renders brand art and product mockups to PNG/JPG with headless Chromium.
// Usage: node tools/brand/render.mjs [outDir]
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as art from './art.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] || path.join(here, 'images'));

const B = '#111111';
const Wt = '#f4f4f4';
const { prints, place } = art;

// Every product image the store uses. Keys become file names.
export const images = {
  // Hoodies
  'in-hoc-signo-hoodie-back': art.hoodie({ color: 'black', view: 'back', back: place(prints.inHoc(Wt), 290, 300, 420) }),
  'in-hoc-signo-hoodie-front': art.hoodie({ color: 'black', front: place(prints.mark(Wt, B), 590, 330, 90) }),
  'armor-of-god-hoodie-back': art.hoodie({ color: 'white', view: 'back', back: place(prints.armor(B, Wt), 310, 270, 380) }),
  'armor-of-god-hoodie-front': art.hoodie({ color: 'white', front: place(prints.mark(B, Wt), 590, 330, 90) }),
  'emblem-hoodie-front': art.hoodie({ color: 'black', front: place(prints.badge(Wt, B), 350, 330, 300) }),
  // Tees
  'ora-et-labora-tee-back': art.tee({ color: 'black', view: 'back', back: place(prints.ora(Wt), 330, 250, 340) }),
  'ora-et-labora-tee-front': art.tee({ color: 'black', front: place(prints.mark(Wt, B), 590, 260, 80) }),
  'faith-over-fear-tee-front': art.tee({ color: 'white', front: place(prints.faith(B), 340, 260, 320) }),
  'kyrie-eleison-tee-front': art.tee({ color: 'black', front: place(prints.kyrie(Wt), 330, 250, 340) }),
  'jerusalem-cross-tee-front': art.tee({ color: 'white', front: place(prints.jerusalem(B), 350, 260, 300) }),
  // Caps
  'emblem-dad-cap': art.cap({ color: 'black', design: place(prints.mark(Wt, B), 420, 360, 160) }),
  'chi-rho-cap': art.cap({ color: 'white', design: place(prints.chiRho(B), 425, 350, 150) }),
  // Hats
  'collective-beanie': art.beanie({ color: 'black', design: place(prints.mark(B, Wt), 460, 680, 80) }),
  'ora-et-labora-bucket-hat': art.bucketHat({ color: 'black', design: place(prints.wordmark(Wt), 400, 330, 200) }),
  // Mugs
  'ora-et-labora-mug': art.mug({ color: 'white', design: place(prints.ora(B), 350, 380, 300) }),
  'emblem-mug': art.mug({ color: 'black', design: place(prints.badge(Wt, B), 360, 400, 280) }),
};

// Uses a system Chromium when one is provided (CHROMIUM_PATH), else Playwright's own.
export function launchBrowser() {
  const fallback = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const executablePath = process.env.CHROMIUM_PATH || (existsSync(fallback) ? fallback : undefined);
  return chromium.launch(executablePath ? { executablePath } : {});
}

async function shoot(page, svg, file, { type = 'jpeg', transparent = false } = {}) {
  const html = `<!doctype html><html><head>
    <style>${art.FONT_FACES} html,body{margin:0;background:${transparent ? 'transparent' : '#fff'}} svg{display:block}</style>
    </head><body>${svg}</body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$('svg');
  await el.screenshot({ path: file, type, quality: type === 'jpeg' ? 88 : undefined, omitBackground: transparent });
}

async function main() {
  await mkdir(path.join(outDir, 'products'), { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  for (const [name, svg] of Object.entries(images)) {
    await shoot(page, svg, path.join(outDir, 'products', `${name}.jpg`));
    process.stdout.write(`products/${name}.jpg\n`);
  }

  await shoot(page, art.hero(), path.join(outDir, 'hero.jpg'));
  await shoot(page, art.markSVG({ size: 512 }), path.join(outDir, 'mark.png'), { type: 'png', transparent: true });
  await shoot(
    page,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="1000" height="1000">${art.badgeGroup({ ink: '#fff', bg: '#000', idp: 'lg' })}</svg>`,
    path.join(outDir, 'badge.png'),
    { type: 'png', transparent: true },
  );

  // Plain SVG copies (no web fonts needed) for the theme.
  await writeFile(path.join(outDir, 'mark.svg'), art.markSVG({ size: 400 }).replace(/\s+/g, ' '));

  await browser.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
