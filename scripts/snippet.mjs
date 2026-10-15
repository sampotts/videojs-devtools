import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const dir = fileURLToPath(new URL('../', import.meta.url));

mkdirSync(`${dir}dist`, { recursive: true });
await build({
  stdin: {
    contents: `import { detect } from './src/detect';
const result = detect();
console.log(result.found ? 'Video.js found' : 'Video.js not found');
if (result.blockedFrames) console.info('Some embedded frames could not be checked.');`,
    resolveDir: dir,
  },
  bundle: true,
  format: 'iife',
  target: 'es2022',
  outfile: `${dir}dist/detect-videojs.js`,
});
console.log(`${dir}dist/detect-videojs.js`);
