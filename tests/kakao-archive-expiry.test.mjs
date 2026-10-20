import test from 'node:test';
import assert from 'node:assert/strict';
import { extractKakaoSwfs, redactedAttachment } from '../scripts/lib/kakao-attachments.mjs';

test('2026-07 archive link is expired on 2026-10-20; preserve original timestamp', () => {
  const html = '<a href="https://blog.kakaocdn.net/dna/sample/Diningroom.swf?expires=1785509999&amp;signature=test">Diningroom.swf</a>';
  const candidates = extractKakaoSwfs(html, 'Diningroom.swf');
  assert.equal(candidates.length, 1);
  const status = redactedAttachment(candidates[0], Date.parse('2026-10-20T00:00:00Z'));
  assert.equal(status.expiresAt, '2026-07-31T14:59:59.000Z');
  assert.equal(status.expired, true);
  assert.equal(JSON.stringify(status).includes('signature=test'), false);
});
