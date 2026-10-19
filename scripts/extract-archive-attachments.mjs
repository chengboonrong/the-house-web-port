#!/usr/bin/env node
/**
 * Parse archived HTML for signed SWF attachment references.
 * No requests, downloads, authentication, or SWF execution.
 * Deliberately redacts credentials/signatures from JSON output.
 */
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/extract-archive-attachments.mjs saved-page.html');
  process.exit(2);
}
const html = await readFile(file, 'utf8');
if (html.length > 16_000_000) throw new Error('HTML file exceeds scan limit');
const decode = value => value.replace(/&amp;/g, '&').replace(/&#38;/g, '&')
  .replace(/&quot;/g, '"').replace(/\\\//g, '/');
const candidates = new Set();
for (const match of html.matchAll(/(?:https?:\\?\/\\?\/|\/\/)[^\s"'<>`]{0,2500}?\.swf(?:\?[^\s"'<>`]{0,1500})?/gi)) {
  candidates.add(decode(match[0]));
  if (candidates.size > 250) break;
}
const attachments = [];
for (const candidate of candidates) {
  try {
    const url = new URL(candidate.startsWith('//') ? 'https:' + candidate : candidate);
    if (!/^https?:$/.test(url.protocol)) continue;
    const expiry = url.searchParams.get('expires');
    const expiresAt = expiry && /^\d{9,13}$/.test(expiry)
      ? new Date(Number(expiry) * (expiry.length > 10 ? 1 : 1000)).toISOString()
      : null;
    attachments.push({
      host: url.hostname,
      pathname: url.pathname,
      filename: decodeURIComponent(basename(url.pathname)),
      expiresAt,
      signed: ['signature','credential','token','key'].some(key => url.searchParams.has(key)),
      note: 'Archived URL observation only, not a verified download or original SHA-256.'
    });
  } catch { /* malformed historical link */ }
}
console.log(JSON.stringify({
  format: 'swf-archive-attachment-index-v1',
  page: file, candidates: attachments.sort((a,b)=>a.pathname.localeCompare(b.pathname)),
  security: 'URL query strings intentionally omitted to avoid leaking temporary credentials'
},null,2));
