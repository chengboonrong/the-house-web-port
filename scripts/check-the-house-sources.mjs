#!/usr/bin/env node
/**
 * Local, source-scoped batch research. Uses the existing resolver to fetch
 * PUBLIC article metadata. No downloads unless --download is explicitly set.
 * Never outputs signed query parameters or stores game bytes in Git.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const targets = [
  { room: 'Dining Room', page: 'https://vidkidz.tistory.com/541', file: 'Diningroom.swf' },
  { room: 'Bathroom', page: 'https://vidkidz.tistory.com/543', file: 'Bathroom.swf' },
  { room: 'Kitchen', page: 'https://vidkidz.tistory.com/544', file: 'Kitchen.swf' },
  { room: 'Living Room', page: 'https://vidkidz.tistory.com/545', file: 'Livingroom.swf' },
  { room: 'Corridor', page: 'https://vidkidz.tistory.com/546', file: 'Corridor.swf' },
  { room: 'Credits', page: 'https://vidkidz.tistory.com/546', file: 'Credit.swf' },
];
const download = process.argv.includes('--download');
const selected = process.argv.find(arg => arg.startsWith('--only='))?.slice('--only='.length);
const jobs = selected ? targets.filter(t => t.file.toLowerCase() === selected.toLowerCase()) : targets;
if (!jobs.length) throw new Error('No matching filename in documented first-game candidates');
const script = resolve('scripts/resolve-kakao-swf.mjs');

function run(args) {
  return new Promise(done => {
    const child = spawn(process.execPath, [script,...args],{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data', c => { if(stdout.length < 64000) stdout+=c.toString(); });
    child.stderr.on('data', c => { if(stderr.length < 8000) stderr+=c.toString(); });
    child.on('error', error => done({exitCode:-1,error:error.message}));
    child.on('close', code => {
      let parsed=null;
      try { parsed=JSON.parse(stdout); } catch {}
      done({exitCode:code, data:parsed, error: code===0?undefined:stderr.trim().slice(0,1000)});
    });
  });
}
const results=[];
for(const job of jobs){
  const args=[job.page,job.file,...(download?['--download']:[])];
  const result=await run(args);
  results.push({room:job.room,sourcePage:job.page,filename:job.file,...result});
}
console.log(JSON.stringify({
  format:'the-house-2005-public-source-check-v1',
  downloadAttempted:download,
  checkedAt:new Date().toISOString(),
  results,
  caveat:'Only source archive candidate checks; SWF original-release identity and redistribution rights remain unverified.'
},null,2));
if(results.some(x=>x.exitCode!==0))process.exitCode=1;
