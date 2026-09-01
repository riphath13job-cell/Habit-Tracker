import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SIZE = 1024;
const cx = SIZE / 2;

const motif = (scale) => {
  const s = (v) => v * scale;
  const ringR = s(205);
  const coreR = s(155);
  const check = s(26);
  return `
    <circle cx="${cx}" cy="${cx}" r="${ringR}" fill="#FFFFFF"/>
    <circle cx="${cx}" cy="${cx}" r="${coreR}" fill="url(#grad)"/>
    <path d="M ${cx - s(58)} ${cx} L ${cx - s(14)} ${cx + s(46)} L ${cx + s(66)} ${cx - s(46)}"
          fill="none" stroke="#FFFFFF" stroke-width="${check}" stroke-linecap="round" stroke-linejoin="round"/>`;
};

const defs = `
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#818CF8"/>
      <stop offset="1" stop-color="#4338CA"/>
    </linearGradient>
  </defs>`;

const grid = () => {
  let g = '';
  for (let i = SIZE / 8; i < SIZE; i += SIZE / 8) {
    g += `<line x1="${i}" y1="0" x2="${i}" y2="${SIZE}" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>`;
    g += `<line x1="0" y1="${i}" x2="${SIZE}" y2="${i}" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>`;
  }
  return g;
};

const fullIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${defs}
  <rect width="${SIZE}" height="${SIZE}" fill="url(#grad)"/>
  ${grid()}
  ${motif(1)}
</svg>`;

const foreground = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4338CA"/>
      <stop offset="1" stop-color="#312E81"/>
    </linearGradient>
  </defs>
  ${motif(0.72)}
</svg>`;

const monochrome = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <circle cx="${cx}" cy="${cx}" r="${205 * 0.72}" fill="#FFFFFF"/>
  <circle cx="${cx}" cy="${cx}" r="${155 * 0.72}" fill="#000000"/>
  <path d="M ${cx - 58 * 0.72} ${cx} L ${cx - 14 * 0.72} ${cx + 46 * 0.72} L ${cx + 66 * 0.72} ${cx - 46 * 0.72}"
        fill="none" stroke="#FFFFFF" stroke-width="${26 * 0.72}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${defs}
  <rect width="${SIZE}" height="${SIZE}" fill="url(#grad)"/>
</svg>`;

const splashLogo = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${grid()}
  ${motif(1)}
</svg>`;

async function render(svg, outPath, size = SIZE) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(join(root, outPath), png);
}

await render(fullIcon, 'assets/icon.png');
await render(fullIcon, 'assets/favicon.png', 48);
await render(foreground, 'assets/android-icon-foreground.png');
await render(background, 'assets/android-icon-background.png');
await render(monochrome, 'assets/android-icon-monochrome.png');
await render(splashLogo, 'assets/splash-icon.png');

const old = readFileSync(join(root, 'assets', 'icon.png'));
console.log('icons written,', (old.length / 1024).toFixed(1), 'KB icon.png');