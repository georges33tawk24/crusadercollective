// Original Crusader Collective artwork, drawn as SVG.
// Every shape here is hand-built from basic paths so the brand owns it outright.

import { readFileSync } from 'node:fs';

// Brand fonts are bundled locally (see fonts/README.md) and inlined as data URIs.
const font = (file) =>
  `url(data:font/woff2;base64,${readFileSync(new URL(`./fonts/${file}`, import.meta.url)).toString('base64')}) format('woff2')`;

export const FONT_FACES = `
  @font-face{font-family:Inter;font-weight:100 900;src:${font('inter-latin.woff2')};unicode-range:U+0000-00FF,U+2000-206F,U+2190-21FF}
  @font-face{font-family:Inter;font-weight:100 900;src:${font('inter-greek.woff2')};unicode-range:U+0370-03FF}
  @font-face{font-family:Cinzel;font-weight:900;src:${font('cinzel-latin.woff2')}}
  @font-face{font-family:UnifrakturMaguntia;font-weight:400;src:${font('unifraktur-latin.woff2')}}`;

/* ------------------------------------------------------------------ */
/* Symbols                                                             */
/* ------------------------------------------------------------------ */

// Jerusalem cross in a 100x100 box: a cross potent with four small crosses.
export function jerusalemCross(fill) {
  const bars = [
    [44, 8, 12, 84], // vertical stem
    [8, 44, 84, 12], // horizontal stem
    [33, 8, 34, 11], // top crossbar
    [33, 81, 34, 11], // bottom crossbar
    [8, 33, 11, 34], // left crossbar
    [81, 33, 11, 34], // right crossbar
  ];
  const small = [25, 75].flatMap((cx) => [25, 75].map((cy) => [cx, cy]));
  const rects = bars.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`);
  small.forEach(([cx, cy]) => {
    rects.push(`<rect x="${cx - 8}" y="${cy - 2.6}" width="16" height="5.2"/>`);
    rects.push(`<rect x="${cx - 2.6}" y="${cy - 8}" width="5.2" height="16"/>`);
  });
  return `<g fill="${fill}">${rects.join('')}</g>`;
}

// Chi-Rho monogram in a 100x100 box.
export function chiRho(ink) {
  return `<g fill="none" stroke="${ink}" stroke-width="8.5" stroke-linecap="square">
    <path d="M24 30 L76 82"/><path d="M76 30 L24 82"/>
    <path d="M50 6 L50 96"/>
    <path d="M50 8 C84 8 84 44 50 44" stroke-linecap="butt"/>
  </g>`;
}

// Simple Latin cross in a 100x100 box.
export function latinCross(fill) {
  return `<g fill="${fill}"><rect x="43" y="4" width="14" height="92"/><rect x="20" y="26" width="60" height="14"/></g>`;
}

// Heater shield outline in a 100x120 box.
function shieldPath() {
  return 'M8 6 H92 V52 C92 86 70 106 50 116 C30 106 8 86 8 52 Z';
}

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

// Compact round mark used for the header logo, favicon and embroidery.
export function markSVG({ bg = '#000', ink = '#fff', size = 400 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}">
    <circle cx="200" cy="200" r="198" fill="${bg}"/>
    <circle cx="200" cy="200" r="172" fill="none" stroke="${ink}" stroke-width="6"/>
    <g transform="translate(95 95) scale(2.1)">${jerusalemCross(ink)}</g>
  </svg>`;
}

// Full badge with ring lettering, used for big prints and the about page.
export function badgeGroup({ ink = '#fff', bg = '#000', idp = 'b' } = {}) {
  return `<g>
    <defs>
      <path id="${idp}-top" d="M60 200 A140 140 0 0 1 340 200"/>
      <path id="${idp}-bot" d="M52 200 A148 148 0 0 0 348 200"/>
    </defs>
    <circle cx="200" cy="200" r="198" fill="${bg}"/>
    <circle cx="200" cy="200" r="186" fill="none" stroke="${ink}" stroke-width="5"/>
    <circle cx="200" cy="200" r="116" fill="none" stroke="${ink}" stroke-width="3"/>
    <text font-family="Inter" font-weight="900" font-size="30" letter-spacing="7" fill="${ink}" text-anchor="middle">
      <textPath href="#${idp}-top" startOffset="50%">CRUSADER COLLECTIVE</textPath>
    </text>
    <text font-family="Inter" font-weight="800" font-size="22" letter-spacing="9" fill="${ink}" text-anchor="middle" dominant-baseline="hanging">
      <textPath href="#${idp}-bot" startOffset="50%">• LEBANON •</textPath>
    </text>
    <g transform="translate(130 130) scale(1.4)">${jerusalemCross(ink)}</g>
  </g>`;
}

