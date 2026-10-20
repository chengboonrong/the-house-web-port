#!/usr/bin/env node
/**
 * Research-only Flashpoint first-game discovery. No game downloads.
 * API contract cross-checked against Jonathan8520/FlashNX source on 2026-10-20.
 */
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const API = 'https://flashpointarchive.org/api/search';
const SEARCHES = ['"The" "House" platform:Flash', 'dev:"Sinthai" platform:Flash'];
function normal(s) { return String(s ?? '').trim(); }
export function classify(g) {
  const title = normal(g.title);
  const developer = normal(g.developer);
  const platform = normal(g.platform || g.platformName);
  const date = normal(g.releaseDate);
  const matchesTitle = /^the\s*house$/i.test(title);
  const matchesDeveloper = /sinthai/i.test(developer);
  const isSequel = /^the\s*house\s*(?:2|ii)$/i.test(title);
  const matchesFlash = !platform || /flash/i.test(platform);
  // Historical dates might be missing from the database; do not require exact 2005 date.
  const score = Number(matchesTitle)*3 + Number(matchesDeveloper)*4 + Number(matchesFlash)
    + Number(/2005/.test(date));
  return {
    status: matchesTitle && matchesDeveloper && matchesFlash && !isSequel
      ? 'CANDIDATE_REVIEW_REQUIRED' : 'NOT_CONFIRMED_OR_NAMESAKE',
    score,
    id: normal(g.id), title, developer, platform, releaseDate:date,
    gameData: Array.isArray(g.gameData) ? g.gameData.map(d=>({
      dateAdded: normal(d.dateAdded), launchCommand: normal(d.launchCommand),
      size: typeof d.size==='number'?d.size:null
    })) : [],
    legacyLaunchCommand: normal(g.legacyLaunchCommand),
    warning:'Metadata alone cannot establish authentic SWF bytes or right to redistribute.'
  };
}
export function parseResult(body) {
  if (!body || !Array.isArray(body.games)) throw new Error('Flashpoint API payload missing games[]');
  return body.games.map(classify).sort((a,b)=>b.score-a.score);
}
async function main() {
  const snapshotFlag = process.argv.indexOf('--snapshot');
  const snapshot = snapshotFlag === -1 ? null : process.argv[snapshotFlag+1];
  if (snapshotFlag !== -1 && (!snapshot || snapshot.startsWith('--'))) {
    throw new Error('--snapshot requires JSON file path');
  }
  const pages=[];
  if (snapshot) pages.push({query:'OFFLINE_SNAPSHOT',data:JSON.parse(await readFile(snapshot,'utf8'))});
  else for (const query of SEARCHES) {
    const url = new URL(API);url.searchParams.set('query',query);url.searchParams.set('limit','100');
    let response;
    try { response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(12000)}); }
    catch(error){throw new Error('Flashpoint API unavailable ('+
      (error?.cause?.code??error?.code??error?.name??'NETWORK_ERROR')+
      '); do not interpret a network failure as no game entry');}
    if(!response.ok)throw new Error('Flashpoint API HTTP '+response.status);
    pages.push({query,data:await response.json()});
  }
  const found=new Map();
  for(const page of pages) for(const game of parseResult(page.data)) {
    if(!game.id) continue;
    if(!found.has(game.id)) found.set(game.id,{...game,matchedBy:[page.query]});
    else found.get(game.id).matchedBy.push(page.query);
  }
  const entries=[...found.values()].sort((a,b)=>b.score-a.score);
  console.log(JSON.stringify({format:'flashpoint-first-game-public-api-review-v1',
    source:snapshot?'OFFLINE_SNAPSHOT':'LIVE_FLASHPOINT_API',
    queries:pages.map(p=>p.query),count:entries.length,
    candidates:entries.filter(g=>g.status==='CANDIDATE_REVIEW_REQUIRED'),
    otherMatches:entries.filter(g=>g.status!=='CANDIDATE_REVIEW_REQUIRED'),
    caution:'A matching UUID must still be cross-checked against original release, launch URL, GameZIP/Legacy files, SHA-256 and permission.'},null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
