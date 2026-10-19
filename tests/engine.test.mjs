import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('engine guards interaction transitions', () => {
  const source = readFileSync(new URL('../src/engine.ts', import.meta.url), 'utf8');
  assert.match(source, /state\.status !== 'playing'/);
  assert.match(source, /current\.target !== target/);
});
