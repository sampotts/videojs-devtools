import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = JSON.parse(readFileSync(`${dist}manifest.json`, 'utf8'));

if (manifest.version !== version)
  throw new Error('Build the extension with the current package version before packaging.');

for (const file of readdirSync(dist)) {
  if (file.endsWith('.zip')) rmSync(`${dist}${file}`);
}

const zip = `${dist}videojs-devtools-${version}.zip`;

execFileSync('zip', ['-qr', zip, '.', '-x', '*.zip', 'detect-videojs.js'], { cwd: dist });
console.log(zip);
