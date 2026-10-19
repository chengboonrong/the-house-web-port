#!/usr/bin/env node
/**
 * Passive provenance scanner for lawfully obtained SWF files and historical HTML.
 * No code execution, no network calls, no redistribution of binary contents.
 */
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { extname } from 'node:path';
const sources = process.argv.slice(2);
if (!sources.length) {
  console.error('Usage: node scripts/inspect-flash-references.mjs file.swf [archived.html ...]');
  process.exit(2);
}
const results = [];
for (const source of sources) {
  const data = await readFile(source);
  if (data.byteLength > 64 * 1024 * 1024) throw new Error('File too large for passive scan: ' + source);
  let bytes = data;
  let type = 'text';
  let swfVersion = null;
  let declaredLength = null;
  let warning = null;
  if (['FWS','CWS','ZWS'].includes(data.subarray(0,3).toString('latin1'))) {
    type = data.subarray(0,3).toString('latin1');
    if (data.byteLength < 8) throw new Error('Truncated SWF header');
    swfVersion = data[3];
    declaredLength = data.readUInt32LE(4);
    if (type === 'CWS') {
      if (declaredLength > 128 * 1024 * 1024) throw new Error('Decompressed SWF too large');
      const body = inflateSync(data.subarray(8), { maxOutputLength: 128 * 1024 * 1024 });
      bytes = Buffer.concat([data.subarray(0,8), body]);
    } else if (type === 'ZWS') {
      bytes = data.subarray(0,8);
      warning = 'ZWS/LZMA content not decompressed. Inspect with FFDec.';
    }
  } else if (!['.htm','.html','.js','.xml','.txt'].includes(extname(source).toLowerCase())) {
    warning = 'Unknown format; treating bytes as text for reference discovery.';
  }
  const body = bytes.toString('latin1');
  const patterns = [
    /(?:https?:\/\/|\/)?[a-zA-Z0-9_.~%-]+(?:\/[a-zA-Z0-9_.~%-]+)*\.(?:swf|xml|mp3|wav|flv|jpg|jpeg|png)(?:\?[a-zA-Z0-9_=&.%-]*)?/gi,
    /(?:src|data|movie|base)\s*[=:]\s*["']([^"'<>]+)["']/gi
  ];
  const references = new Set();
  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      const value = (match[1] ?? match[0]).trim();
      if (value.length <= 512 && !/[<>\x00-\x1f]/.test(value)) references.add(value);
      if (references.size >= 500) break;
    }
  }
  results.push({file: source, type, swfVersion, declaredLength, actualBytes:data.byteLength,
    references:[...references].sort(), warning,
    note:'Heuristic string matches only. Not a verified dependency graph or runtime execution trace.'});
}
console.log(JSON.stringify({format:'passive-flash-reference-scan-v1',files:results},null,2));
