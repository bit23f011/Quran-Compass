'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { SurahCycle, validState } = require('../core.js');
require('../data/surahs.js');

const allIds = Array.from({ length: 114 }, (_, i) => i + 1);
const shortIds = SURAHS.filter(s => s.total_verses <= 10).map(s => s.id);
const medinanIds = SURAHS.filter(s => s.type === 'medinan').map(s => s.id);
const juz30Ids = SURAHS.filter(s => s.juz[0] <= 30 && s.juz[1] >= 30).map(s => s.id);
function rng(seed = 726811) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
const sort = ids => [...ids].sort((a, b) => a - b);

test('changing overlapping revelation, length, and juz filters shares one no-repeat global bag', () => {
  const cycle = new SurahCycle(undefined, 114, rng());
  const selected = new Set();
  for (const filter of [shortIds, medinanIds, juz30Ids, shortIds, allIds]) {
    while (true) {
      const remainingEligible = cycle.state.remaining.filter(id => filter.includes(id));
      if (!remainingEligible.length) break;
      const id = cycle.next(filter);
      assert.ok(filter.includes(id), `Selection ${id} is outside the active filter`);
      assert.ok(!selected.has(id), `Selection ${id} repeated after changing filters`);
      selected.add(id);
      assert.equal(cycle.state.cycle, 1);
      assert.ok(validState(cycle.serialize(), 114));
    }
  }
  assert.equal(selected.size, 114);
  assert.deepEqual(sort(cycle.state.history), allIds);
});

test('an exhausted subset returns null and leaves all undiscovered chapters and history untouched', () => {
  const cycle = new SurahCycle(undefined, 114, rng());
  const selected = [];
  for (let i = 0; i < shortIds.length; i++) selected.push(cycle.next(shortIds));
  assert.deepEqual(sort(selected), sort(shortIds));
  const before = cycle.serialize();
  assert.ok(before.remaining.length > 0);
  for (let i = 0; i < 5; i++) assert.equal(cycle.next(shortIds), null);
  assert.deepEqual(cycle.serialize(), before);
  const next = cycle.next();
  assert.ok(!shortIds.includes(next));
  assert.equal(cycle.state.cycle, 1);
});

test('empty and invalid allowed IDs never start a new cycle, including after all 114 are complete', () => {
  const cycle = new SurahCycle(undefined, 114, rng());
  const invalid = [[], [0, 115, -1, 1.5, NaN, Infinity], ['1', null, undefined, {}]];
  for (const allowed of invalid) {
    const before = cycle.serialize();
    assert.equal(cycle.next(allowed), null);
    assert.deepEqual(cycle.serialize(), before);
  }
  for (let i = 0; i < 114; i++) cycle.next();
  const complete = cycle.serialize();
  assert.equal(complete.remaining.length, 0);
  for (const allowed of invalid) {
    assert.equal(cycle.next(allowed), null);
    assert.deepEqual(cycle.serialize(), complete);
  }
  assert.equal(cycle.next([114]), 114);
  assert.equal(cycle.state.cycle, 2);
  assert.deepEqual(cycle.state.history, [114]);
  assert.equal(cycle.state.remaining.length, 113);
});

test('duplicate allowed IDs cannot increase selection weight or put a chapter back into the queue', () => {
  const cycle = new SurahCycle(undefined, 114, rng());
  assert.equal(cycle.next([1, 1, 1, 0, '1']), 1);
  const before = cycle.serialize();
  assert.equal(cycle.next([1, 1]), null);
  assert.deepEqual(cycle.serialize(), before);
  assert.equal(cycle.next([2, 2]), 2);
  assert.deepEqual(cycle.state.history, [1, 2]);
});

test('reloading after a filtered selection preserves the global queue and future filtered order', () => {
  const first = new SurahCycle(undefined, 114, rng());
  const filters = [shortIds, medinanIds, juz30Ids];
  for (let i = 0; i < 18; i++) first.next(filters[i % filters.length]);
  const checkpoint = first.serialize();
  const resumed = new SurahCycle(checkpoint, 114, rng(99));
  assert.deepEqual(resumed.serialize(), checkpoint);
  for (const filter of [...filters, allIds]) {
    while (first.state.remaining.some(id => filter.includes(id))) {
      const expected = first.next(filter);
      assert.equal(resumed.next(filter), expected);
      assert.deepEqual(resumed.serialize(), first.serialize());
    }
  }
  assert.deepEqual(sort(resumed.state.history), allIds);
});

test('malformed non-array filters cannot mutate or reset the cycle', () => {
  const cycle = new SurahCycle(undefined, 114, rng());
  cycle.next([1]);
  for (const filter of [null, {}, 'all', 114]) {
    const before = cycle.serialize();
    try { assert.equal(cycle.next(filter), null); }
    catch (error) { assert.ok(error instanceof TypeError, 'Only a validation/type error is acceptable'); }
    assert.deepEqual(cycle.serialize(), before);
  }
});