/* ------------------------------------------------------------------ */
/* Print designs (drawn in a 1000 x 1000 box)                          */
/* ------------------------------------------------------------------ */

export const prints = {
  mark(ink, bg) {
    return `<g transform="translate(100 100) scale(2)">${markSVG({ bg: ink, ink: bg }).replace(/<\/?svg[^>]*>/g, '')}</g>`;
  },

  badge(ink, bg) {
    return `<g transform="translate(100 100) scale(2)">${badgeGroup({ ink: bg, bg: ink, idp: 'pb' })}</g>`;
  },

  inHoc(ink) {
    return `<g>
      <defs>
        <path id="ih-top" d="M170 500 A330 330 0 0 1 830 500"/>
        <path id="ih-bot" d="M150 500 A350 350 0 0 0 850 500"/>
      </defs>
      <circle cx="500" cy="500" r="392" fill="none" stroke="${ink}" stroke-width="12"/>
      <circle cx="500" cy="500" r="268" fill="none" stroke="${ink}" stroke-width="6"/>
      <text font-family="Cinzel" font-weight="900" font-size="66" letter-spacing="10" fill="${ink}" text-anchor="middle">
        <textPath href="#ih-top" startOffset="50%">IN HOC SIGNO VINCES</textPath>
      </text>
      <text font-family="Inter" font-weight="800" font-size="40" letter-spacing="16" fill="${ink}" text-anchor="middle" dominant-baseline="hanging">
        <textPath href="#ih-bot" startOffset="50%">CRUSADER · COLLECTIVE</textPath>
      </text>
      <g transform="translate(300 290) scale(4)">${chiRho(ink)}</g>
      <text x="222" y="532" font-family="Inter" font-weight="800" font-size="80" fill="${ink}" text-anchor="middle">Α</text>
      <text x="778" y="532" font-family="Inter" font-weight="800" font-size="80" fill="${ink}" text-anchor="middle">Ω</text>
    </g>`;
  },

  ora(ink) {
    return `<g fill="${ink}" text-anchor="middle">
      <g transform="translate(455 60) scale(0.9)">${latinCross(ink)}</g>
      <text x="500" y="420" font-family="UnifrakturMaguntia" font-size="300">Ora et</text>
      <text x="500" y="720" font-family="UnifrakturMaguntia" font-size="300">Labora</text>
      <rect x="250" y="800" width="500" height="8"/>
      <text x="500" y="890" font-family="Inter" font-weight="800" font-size="46" letter-spacing="18">PRAY &amp; WORK</text>
    </g>`;
  },

  faith(ink) {
    return `<g fill="${ink}" font-family="Inter" font-weight="900" text-anchor="middle">
      <text x="500" y="300" font-size="290" letter-spacing="-14">FAITH</text>
      <text x="500" y="560" font-size="290" letter-spacing="-14">OVER</text>
      <text x="500" y="820" font-size="290" letter-spacing="-14">FEAR</text>
      <rect x="120" y="872" width="760" height="10"/>
      <text x="500" y="960" font-size="50" font-weight="800" letter-spacing="20">HEBREWS 13:6</text>
    </g>`;
  },

  armor(ink, bg) {
    return `<g text-anchor="middle">
      <text x="500" y="90" font-family="Inter" font-weight="800" font-size="44" letter-spacing="14" fill="${ink}">PUT ON THE FULL</text>
      <text x="500" y="270" font-family="Cinzel" font-weight="900" font-size="190" letter-spacing="6" fill="${ink}">ARMOR</text>
      <text x="500" y="340" font-family="Inter" font-weight="800" font-size="44" letter-spacing="14" fill="${ink}">OF GOD</text>
      <g transform="translate(330 380) scale(3.4 3.4)">
        <path d="${shieldPath()}" fill="${ink}"/>
        <path d="${shieldPath()}" fill="none" stroke="${bg}" stroke-width="2.5" transform="translate(6.5 7) scale(0.87)"/>
        <g transform="translate(25 24) scale(0.5)">${jerusalemCross(bg)}</g>
      </g>
      <text x="500" y="1000" font-family="Inter" font-weight="800" font-size="40" letter-spacing="18" fill="${ink}">EPHESIANS 6:11</text>
    </g>`;
  },

  kyrie(ink) {
    return `<g fill="${ink}" text-anchor="middle">
      <g transform="translate(430 40) scale(1.4)">${jerusalemCross(ink)}</g>
      <text x="500" y="440" font-family="Cinzel" font-weight="900" font-size="220" letter-spacing="8">KYRIE</text>
      <text x="500" y="680" font-family="Cinzel" font-weight="900" font-size="200" letter-spacing="4">ELEISON</text>
      <rect x="200" y="740" width="600" height="8"/>
      <text x="500" y="830" font-family="Inter" font-weight="800" font-size="48" letter-spacing="18">LORD, HAVE MERCY</text>
    </g>`;
  },

  jerusalem(ink) {
    return `<g fill="${ink}" text-anchor="middle">
      <g transform="translate(200 60) scale(6)">${jerusalemCross(ink)}</g>
      <text x="500" y="800" font-family="Inter" font-weight="900" font-size="104" letter-spacing="-3">CRUSADER</text>
      <text x="500" y="900" font-family="Inter" font-weight="800" font-size="56" letter-spacing="30">COLLECTIVE</text>
    </g>`;
  },

  chiRho(ink) {
    return `<g transform="translate(100 100) scale(8)">${chiRho(ink)}</g>`;
  },

  wordmark(ink) {
    return `<g fill="${ink}" text-anchor="middle" font-family="Inter">
      <text x="500" y="470" font-weight="900" font-size="150" letter-spacing="-5">ORA ET</text>
      <text x="500" y="620" font-weight="900" font-size="150" letter-spacing="-5">LABORA</text>
    </g>`;
  },
};

