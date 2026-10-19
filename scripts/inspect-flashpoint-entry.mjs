#!/usr/bin/env node
/**
 * Checks a locally exported Flashpoint metadata record against The House (2005).
 * Does not download, launch, upload, or redistribute game files.
 */
import { readFile } from 'node:fs/promises';
const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/inspect-flashpoint-entry.mjs exported-flashpoint-entry.json');
  process.exit(2);
}
const parsed = JSON.parse(await readFile(path, 'utf8'));
const raw = Array.isArray(parsed) ? parsed : (parsed.game ?? parsed.result ?? parsed);
if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a single metadata record');
const str = (...keys) => {
  for (const k of keys) {
    if (typeof raw[k] === 'string' && raw[k].trim()) return raw[k].trim();
  }
  return '';
};
const title = str('title','Title');
const developer = str('developer','Developer','author');
const date = str('releaseDate','release_date','Release Date','date');
const launch = str('launchCommand','launch_command','Launch Command','url');
const id = str('id','ID','uuid');
const platform = str('platform','Platform');
const reasons = [];
if (!/^the\s*house(?:\s*\(2005\))?$/i.test(title)) reasons.push('Title not an exact match for The House (2005)');
if (!/sinthai/i.test(developer)) reasons.push('Developer is not verified as Sinthai');
if (!/(^|\D)2005(\D|$)/.test(date)) reasons.push('Release year 2005 is not verified');
if (!/flash/i.test(platform)) reasons.push('Platform Flash not confirmed');
if (!/^https?:\/\//i.test(launch)) reasons.push('Original launch URL absent or not HTTP(S)');
let launchHost = null;
let launchPath = null;
if (/^https?:\/\//i.test(launch)) {
  try {
    const u = new URL(launch);
    launchHost = u.hostname;
    launchPath = u.pathname;
  } catch { reasons.push('Malformed launch URL'); }
}
console.log(JSON.stringify({
  format:'the-house-first-game-metadata-review-v1',
  candidate:{id,title,developer,date,platform,launchHost,launchPath},
  status: reasons.length ? 'UNVERIFIED' : 'METADATA_MATCH_ONLY',
  warnings: reasons,
  limitation:'A metadata match is NOT a verified SWF binary, rights grant, dependency inventory, or proof of successful port.'
},null,2));
if (reasons.length) process.exitCode=1;
