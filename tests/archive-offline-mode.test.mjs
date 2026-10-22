import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('saved HTML mode resolves known attachment without network and reports expired URL', () => {
  const dir=mkdtempSync(join(tmpdir(),'thehouse-archive-'));
  try {
    const file=join(dir,'saved.html');
    writeFileSync(file,'<a href="https://blog.kakaocdn.net/dn/Diningroom.swf?expires=1785509999&amp;signature=secret">Diningroom.swf</a>');
    const proc=spawnSync(process.execPath,[
      resolve('scripts/resolve-kakao-swf.mjs'),
      'https://vidkidz.tistory.com/541','Diningroom.swf','--html',file
    ],{encoding:'utf8',timeout:5000});
    assert.equal(proc.status,3,proc.stderr);
    const report=JSON.parse(proc.stdout);
    assert.equal(report.source,'SAVED_HTML_UNVERIFIED');
    assert.equal(report.status,'EXPIRED_SIGNED_URL');
    assert.equal(report.binaryVerified,false);
    assert.equal(report.expiresAt,'2026-07-31T14:59:59.000Z');
    assert.doesNotMatch(proc.stdout,/signature=secret/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('offline mode cannot attempt to download a SWF', () => {
  const proc=spawnSync(process.execPath,[
    resolve('scripts/resolve-kakao-swf.mjs'),
    'https://vidkidz.tistory.com/541','Diningroom.swf','--html','saved.html','--download'
  ],{encoding:'utf8',timeout:5000});
  assert.notEqual(proc.status,0);
  assert.match(proc.stderr,/metadata-only/);
});
