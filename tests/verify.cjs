'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { SurahCycle, validState, shuffle, randomInt } = require('../core.js');
require('../data/surahs.js');

const allIds = Array.from({ length: 114 }, (_, i) => i + 1);
function rng(seed = 123456789) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function sorted(ids) { return [...ids].sort((a, b) => a - b); }

test('every cycle discovers all 114 exactly once, then creates a fresh cycle', () => {
  const compass = new SurahCycle(undefined, 114, rng());
  for (let cycle = 1; cycle <= 10; cycle++) {
    const picks = [];
    for (let i = 0; i < 114; i++) {
      const pick = compass.next();
      assert.ok(!picks.includes(pick), `Duplicate ${pick} in cycle ${cycle}`);
      picks.push(pick);
      assert.equal(compass.state.cycle, cycle);
      assert.equal(compass.state.remaining.length, 113 - i);
      assert.equal(compass.state.history.length, i + 1);
      assert.ok(validState(compass.serialize(), 114));
    }
    assert.deepEqual(sorted(picks), allIds);
  }
});

test('resume at every point in a cycle preserves the remaining queue and avoids repeats', () => {
  for (let pauseAt = 0; pauseAt <= 114; pauseAt++) {
    const first = new SurahCycle(undefined, 114, rng(pauseAt + 1));
    for (let i = 0; i < pauseAt; i++) first.next();
    const persisted = JSON.parse(JSON.stringify(first.serialize()));
    const resumed = new SurahCycle(persisted, 114, rng(900));
    assert.deepEqual(resumed.serialize(), persisted);
    if (pauseAt === 114) {
      resumed.next();
      assert.equal(resumed.state.cycle, 2);
      assert.equal(resumed.state.history.length, 1);
    } else {
      while (resumed.state.remaining.length) {
        const pick = resumed.next();
        assert.ok(!persisted.history.includes(pick));
      }
      assert.deepEqual(sorted(resumed.state.history), allIds);
    }
  }
});

test('persisted state and serialized results are isolated from external mutation', () => {
  const first = new SurahCycle(undefined, 114, rng());
  first.next();
  const state = first.serialize();
  const resumed = new SurahCycle(state);
  state.history.length = 0;
  state.remaining[0] = 999;
  assert.equal(resumed.state.history.length, 1);
  assert.ok(validState(resumed.serialize(), 114));
  const snapshot = resumed.serialize();
  snapshot.history.push(999);
  assert.equal(resumed.state.history.length, 1);
});

test('corrupt, duplicate, missing, out-of-range, and malformed state cannot cause repeated selections', () => {
  const base = new SurahCycle(undefined, 114, rng()).serialize();
  const duplicate = structuredClone(base); duplicate.remaining[0] = duplicate.remaining[1];
  const missing = structuredClone(base); missing.remaining.pop();
  const fractional = structuredClone(base); fractional.remaining[0] = 1.5;
  const outOfRange = structuredClone(base); outOfRange.remaining[0] = 115;
  const invalids = [null, {}, 'garbage', { ...base, version: 2 }, { ...base, cycle: 0 }, { ...base, cycle: NaN }, { ...base, cycle: 1.5 }, { ...base, history: null }, duplicate, missing, fractional, outOfRange];
  for (const corrupt of invalids) {
    assert.equal(validState(corrupt, 114), false);
    const recovered = new SurahCycle(corrupt, 114, rng());
    assert.equal(recovered.state.cycle, 1);
    assert.equal(recovered.state.history.length, 0);
    assert.deepEqual(sorted(recovered.state.remaining), allIds);
    assert.ok(validState(recovered.serialize(), 114));
  }
});

test('reset makes all Surahs available and advances the journey counter', () => {
  const compass = new SurahCycle(undefined, 114, rng());
  for (let i = 0; i < 43; i++) compass.next();
  compass.reset();
  assert.equal(compass.state.cycle, 2);
  assert.deepEqual(compass.state.history, []);
  assert.deepEqual(sorted(compass.state.remaining), allIds);
  const ids = Array.from({ length: 114 }, () => compass.next());
  assert.deepEqual(sorted(ids), allIds);
});

test('shuffling retains input and supports edge random values', () => {
  const original = [1, 2, 3, 4];
  for (const value of [0, 0.9999999999]) {
    const result = shuffle(original, () => value);
    assert.deepEqual(original, [1, 2, 3, 4]);
    assert.deepEqual(sorted(result), original);
    assert.notEqual(result, original);
  }
  assert.equal(randomInt(1), 0);
  for (const invalid of [0, -1, 1.1, NaN, Infinity]) assert.throws(() => randomInt(invalid), RangeError);
});

test('catalogue has every canonical Surah and totals 6,236 ayahs', () => {
  const surahs = globalThis.SURAHS;
  assert.equal(surahs.length, 114);
  assert.deepEqual(surahs.map(s => s.id), allIds);
  assert.equal(surahs.reduce((sum, s) => sum + s.total_verses, 0), 6236);
  assert.deepEqual(sorted(surahs.map(s => s.revelation_order)), allIds);
  for (const s of surahs) {
    assert.match(s.name, /[\u0600-\u06ff]/);
    assert.ok(s.transliteration.length > 0 && s.translation.length > 0);
    assert.ok(['meccan', 'medinan'].includes(s.type));
    assert.ok(Number.isInteger(s.total_verses) && s.total_verses > 0);
    assert.equal(s.juz.length, 2);
    assert.ok(s.juz.every(j => Number.isInteger(j) && j >= 1 && j <= 30));
    assert.ok(s.juz[0] <= s.juz[1]);
    assert.ok(s.overview.length > 40, `Missing overview for ${s.id}`);
    assert.ok(s.themes.length >= 3 && s.themes.every(theme => typeof theme === 'string' && theme.length > 0));
  }
  for (const [id, count] of [[1, 7], [2, 286], [9, 129], [18, 110], [36, 83], [55, 78], [67, 30], [108, 3], [112, 4], [114, 6]]) assert.equal(surahs[id - 1].total_verses, count);
});
