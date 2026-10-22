#!/usr/bin/env node
// LOCAL RESEARCH TOOL ONLY. Never redistributes game files.
import { stat, lstat, readdir, mkdir, copyFile, readFile, writeFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, join, sep, posix, dirname } from 'node:path';

function arg(name) {
  const index = process.argv.indexOf('--' + name);
  return index < 0 ? null : process.argv[index + 1];
}
const sourceArg = arg('source');
const entryArg = arg('entry');
const stage = process.argv.includes('--stage');
if (!sourceArg || !entryArg) {
  console.error('Usage: node scripts/stage-swf.mjs --source ./local-copy --entry path/to/start.swf [--stage]');
  process.exit(2);
}
const source = resolve(sourceArg);
const dest = resolve('public/original');
const entry = entryArg.replaceAll('\\', '/');
if (!/^[a-zA-Z0-9_.\/ -]+\.swf$/i.test(entry) || entry.split('/').some(x => x === '..' || x === '.' || !x)) {
  throw new Error('Invalid relative SWF entry path');
}
const srcInfo = await lstat(source);
if (!srcInfo.isDirectory() || srcInfo.isSymbolicLink()) throw new Error('Source must be a real directory');
if (source === dest || source.startsWith(dest + sep) || dest.startsWith(source + sep)) {
  throw new Error('Source and staging directories must not overlap');
}
const inventory = [];
async function walk(dir, prefix = '') {
  for (const item of (await readdir(dir)).sort()) {
    const abs = join(dir,item);
    const info = await lstat(abs);
    if (info.isSymbolicLink()) throw new Error('Symlink refused: ' + abs);
    const rel = prefix ? prefix + '/' + item : item;
    if (info.isDirectory()) { await walk(abs, rel); continue; }
    if (!info.isFile()) throw new Error('Non-regular file refused: ' + abs);
    const file = await readFile(abs);
    inventory.push({path:rel,size:file.byteLength,sha256:createHash('sha256').update(file).digest('hex')});
  }
}
await walk(source);
if (!inventory.some(f => f.path === entry)) throw new Error('Entrypoint not found: ' + entry);
const report = {format:'swf-local-ledger-v1',entry,files:inventory};
if (!stage) {
  console.log(JSON.stringify(report,null,2));
  console.error('Inventory-only. Add --stage to create a local ignored staging tree.');
} else {
  if (await lstat(dest).then(()=>true,()=>false)) throw new Error('Refusing to overwrite an existing staging tree: ' + dest);
  await mkdir(dest,{recursive:true});
  for (const file of inventory) {
    const to = join(dest,...file.path.split('/'));
    await mkdir(dirname(to),{recursive:true});
    await copyFile(join(source,...file.path.split('/')),to);
  }
  await writeFile(join(dest,'port-manifest.json'),JSON.stringify({
    enabled:true, entry:'/original/' + entry, format:'swf-local-manifest-v1'
  },null,2) + '\n');
  await writeFile(join(dest,'inventory.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Research copy staged under ignored public/original; production build is intentionally blocked while it exists.');
}
