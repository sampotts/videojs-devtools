import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const source = readFileSync(new URL('../assets/icon.svg', import.meta.url), 'utf8');
const artwork = source.replace('<svg ', '<svg x="8" y="8" width="112" height="112" ');
const base = `<defs><clipPath id="corners"><rect x="8" y="8" width="112" height="112" rx="21"/></clipPath></defs><g clip-path="url(#corners)">${artwork}</g>`;
const dir = fileURLToPath(new URL('../public/icons/', import.meta.url));

for (const [state, color, sizes] of [
  ['default', '#d1d5db', [16, 32, 48, 128]],
  ['found', '#16a34a', [16, 32]],
  ['missing', '#dc2626', [16, 32]],
]) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${base}<circle cx="96" cy="96" r="32" fill="${color}"/></svg>`,
  );

  for (const size of sizes) {
    await sharp(svg, { density: (72 * size) / 128 })
      .png()
      .toFile(`${dir}${size}-${state}.png`);
  }
}

const popup = source
  .replace(
    '<path fill="#ffa81b"',
    '<defs><clipPath id="corners"><rect width="209" height="209" rx="26"/></clipPath></defs><g clip-path="url(#corners)"><path fill="#ffa81b"',
  )
  .replace('</svg>', '</g></svg>');

await sharp(Buffer.from(popup)).resize(32, 32).png().toFile(`${dir}32-popup.png`);
