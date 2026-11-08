/* The same selection engine runs in the browser and the verification suite. */
(function (root) {
  'use strict';
  function randomInt(max, random) {
    if (!Number.isInteger(max) || max < 1) throw new RangeError('Invalid random range');
    if (random) return Math.floor(random() * max);
    if (root.crypto && root.crypto.getRandomValues) {
      const limit = Math.floor(4294967296 / max) * max;
      const value = new Uint32Array(1);
      do { root.crypto.getRandomValues(value); } while (value[0] >= limit);
      return value[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function shuffle(ids, random) {
    const bag = [...ids];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = randomInt(i + 1, random);
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }
  function validState(state, total) {
    if (!state || state.version !== 1 || !Number.isSafeInteger(state.cycle) || state.cycle < 1 || !Array.isArray(state.remaining) || !Array.isArray(state.history)) return false;
    const ids = [...state.remaining, ...state.history];
    return ids.length === total && new Set(ids).size === total && ids.every(id => Number.isInteger(id) && id >= 1 && id <= total);
  }
  class SurahCycle {
    constructor(state, total = 114, random) {
      this.total = total;
      this.random = random;
      this.state = validState(state, total) ? JSON.parse(JSON.stringify(state)) : this.fresh(1);
    }
    fresh(cycle) { return { version: 1, cycle, remaining: shuffle(Array.from({ length: this.total }, (_, i) => i + 1), this.random), history: [] }; }
    next(eligibleIds) {
      const allowed = eligibleIds === undefined ? null : new Set(eligibleIds.filter(id => Number.isInteger(id) && id >= 1 && id <= this.total));
      if (allowed && allowed.size === 0) return null;
      if (!this.state.remaining.length) this.state = this.fresh(this.state.cycle + 1);
      const index = allowed ? this.state.remaining.findLastIndex(id => allowed.has(id)) : this.state.remaining.length - 1;
      // A depleted filter never restarts a partially complete global cycle.
      if (index < 0) return null;
      const [id] = this.state.remaining.splice(index, 1);
      this.state.history.push(id);
      return id;
    }
    reset() { this.state = this.fresh(this.state.cycle + 1); }
    serialize() { return JSON.parse(JSON.stringify(this.state)); }
  }
  const api = { SurahCycle, shuffle, validState, randomInt };
  root.SurahEngine = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