// Places a 1000x1000 print design at (x, y) with a given width.
export function place(design, x, y, w, rotate = 0) {
  const s = w / 1000;
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${s})">${design}</g>`;
}

/* ------------------------------------------------------------------ */
/* Garment and object mockups (1600 x 2000 canvas)                     */
/* ------------------------------------------------------------------ */

const W = 1600;
const H = 2000;

const palettes = {
  black: { base: '#161616', hi: '#2e2e2e', lo: '#050505', line: 'rgba(255,255,255,0.07)', seam: 'rgba(0,0,0,0.55)', edge: 'rgba(0,0,0,0.6)', ink: '#f4f4f4' },
  white: { base: '#f3f3f1', hi: '#ffffff', lo: '#cfcfcb', line: 'rgba(0,0,0,0.09)', seam: 'rgba(0,0,0,0.2)', edge: 'rgba(0,0,0,0.22)', ink: '#111111' },
};

function studio(extra = '') {
  return `<defs>
      <radialGradient id="bg" cx="50%" cy="42%" r="75%">
        <stop offset="0" stop-color="#f1f1ef"/><stop offset="1" stop-color="#dcdcd9"/>
      </radialGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"/>
      </filter>
      ${extra}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)"/>`;
}

function fabricGradient(id, p) {
  return `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${p.lo}"/>
      <stop offset="0.22" stop-color="${p.base}"/>
      <stop offset="0.5" stop-color="${p.hi}"/>
      <stop offset="0.78" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.lo}"/>
    </linearGradient>
    <linearGradient id="${id}-v" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.18"/>
    </linearGradient>`;
}

