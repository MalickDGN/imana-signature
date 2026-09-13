import { cp, mkdir, readdir, rm, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

// Only media and approved styles are copied. Pages and interactions now live in TSX.
const workspace = fileURLToPath(new URL('../../../', import.meta.url));
const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));
await mkdir(resolve(publicDirectory, 'assets'), { recursive: true });
for (const entry of await readdir(resolve(workspace, 'assets'), { withFileTypes: true })) {
  if (entry.name === 'js') continue;
  await cp(resolve(workspace, 'assets', entry.name), resolve(publicDirectory, 'assets', entry.name), { recursive: true });
}
// Remove only generated copies inside this application's public directory.
for (const file of ['index.html', 'la-maison.html', 'magazine.html', 'catalogue.html']) {
  await unlink(resolve(publicDirectory, file)).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
const legacyScripts = resolve(publicDirectory, 'assets/js');
if (!legacyScripts.startsWith(resolve(publicDirectory) + sep)) throw new Error('Invalid generated resource path');
await rm(legacyScripts, { recursive: true, force: true });
console.log('Storefront media synchronized; public pages and interactions are served by TypeScript.');
