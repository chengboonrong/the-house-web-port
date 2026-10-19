#!/usr/bin/env node
/**
 * Research-only archive attachment resolver.
 * Reads the LIVE PUBLIC article each time, because Kakao's SWF links expire.
 * By default prints redacted metadata. --download privately saves matching SWF.
 * No bypass of signed links, access controls, or authentication.
 */
import { mkdir, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { extractKakaoSwfs, redactedAttachment } from './lib/kakao-attachments.mjs';

const article = process.argv[2];
const filename = process.argv[3];
const download = process.argv.includes('--download');
if (!article || !filename) {
  console.error('Usage: node scripts/resolve-kakao-swf.mjs https://vidkidz.tistory.com/541 Diningroom.swf [--download]');
  process.exit(2);
}
const pageURL = new URL(article);
if (pageURL.protocol !== 'https:' || pageURL.hostname !== 'vidkidz.tistory.com' || !/^\/\d+$/.test(pageURL.pathname)) {
  throw new Error('Only public vidkidz.tistory.com numeric article pages are supported');
}
if (!/^[\w .-]+\.swf$/i.test(filename)) throw new Error('Invalid SWF filename');
const response = await fetch(pageURL, {
  headers: { Accept: 'text/html,application/xhtml+xml' },
  redirect: 'error', signal: AbortSignal.timeout(12000)
});
if (!response.ok) throw new Error('Article response HTTP ' + response.status);
const html = await response.text();
const matches = extractKakaoSwfs(html, filename);
if (!matches.length) throw new Error('No matching public attachment URL in live article HTML');
const candidate = matches.find(x => x.expiresAt === null || x.expiresAt > Date.now()) ?? matches[0];
const metadata = redactedAttachment(candidate);
const output = {
  article: pageURL.toString(), file: filename,
  host: metadata.host, path: metadata.pathname,
  expiresAt: metadata.expiresAt, expired: metadata.expired,
  hasTemporarySignature: metadata.hasTemporarySignature,
  binaryVerified: false,
  note: 'Metadata only; signed query parameters not recorded.'
};
if (!download) { console.log(JSON.stringify(output,null,2)); process.exit(0); }
if (output.expired) throw new Error('Public article exposes only an expired signed link; no bypass attempted.');
const target = resolve('research-private', filename);
try { await lstat(target); throw new Error('Refusing to overwrite existing private SWF'); }
catch (e) { if (e?.code !== 'ENOENT') throw e; }
const swfResponse = await fetch(candidate.url, {redirect:'error',signal:AbortSignal.timeout(20000)});
if (!swfResponse.ok) throw new Error('Attachment HTTP ' + swfResponse.status);
const reported = Number(swfResponse.headers.get('content-length') ?? 0);
if (reported > 8_000_000) throw new Error('Attachment exceeds 8 MiB cap');
const bytes = Buffer.from(await swfResponse.arrayBuffer());
if (bytes.length < 8 || bytes.length > 8_000_000 || !['FWS','CWS','ZWS'].includes(bytes.subarray(0,3).toString('ascii'))) {
  throw new Error('Attachment is not a plausible SWF; refused to store');
}
await mkdir(resolve('research-private'), {recursive:true});
await writeFile(target,bytes,{flag:'wx'});
console.log(JSON.stringify({...output,binaryVerified:true,privatePath:target,bytes:bytes.length,
  sha256:createHash('sha256').update(bytes).digest('hex')},null,2));
