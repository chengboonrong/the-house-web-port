import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

test('research staging preserves historical SWF filenames with spaces',()=>{
 const dir=mkdtempSync(join(tmpdir(),'thehouse-original-'));
 try {
   writeFileSync(join(dir,'Dining room.swf'),Buffer.from('FWS\u0006fixture'));
   const run=spawnSync(process.execPath,[
    resolve('scripts/stage-swf.mjs'),'--source',dir,'--entry','Dining room.swf'
   ],{encoding:'utf8'});
   assert.equal(run.status,0,run.stderr);
   const result=JSON.parse(run.stdout);
   assert.equal(result.entry,'Dining room.swf');
   assert.equal(result.files[0].path,'Dining room.swf');
 } finally {rmSync(dir,{recursive:true,force:true});}
});
