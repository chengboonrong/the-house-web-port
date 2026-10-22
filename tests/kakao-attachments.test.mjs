import test from 'node:test';
import assert from 'node:assert/strict';
import { extractKakaoSwfs, redactedAttachment } from '../scripts/lib/kakao-attachments.mjs';

test('extracts signed SWF links with HTML entities and refuses other hosts', () => {
  const html = '<a href="https://blog.kakaocdn.net/dna/test/Diningroom.swf?expires=1785509999&amp;signature=secret&amp;credential=private">file</a>'
    + '<a href="https://evil.example.net/Room.swf">not allowed</a>';
  const matches = extractKakaoSwfs(html, 'Diningroom.swf');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].filename, 'Diningroom.swf');
  assert.equal(matches[0].url.searchParams.get('signature'), 'secret');
  const metadata = JSON.stringify(redactedAttachment(matches[0], 0));
  assert.equal(metadata.includes('secret'), false);
  assert.equal(metadata.includes('private'), false);
  assert.match(metadata, /Diningroom.swf/);
});

test('extracts escaped slash URLs from inline JS', () => {
  const html = String.raw`{"download":"https:\/\/blog.kakaocdn.net\/a\/Bathroom.swf?expires=1785509999"}`;
  assert.equal(extractKakaoSwfs(html, 'Bathroom.swf').length, 1);
});

test('does not confuse unrelated filenames or archives', () => {
  assert.equal(extractKakaoSwfs('https://blog.kakaocdn.net/a/TheHouse2.swf', 'Diningroom.swf').length, 0);
  assert.equal(extractKakaoSwfs('https://elsewhere.example/a/Diningroom.swf').length, 0);
});

test('extracts opaque Kakao CDN path when SWF filename is only link text', () => {
  const html = '<a class="file" href="https://blog.kakaocdn.net/dn/opaque/btq123/abcd?expires=1785509999&amp;signature=secret">Diningroom.swf 0.42MB</a>';
  const found = extractKakaoSwfs(html, 'Diningroom.swf');
  assert.equal(found.length, 1);
  assert.equal(found[0].url.pathname, '/dn/opaque/btq123/abcd');
  assert.equal(found[0].filename, 'Diningroom.swf');
  assert.equal(JSON.stringify(redactedAttachment(found[0])).includes('secret'), false);
});

test('resolves opaque attachment with download attribute and excludes other files', () => {
  const html = '<a download="Bathroom.swf" href="https://blog.kakaocdn.net/a/opaque?signature=hidden">Download</a>'
    + '<a href="https://blog.kakaocdn.net/a/other" download="Kitchen.swf">Kitchen</a>';
  const found = extractKakaoSwfs(html, 'Bathroom.swf');
  assert.equal(found.length, 1);
  assert.equal(found[0].filename, 'Bathroom.swf');
});
