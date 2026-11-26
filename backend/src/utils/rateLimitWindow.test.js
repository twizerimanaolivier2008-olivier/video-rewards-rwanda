import test from 'node:test';
import assert from 'node:assert/strict';
import { getWindowStart } from './rateLimitWindow.js';

test('fixed windows start on exact epoch-aligned boundaries', () => {
  assert.equal(getWindowStart(0, 60), 0);
  assert.equal(getWindowStart(59999, 60), 0);
  assert.equal(getWindowStart(60000, 60), 60);
  assert.equal(getWindowStart(179999, 60), 120);
});

test('fixed windows reject invalid inputs', () => {
  assert.throws(() => getWindowStart(-1, 60), TypeError);
  assert.throws(() => getWindowStart(1000, 0), TypeError);
  assert.throws(() => getWindowStart(Number.NaN, 60), TypeError);
});
