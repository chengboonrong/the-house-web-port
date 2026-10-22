#!/usr/bin/env node
// Validates a locally staged, authorized research collection. No redistribution.
import { readFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join, sep } from 'node:path';
const root = resolve('public/original');
const ledger = JSON.parse(await readFile(join(root, 'inventory.json'),'utf8'));
const manifest = JSON.parse(await readFile(join(root, 'port-manifest.json'),'utf8'));
if (ledger.format !== 'swf-local-ledger-v1' || manifest.format !== 'swf-local-manifest-v1') throw new Error('Unrecognized ledger/manifest');
if (manifest.enabled !== true || manifest.entry !== '/original/' + ledger.entry) throw new Error('Entry mismatch');
if (!Array.isArray(ledger.files) || ledger.files.length === 0) throw new Error('No files in ledger');
const mismatches = [];
for (const record of ledger.files) {
  if (typeof record.path !== 'string' || record.path.split('/').some(s => s === '..' || s === '' || s === '.')) throw new Error('Unsafe relative path in ledger');
  const absolute = resolve(root, record.path);
  if (!absolute.startsWith(root + sep)) throw new Error('Ledger file escapes original root');
  try {
    const info = await lstat(absolute);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error('Non-regular file');
    const bytes = await readFile(absolute);
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== record.size || hash !== record.sha256) mismatches.push(record.path);
  } catch (error) { mismatches.push(record.path + ': ' + String(error)); }
}
if (mismatches.length) {
  console.error('Staged assets differ from source inventory:', mismatches);
  process.exitCode = 1;
} else {
  console.log('Verified ' + ledger.files.length + ' staged asset files against local SHA-256 inventory. Dynamic runtime dependencies may still be missing.');
}