function frame(inner, extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${studio(extraDefs)}${inner}</svg>`;
}

// Garments are drawn in a 1000x1000 box then scaled onto the canvas.
function onCanvas(inner, { scale = 1.45, y = 230 } = {}) {
  const x = (W - 1000 * scale) / 2;
  return `<ellipse cx="${W / 2}" cy="${y + 940 * scale}" rx="${520 * scale * 0.9}" ry="46" fill="#000" opacity="0.28" filter="url(#soft)"/>
    <g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>`;
}

export function tee({ color = 'black', front = null, back = null, view = 'front' } = {}) {
  const p = palettes[color];
  const body = 'M392 112 Q500 196 608 112 L772 164 L922 338 L826 414 L738 342 L734 906 Q500 922 266 906 L262 342 L174 414 L78 338 L228 164 Z';
  const design = view === 'front' ? front : back;
  const collar =
    view === 'front'
      ? `<path d="M392 112 Q500 196 608 112" fill="none" stroke="${p.lo}" stroke-width="22"/>
         <path d="M404 110 Q500 140 596 110 Q500 176 404 110 Z" fill="${p.lo}" opacity="0.9"/>
         <path d="M392 112 Q500 196 608 112" fill="none" stroke="${p.line}" stroke-width="3" transform="translate(0 12)"/>`
      : `<path d="M392 112 Q500 140 608 112" fill="none" stroke="${p.lo}" stroke-width="20"/>`;
  return frame(
    onCanvas(`
      <path d="${body}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${body}" fill="url(#fab-v)"/>
      <path d="M262 342 L266 906 M738 342 L734 906" stroke="${p.seam}" stroke-width="3" fill="none"/>
      <path d="M228 164 L262 342 M772 164 L738 342" stroke="${p.seam}" stroke-width="3" fill="none"/>
      <path d="M78 338 L174 414 M922 338 L826 414" stroke="${p.lo}" stroke-width="16" fill="none"/>
      <path d="M270 880 Q500 896 730 880" stroke="${p.line}" stroke-width="4" fill="none"/>
      <path d="M330 520 C360 640 350 760 320 860 M680 500 C650 640 660 760 690 860" stroke="${p.line}" stroke-width="10" fill="none" opacity="0.8"/>
      ${collar}
      ${design || ''}
    `),
    fabricGradient('fab', p),
  );
}

export function hoodie({ color = 'black', front = null, back = null, view = 'front' } = {}) {
  const p = palettes[color];
  const body =
    'M330 196 L196 250 C156 272 138 322 128 384 L74 818 L186 836 L246 470 L254 904 L746 904 L754 470 L814 836 L926 818 L872 384 C862 322 844 272 804 250 L670 196 Z';
  const hoodBack = 'M322 214 C300 100 400 22 500 22 C600 22 700 100 678 214 Q500 262 322 214 Z';
  const hoodFront = 'M338 206 C330 100 410 40 500 40 C590 40 670 100 662 206 C630 262 570 300 500 300 C430 300 370 262 338 206 Z';
  const opening = 'M400 196 C408 116 456 86 500 86 C544 86 592 116 600 196 C580 238 540 262 500 262 C460 262 420 238 400 196 Z';
  const design = view === 'front' ? front : back;
  const frontBits = `
      <path d="${hoodFront}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${opening}" fill="${p.lo}"/>
      <path d="${opening}" fill="#000" opacity="${color === 'black' ? 0.5 : 0.12}"/>
      <path d="M468 262 L462 452 M532 262 L538 452" stroke="${p.hi}" stroke-width="9" stroke-linecap="round" fill="none"/>
      <rect x="455" y="448" width="14" height="30" rx="4" fill="${p.lo}"/>
      <rect x="531" y="448" width="14" height="30" rx="4" fill="${p.lo}"/>
      <path d="M326 650 L674 650 L724 846 L276 846 Z" fill="url(#fab)"/>
      <path d="M326 650 L674 650 L724 846 L276 846 Z" fill="none" stroke="${p.seam}" stroke-width="3"/>
      <path d="M326 650 C300 720 290 780 276 846 M674 650 C700 720 710 780 724 846" stroke="${p.lo}" stroke-width="8" fill="none"/>`;
  const backBits = `
      <path d="${hoodBack}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${hoodBack}" fill="url(#fab-v)"/>
      <path d="M500 26 L500 236" stroke="${p.seam}" stroke-width="3"/>`;
  return frame(
    onCanvas(
      `
      <path d="${body}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${body}" fill="url(#fab-v)"/>
      <path d="M246 470 L254 904 M754 470 L746 904 M330 196 L246 470 M670 196 L754 470" stroke="${p.seam}" stroke-width="3" fill="none"/>
      <path d="M74 818 L186 836 L180 890 L66 872 Z M926 818 L814 836 L820 890 L934 872 Z" fill="${p.lo}"/>
      <path d="M254 850 L746 850 L746 904 L254 904 Z" fill="${p.lo}"/>
      <path d="M270 858 L270 900 M300 858 L300 900 M330 858 L330 900 M360 858 L360 900 M390 858 L390 900 M420 858 L420 900 M450 858 L450 900 M480 858 L480 900 M510 858 L510 900 M540 858 L540 900 M570 858 L570 900 M600 858 L600 900 M630 858 L630 900 M660 858 L660 900 M690 858 L690 900 M720 858 L720 900" stroke="${p.line}" stroke-width="3"/>
      <path d="M300 420 C330 560 320 700 300 820 M700 420 C670 560 680 700 700 820" stroke="${p.line}" stroke-width="12" fill="none"/>
      ${view === 'front' ? frontBits : backBits}
      ${design || ''}
    `,
      { scale: 1.42, y: 250 },
    ),
    fabricGradient('fab', p),
  );
}

export function cap({ color = 'black', design = '' } = {}) {
  const p = palettes[color];
  const crown = 'M210 610 C210 330 350 210 500 210 C650 210 790 330 790 610 Z';
  const brim = 'M186 606 C300 566 700 566 814 606 C850 650 812 716 700 736 C600 756 400 756 300 736 C188 716 150 650 186 606 Z';
  return frame(
    onCanvas(
      `
      <path d="${crown}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${crown}" fill="url(#fab-v)"/>
      <path d="M500 214 L500 606 M500 214 C420 300 376 450 372 606 M500 214 C580 300 624 450 628 606" stroke="${p.seam}" stroke-width="4" fill="none"/>
      <path d="M360 330 L360 346 M640 330 L640 346" stroke="${p.lo}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="500" cy="216" r="16" fill="${p.lo}"/>
      <path d="${brim}" fill="${p.lo}"/>
      <path d="M200 616 C300 590 700 590 800 616 C820 650 790 690 700 704 C600 720 400 720 300 704 C210 690 180 650 200 616 Z" fill="url(#fab)"/>
      <path d="M232 640 C330 620 670 620 768 640" stroke="${p.line}" stroke-width="4" fill="none"/>
      <path d="M244 666 C340 648 660 648 756 666" stroke="${p.line}" stroke-width="4" fill="none"/>
      ${design}
    `,
      { scale: 1.3, y: 330 },
    ),
    fabricGradient('fab', p),
  );
}

export function beanie({ color = 'black', patchInk = '#111', patchBg = '#f4f4f4', design = '' } = {}) {
  const p = palettes[color];
  const dome = 'M290 640 C290 360 390 230 500 230 C610 230 710 360 710 640 Z';
  const ribs = Array.from({ length: 22 }, (_, i) => {
    const x = 282 + i * 20;
    return `M${x} 620 L${x} 830`;
  }).join(' ');
  return frame(
    onCanvas(
      `
      <path d="${dome}" fill="url(#fab)"/>
      <path d="${dome}" fill="url(#fab-v)"/>
      <path d="M500 232 L500 620 M420 250 C380 360 360 500 360 620 M580 250 C620 360 640 500 640 620" stroke="${p.line}" stroke-width="6" fill="none"/>
      <rect x="266" y="600" width="468" height="236" rx="34" fill="url(#fab)"/>
      <rect x="266" y="600" width="468" height="236" rx="34" fill="url(#fab-v)"/>
      <path d="${ribs}" stroke="${p.line}" stroke-width="7"/>
      <rect x="430" y="660" width="140" height="120" rx="8" fill="${patchBg}"/>
      <rect x="438" y="668" width="124" height="104" rx="6" fill="none" stroke="${patchInk}" stroke-width="2" stroke-dasharray="6 5"/>
      ${design}
    `,
      { scale: 1.35, y: 300 },
    ),
    fabricGradient('fab', p),
  );
}

export function bucketHat({ color = 'black', design = '' } = {}) {
  const p = palettes[color];
  const crown = 'M330 560 C326 420 350 318 500 312 C650 318 674 420 670 560 Z';
  const brim = 'M330 540 L670 540 C740 600 800 660 826 706 C830 730 800 744 760 748 C600 766 400 766 240 748 C200 744 170 730 174 706 C200 660 260 600 330 540 Z';
  const rows = [586, 624, 662, 700].map((y, i) => {
    const inset = 30 + i * 38;
    return `M${330 - inset} ${y} C${420} ${y + 10} ${580} ${y + 10} ${670 + inset} ${y}`;
  });
  return frame(
    onCanvas(
      `
      <path d="${brim}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${brim}" fill="url(#fab-v)"/>
      <path d="${rows.join(' ')}" stroke="${p.line}" stroke-width="4" fill="none"/>
      <path d="${crown}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${crown}" fill="url(#fab-v)"/>
      <path d="M330 548 C420 572 580 572 670 548" stroke="${p.lo}" stroke-width="12" fill="none"/>
      <path d="M346 380 C420 364 580 364 654 380" stroke="${p.seam}" stroke-width="4" fill="none"/>
      <circle cx="392" cy="432" r="7" fill="${p.lo}"/><circle cx="608" cy="432" r="7" fill="${p.lo}"/>
      ${design}
    `,
      { scale: 1.4, y: 230 },
    ),
    fabricGradient('fab', p),
  );
}

export function mug({ color = 'white', design = '' } = {}) {
  const p = palettes[color];
  const body = 'M290 300 L290 790 C290 846 334 866 380 866 L620 866 C666 866 710 846 710 790 L710 300 Z';
  const handle = 'M708 400 C840 396 866 452 866 560 C866 676 822 716 708 704 L708 648 C786 652 808 624 808 560 C808 486 790 452 708 456 Z';
  return frame(
    onCanvas(
      `
      <path d="${handle}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${body}" fill="url(#fab)" stroke="${p.edge}" stroke-width="3"/>
      <path d="${body}" fill="url(#fab-v)"/>
      <ellipse cx="500" cy="300" rx="210" ry="42" fill="${p.hi}"/>
      <ellipse cx="500" cy="302" rx="190" ry="32" fill="${color === 'black' ? '#070707' : '#cfcfcc'}"/>
      <ellipse cx="500" cy="312" rx="176" ry="24" fill="#1b120c"/>
      <path d="M318 340 L318 780" stroke="#fff" stroke-width="16" opacity="${color === 'black' ? 0.06 : 0.6}"/>
      ${design}
    `,
      { scale: 1.4, y: 260 },
    ),
    fabricGradient('fab', p),
  );
}

/* ------------------------------------------------------------------ */
/* Hero artwork (2400 x 1400)                                          */
/* ------------------------------------------------------------------ */

export function hero() {
  const p = palettes.black;
  const body = 'M196 250 C156 272 138 322 128 384 L74 818 L186 836 L246 470 L254 904 L746 904 L754 470 L814 836 L926 818 L872 384 C862 322 844 272 804 250 L670 196 L330 196 Z';
  const hoodBack = 'M322 214 C300 100 400 22 500 22 C600 22 700 100 678 214 Q500 262 322 214 Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1400" width="2400" height="1400">
    <defs>
      ${fabricGradient('fab', p)}
      <radialGradient id="hbg" cx="50%" cy="40%" r="80%">
        <stop offset="0" stop-color="#3a3a3a"/><stop offset="0.6" stop-color="#151515"/><stop offset="1" stop-color="#050505"/>
      </radialGradient>
      <radialGradient id="vig" cx="50%" cy="45%" r="70%">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/>
      </radialGradient>
      <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur3"><feGaussianBlur stdDeviation="2.2"/></filter>
      <filter id="blur40"><feGaussianBlur stdDeviation="40"/></filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0"/>
      </filter>
      <pattern id="arches" width="240" height="700" patternUnits="userSpaceOnUse">
        <path d="M20 700 L20 260 C20 120 120 40 120 40 C120 40 220 120 220 260 L220 700" fill="none" stroke="#fff" stroke-opacity="0.05" stroke-width="6"/>
      </pattern>
    </defs>
    <rect width="2400" height="1400" fill="url(#hbg)"/>
    <rect width="2400" height="1400" fill="url(#arches)" filter="url(#blur6)"/>
    <g transform="translate(250 -228) scale(1.9)" filter="url(#blur3)">
      <g transform="translate(0 0)">
        <path d="${body}" fill="url(#fab)"/>
        <path d="${hoodBack}" fill="url(#fab)"/>
        <path d="M500 26 L500 236" stroke="${p.seam}" stroke-width="3"/>
        <path d="M300 420 C330 560 320 700 300 820 M700 420 C670 560 680 700 700 820" stroke="${p.line}" stroke-width="12" fill="none"/>
        ${place(prints.inHoc('#e9e9e9'), 250, 270, 500)}
      </g>
    </g>
    <rect width="2400" height="1400" fill="#000" opacity="0.2"/>
    <rect width="2400" height="1400" fill="url(#vig)"/>
    <rect width="2400" height="1400" filter="url(#grain)"/>
  </svg>`;
}
