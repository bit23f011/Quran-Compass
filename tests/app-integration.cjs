'use strict';

// This executes the production app in a minimal DOM, without a browser or network.
// The assertions observe actual event handlers, rendered results, and storage.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { SurahCycle } = require('../core.js');
const root = path.resolve(__dirname, '..');
const STATE_KEY = 'surah-compass-cycle-v1';
const SAVE_KEY = 'surah-compass-saved-v1';
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(root, 'core.js'), 'utf8');
const catalogueSource = fs.readFileSync(path.join(root, 'data/surahs.js'), 'utf8');
const learningSource = fs.readFileSync(path.join(root, 'store.js'), 'utf8');

function seeded(seed = 13) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function makeState(picks = 0) {
  const cycle = new SurahCycle(null, 114, seeded());
  for (let i = 0; i < picks; i++) cycle.next();
  return cycle.serialize();
}
function lockQueue() {
  let tail = Promise.resolve();
  return { request(_name, action) { const result = tail.then(action); tail = result.catch(() => {}); return result; } };
}

function mount({ store = new Map(), rejectWrites = false, locks = lockQueue(), onGet, withLearning = false, hash = '#discover', reducedMotion=true, animation, spinAudio,standalone=false,navigatorStandalone=false,userAgent='',platform='',maxTouchPoints=0,protocol='file:' } = {}) {
  const writes = [];
  const errors=[];
  const events = new Map();
  const elements = new Map();
  const idb = { puts: 0, pack: undefined };
  let focused;
  class Element {
    constructor(id) {
      this.id = id; this.dataset = {}; this.attributes = new Map(); this.listeners = new Map();
      this.textContent = ''; this.value = ''; this.hidden = false; this.disabled = false; this.open = false;
      this.files = []; this.scrollTop = 0; this.tagName = 'DIV';
      this.options = [];
      const classes = new Set();
      this.classList = { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name), toggle: (name, force) => { const yes = force === undefined ? !classes.has(name) : Boolean(force); yes ? classes.add(name) : classes.delete(name); return yes; } };
      this.style = { setProperty(name, value) { this[name] = value; } };
    }
    addEventListener(name, fn) { const fns = this.listeners.get(name) || []; fns.push(fn); this.listeners.set(name, fns); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    set innerHTML(value) { this._html = value; for (const match of String(value).matchAll(/\bid="([^"]+)"/g)) if (!elements.has(match[1])) elements.set(match[1], new Element(match[1])); if(this.tagName==='SELECT'){this.options=[...String(value).matchAll(/<option\b[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map(m=>({value:m[1],textContent:m[2],dataset:{}}));if(!this.options.some(o=>o.value===this.value))this.value=this.options[0]?.value||'';} }
    get innerHTML() { return this._html || ''; }
    showModal() { this.open = true; }
    close() { this.open = false; for (const fn of this.listeners.get('close') || []) fn({ target: this }); }
    focus() { focused = this; }
    click() { return this.emit('click'); }
    scrollTo(options) { this.scrollTop = options.top; }
    getBoundingClientRect() { return { left: 0, top: 0, right: 700, bottom: 800 }; }
    async emit(name, event = {}) { for (const fn of this.listeners.get(name) || []) await fn({ target: this, ...event }); }
  }
  for (const match of index.matchAll(/\bid="([^"]+)"/g)) elements.set(match[1], new Element(match[1]));
  for(const id of ['spin-sound-toggle','spin-sound-label','install-app-button','install-app-label'])if(!elements.has(id))elements.set(id,new Element(id));
  function el(id) { const result = elements.get(id); if (!result) throw new Error(`Missing DOM fixture for ${id}`); return result; }
  if(animation)el('clock-hand').animate=animation;
  for(const match of index.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const select=el(match[1]);select.tagName='SELECT';select.innerHTML=match[2];}
  const segments = Array.from({ length: 114 }, (_, i) => { const g = new Element(`segment-${i+1}`); g.dataset.surah = String(i + 1); return g; });
  const nav = ['discover', 'mushaf', 'library', 'reader', 'journey', 'saved', 'settings'].map(view => { const n = new Element(`nav-${view}`); n.dataset.view = view; return n; });
  const i18n = [...index.matchAll(/\bdata-i18n="([^"]+)"/g)].map((m,i)=>{const e=new Element(`i18n-${i}`);e.dataset.i18n=m[1];return e;});
  const scopeButtons = ['surahs','ayahs','topics'].map(scope=>{const e=new Element(`scope-${scope}`);e.dataset.searchScope=scope;return e;});
  const dialogs = ['surah-dialog', 'reset-dialog', 'about-dialog'].map(el);
  const progress = new Element('progress-track');
  const brand = new Element('brand');
  const tabs = new Element('detail-tabs');
  const meta = new Element('theme-color-meta');
  const documentElement = new Element('html'); documentElement.dataset.theme = 'light';
  const body = new Element('body'); focused = body;
  const document = {
    getElementById: el, documentElement, body,
    get activeElement() { return focused; },
    querySelector(selector) { if (selector === '.progress-track') return progress; if (selector === '.brand') return brand; if (selector === '.detail-tabs') return tabs; if (selector === 'meta[name=theme-color]') return meta; if (selector === 'dialog[open]') return dialogs.find(d => d.open) || null; throw new Error(`Unexpected DOM selector: ${selector}`); },
    querySelectorAll(selector) { if (selector === '.wheel-segment') return segments; if (selector === '[data-view]') return nav; if (selector === '[data-i18n]') return i18n; if (selector === '[data-search-scope]') return scopeButtons; if (selector === 'dialog') return dialogs; if (selector === '[data-close]') return []; throw new Error(`Unexpected DOM selector list: ${selector}`); },
    addEventListener(name, fn) { events.set(`document:${name}`, fn); }
  };
  el('type-filter').value = 'all';
  el('offline-indicator').lastChild = { textContent: '' };
  const globalListeners=new Map();
  const installDisplay={matches:standalone,addEventListener(type,fn){this.listener=fn;}};
  const window = { addEventListener(name, fn) { const list=globalListeners.get(name)||[];list.push(fn);globalListeners.set(name,list);events.set(`window:${name}`,fn); }, dispatchEvent(event) { for(const fn of globalListeners.get(event.type)||[])fn(event);return true; } };
  const readerOpenCalls=[];let mushafOpens=0;
  let stopCalls=0,exitFocusCalls=0;
  const indexedDB = { open() { const request = {}; const db = {
    createObjectStore() {}, close() {},
    transaction() { const tx = { objectStore() { return {
      get() { const get = { result: idb.pack }; queueMicrotask(() => get.onsuccess?.()); return get; },
      put(pack) { idb.puts++; idb.pack = pack; }
    }; } }; queueMicrotask(() => tx.oncomplete?.()); return tx; }
  }; request.result = db; queueMicrotask(() => request.onsuccess?.()); return request; } };
  const context = vm.createContext({
    document, window, indexedDB,
    addEventListener:window.addEventListener,dispatchEvent:window.dispatchEvent,
    CustomEvent:class CustomEvent {constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    CompassReader:{open(id,ayah){readerOpenCalls.push([id,ayah]);},stopAudio(){stopCalls++;},exitFocus(){exitFocusCalls++;}},
    CompassMushaf:{open(){mushafOpens++;}},
    CompassSpinAudio:spinAudio,
    navigator: { locks, standalone:navigatorStandalone,userAgent,platform,maxTouchPoints,clipboard: { async writeText() {} } },
    localStorage: {
      getItem(key) { const value = store.get(key) ?? null; if (onGet) onGet(key, value, store); return value; },
      setItem(key, value) { writes.push([key, value]); if (rejectWrites) throw new Error('Storage quota or policy rejects writes'); store.set(key, value); }
      ,removeItem(key){store.delete(key);}
    },
    location: { protocol, hash },
    history: { replaceState() {} },
    matchMedia: query => query==='(display-mode: standalone)'?installDisplay:{ matches: reducedMotion },
    setTimeout: () => 1, clearTimeout() {},
    console:{...console,error(...args){errors.push(args);}}, Uint32Array, crypto: globalThis.crypto,
  });
  vm.runInContext(coreSource, context, { filename: 'core.js' });
  vm.runInContext(catalogueSource, context, { filename: 'surahs.js' });
  vm.runInContext('globalThis.QURAN = {};', context);
  if(withLearning)vm.runInContext(learningSource,context,{filename:'store.js'});
  vm.runInContext(source, context, { filename: 'app.js' });
  const ready = (async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); })();
  return {
    el, store, writes, idb, ready, segments, events,context,i18n,scopeButtons,readerOpenCalls,globalListeners,errors,installDisplay,
    audioStops:()=>stopCalls,focusExits:()=>exitFocusCalls,mushafOpens:()=>mushafOpens,
    async spin() { el('surah-dialog').close(); await el('spin-button').emit('click'); const id = Number(el('detail-kicker').textContent.match(/SURAH (\d+)/)?.[1]); assert.ok(id >= 1 && id <= 114, 'Production handler should open the selected Surah'); return id; },
    state() { return JSON.parse(store.get(STATE_KEY)); }
  };
}

test('app startup does not overwrite a persisted queue or a newer tab reservation', async () => {
  const snapshot = makeState(1), newer = makeState(2);
  const store = new Map([[STATE_KEY, JSON.stringify(snapshot)]]);
  let injected = false;
  const app = mount({ store, onGet(key, _value, map) { if (key === STATE_KEY && !injected) { injected = true; map.set(STATE_KEY, JSON.stringify(newer)); } } });
  await app.ready;
  assert.equal(app.writes.filter(([key]) => key === STATE_KEY).length, 0);
  assert.deepEqual(app.state(), newer);
  const pick = await app.spin();
  assert.ok(!newer.history.includes(pick));
  assert.equal(app.state().history.length, 3);
});

test('actual spin handler discovers 114 unique Surahs when storage allows reads but rejects writes', async () => {
  const persisted = makeState();
  const store = new Map([[STATE_KEY, JSON.stringify(persisted)]]);
  const app = mount({ store, rejectWrites: true });
  await app.ready;
  const picked = [];
  for (let i = 0; i < 114; i++) {
    const id = await app.spin();
    assert.ok(!picked.includes(id), `Repeated Surah ${id} after a failed storage write`);
    picked.push(id);
    assert.equal(Number(app.el('explored-count').textContent), i + 1);
  }
  assert.equal(new Set(picked).size, 114);
  assert.deepEqual(app.state(), persisted, 'Read-only storage should remain untouched');
  await app.spin();
  assert.equal(Number(app.el('explored-count').textContent), 1);
  assert.equal(app.el('cycle-label').textContent, 'CYCLE 02');
});

test('production app preserves spin reservations across reload and starts a new cycle only after exhaustion', async () => {
  const store = new Map();
  const first = mount({ store }); await first.ready;
  const picks = [];
  for (let i = 0; i < 45; i++) picks.push(await first.spin());
  assert.equal(first.state().history.length, 45);
  const resumed = mount({ store }); await resumed.ready;
  assert.equal(Number(resumed.el('explored-count').textContent), 45);
  for (let i = 45; i < 114; i++) picks.push(await resumed.spin());
  assert.equal(new Set(picks).size, 114);
  assert.equal(resumed.state().cycle, 1);
  assert.equal(resumed.state().remaining.length, 0);
  await resumed.spin();
  assert.equal(resumed.state().cycle, 2);
  assert.equal(resumed.state().history.length, 1);
});

test('reset returns all 114 Surahs while retaining saved favourites', async () => {
  const app = mount(); await app.ready;
  for (let i = 0; i < 23; i++) await app.spin();
  await app.el('save-surah').emit('click');
  const favourites = app.store.get(SAVE_KEY);
  assert.equal(JSON.parse(favourites).length, 1);
  await app.el('confirm-reset').emit('click');
  assert.equal(app.state().cycle, 2);
  assert.deepEqual(app.state().history, []);
  assert.equal(new Set(app.state().remaining).size, 114);
  assert.equal(Number(app.el('explored-count').textContent), 0);
  assert.equal(app.store.get(SAVE_KEY), favourites);
});

test('simultaneous tabs reserve distinct Surahs and retain their own pointer highlight', async () => {
  const store = new Map([[STATE_KEY, JSON.stringify(makeState())]]);
  const locks = lockQueue();
  const first = mount({ store, locks });
  const second = mount({ store, locks });
  await Promise.all([first.ready, second.ready]);
  const [a, b] = await Promise.all([first.spin(), second.spin()]);
  assert.notEqual(a, b);
  assert.equal(first.state().history.length, 2);
  for (const [app, chosen] of [[first, a], [second, b]]) {
    assert.equal(Number(app.el('explored-count').textContent), 2, 'Progress should reconcile reservations made while spinning');
    const selected = app.segments.filter(g => g.classList.contains('selected'));
    assert.equal(selected.length, 1);
    assert.equal(Number(selected[0].dataset.surah), chosen, 'The highlighted wedge should match this tab\'s result');
  }
});

test('raw translation arrays cannot be imported with an assumed English author or language', async () => {
  const app = mount(); await app.ready;
  const surahs = JSON.parse(fs.readFileSync(path.join(root, 'data/surahs.json'), 'utf8'));
  const rawUrdu = surahs.map(s => ({ id: s.id, verses: Array.from({ length: s.total_verses }, (_, i) => ({ id: i + 1, text: 'نص تجريبي', translation: 'اردو آزمائشی متن' })) }));
  const text = JSON.stringify(rawUrdu);
  app.el('pack-file').files = [{ size: Buffer.byteLength(text), async text() { return text; } }];
  await app.el('pack-file').emit('change');
  assert.equal(app.idb.puts, 0, 'Ambiguous language packs must be rejected before persistence');
  assert.ok(!/ready offline|imported/i.test(app.el('toast').textContent));
});

test('a complete pack with explicit language sources is saved and rendered with its own attribution', async () => {
  const app = mount(); await app.ready;
  const surahs = JSON.parse(fs.readFileSync(path.join(root, 'data/surahs.json'), 'utf8'));
  const chapters = Object.fromEntries(surahs.map(s => [s.id, Array.from({ length: s.total_verses }, (_, i) => ({
    id: i + 1, text: 'نص تجريبي', translation_en: 'Integration fixture, not Quran text.', translation_ur: 'آزمائشی متن'
  }))]));
  const pack = { format: 'surah-compass-quran-v1', sources: { arabic: 'Test fixture Arabic', en: 'Test fixture English edition', ur: 'Test fixture Urdu edition' }, chapters };
  const text = JSON.stringify(pack);
  app.el('pack-file').files = [{ size: Buffer.byteLength(text), async text() { return text; } }];
  await app.el('pack-file').emit('change');
  assert.equal(app.idb.puts, 1);
  assert.equal(Object.keys(app.idb.pack.chapters).length, 114);
  assert.match(app.el('pack-status').textContent, /114 Surahs can be read offline/);
  await app.spin();
  await app.el('reading-tab').emit('click');
  assert.equal(app.el('reading-content').hidden, false);
  assert.equal(app.el('reading-controls').hidden, false);
  assert.match(app.el('verses').innerHTML, /Integration fixture, not Quran text/);
  assert.match(app.el('verses').innerHTML, /Test fixture English edition/);
  assert.ok(!app.el('verses').innerHTML.includes('Sahih International'), 'Imported text must retain its own edition attribution');
});

test('advanced reading-status filters preserve the same discovery cycle when their subset is depleted', async () => {
  const app=mount({withLearning:true});await app.ready;
  app.context.CompanionStore.setStatus(1,'reading');
  app.el('spin-status').value='reading';await app.el('spin-status').emit('change');
  assert.equal(await app.spin(),1);
  const before=app.state();
  app.el('surah-dialog').close();await app.el('spin-button').emit('click');
  assert.deepEqual(app.state(),before);
  assert.match(app.el('wheel-hint').textContent,/No new Surahs/);
  await app.el('clear-spin-filters').emit('click');
  const next=await app.spin();assert.notEqual(next,1);
  assert.equal(app.state().cycle,1);
  assert.equal(app.state().history.length,2);
});

test('Urdu interface switches back to English labels without altering the selected filters', async () => {
  const app=mount({withLearning:true});await app.ready;
  app.el('spin-type').value='meccan';app.el('spin-juz').value='2';
  await app.el('ui-language-toggle').emit('click');
  assert.equal(app.context.document.documentElement.lang,'ur');
  assert.equal(app.context.document.documentElement.dir,'rtl');
  assert.equal(app.el('spin-type').options.find(o=>o.value==='meccan').textContent,'مکی');
  await app.el('ui-language-toggle').emit('click');
  assert.equal(app.context.document.documentElement.lang,'en');
  assert.equal(app.context.document.documentElement.dir,'ltr');
  assert.equal(app.el('spin-type').options.find(o=>o.value==='meccan').textContent,'Meccan');
  assert.equal(app.el('spin-juz').options.find(o=>o.value==='2').textContent,'Juz 2');
  assert.equal(app.el('spin-type').value,'meccan');assert.equal(app.el('spin-juz').value,'2');
  assert.equal(app.i18n.find(e=>e.dataset.i18n==='discover').textContent,'Discover');
});

test('an explicit reader chapter resumes its own ayah rather than another chapter’s global position', async () => {
  const app=mount({withLearning:true});await app.ready;
  app.context.CompanionStore.setLastRead(112,2);
  app.context.CompanionStore.setLastRead(2,286);
  app.context.CompassApp.navigate('reader',{surahId:112});
  assert.deepEqual(app.readerOpenCalls.at(-1),[112,2]);
  assert.equal(app.el('reader-view').hidden,false);
  assert.equal(app.el('library-view').hidden,true);
  app.context.CompassApp.navigate('reader',{surahId:112,ayah:3});
  assert.deepEqual(app.readerOpenCalls.at(-1),[112,3]);
});

test('reader exit emits a navigation event so focus mode can release the new page', async () => {
  const app=mount({withLearning:true});await app.ready;
  const changes=[];app.context.addEventListener('compass:navigation',event=>changes.push(event.detail.view));
  app.context.CompassApp.navigate('reader',{surahId:1,ayah:1});
  app.context.CompassApp.navigate('journey');
  assert.deepEqual(changes,['reader','journey']);
  assert.ok(app.audioStops()>0);
  assert.equal(app.el('journey-view').hidden,false);
  assert.equal(app.el('reader-view').hidden,true);
});

test('ayah search correctly shows the offline-pack gap and refreshes Saved results after import', async () => {
  const app=mount({withLearning:true,store:new Map([[SAVE_KEY,JSON.stringify([1])]])});await app.ready;
  app.context.CompassApp.navigate('saved');
  await app.scopeButtons.find(b=>b.dataset.searchScope==='ayahs').emit('click');
  app.el('surah-search').value='Integration fixture';await app.el('surah-search').emit('input');
  assert.match(app.el('ayah-search-results').innerHTML,/Bring the Quran into your search/);
  assert.equal(app.el('surah-grid').hidden,true);
  const surahs=JSON.parse(fs.readFileSync(path.join(root,'data/surahs.json'),'utf8'));
  const chapters=Object.fromEntries(surahs.map(s=>[s.id,Array.from({length:s.total_verses},(_,i)=>({id:i+1,text:'نص تجريبي',translation_en:'Integration fixture, not Quran text.',translation_ur:'آزمائشی متن'}))]));
  const text=JSON.stringify({format:'surah-compass-quran-v1',sources:{arabic:'Test fixture Arabic',en:'Test fixture English',ur:'Test fixture Urdu'},chapters});
  app.el('pack-file').files=[{size:Buffer.byteLength(text),async text(){return text;}}];
  await app.el('pack-file').emit('change');
  assert.match(app.el('ayah-search-results').innerHTML,/data-result-surah="1"/);
  assert.ok(!app.el('ayah-search-results').innerHTML.includes('Bring the Quran into your search'));
  assert.equal(app.el('result-count').textContent,'7 Ayahs');
});

test('restoring discovery state clears stale pointer selection and aligns with restored last discovery', async () => {
  const app=mount({withLearning:true});await app.ready;
  const old=await app.spin();
  const restored=makeState(13);assert.notEqual(restored.history.at(-1),old);
  app.store.set(STATE_KEY,JSON.stringify(restored));
  app.context.CompassApp.refreshUserState();
  const selected=app.segments.filter(g=>g.classList.contains('selected'));
  assert.equal(selected.length,1);
  assert.equal(Number(selected[0].dataset.surah),restored.history.at(-1));
  const expected=((restored.history.at(-1)-.5)*360/114)%360;
  assert.equal(app.el('clock-hand').style.transform,`rotate(${expected}deg)`);
});

test('the center clock hand stops at the chosen wedge while the dial stays stationary', async () => {
  const app=mount();await app.ready;
  for(let i=0;i<6;i++){
    const id=await app.spin();
    const rotation=Number(app.el('clock-hand').style.transform.match(/rotate\(([-\d.]+)deg\)/)[1]);
    assert.ok(Math.abs(rotation%360-(id-.5)*360/114)<1e-8);
    assert.equal(app.el('wheel').style.transform,undefined);
  }
});

test('the faster clock animation lasts longer, ends on its selected wedge, and completes its audio feedback', async () => {
  const animations=[],calls=[];let cancellations=0;
  const app=mount({reducedMotion:false,animation(frames,options){animations.push({frames,options});return {finished:Promise.resolve(),cancel(){cancellations++;}};},spinAudio:{configure(options){calls.push(['configure',options]);},start(options){calls.push(['start',options]);return 42;},finish(surah,lang,token){calls.push(['finish',surah.id,lang,token]);},stop(){calls.push(['stop']);}}});
  await app.ready;const id=await app.spin();
  assert.equal(animations.length,1);assert.equal(animations[0].options.duration,6800);
  const degrees=animations[0].frames.map(frame=>Number(frame.transform.match(/rotate\(([-\d.]+)deg\)/)[1]));
  assert.ok(degrees[1]-degrees[0]>=11*360);assert.ok((degrees[1]-degrees[0])/6800>5*360/5200);
  assert.ok(Math.abs(degrees[1]%360-(id-.5)*360/114)<1e-8);assert.equal(cancellations,1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.find(call=>call[0]==='start'))),['start',{duration:6800}]);
  assert.deepEqual(calls.find(call=>call[0]==='finish'),['finish',id,'en',42]);
});

test('clock sound persists and legacy voice preferences cannot re-enable spoken names', async () => {
  const calls=[];const app=mount({store:new Map([['compass-spin-voice','true']]),spinAudio:{configure(value){calls.push(['configure',value]);},stop(){calls.push(['stop']);}}});await app.ready;
  app.el('spin-sound-toggle').checked=false;await app.el('spin-sound-toggle').emit('change');
  assert.equal(app.store.get('compass-spin-sound'),'false');
  const prefs=app.context.CompassApp.exportPreferences();assert.equal(prefs['compass-spin-sound'],'false');assert.equal(prefs['compass-spin-voice'],undefined);
  const reloaded=mount({store:app.store});await reloaded.ready;assert.equal(reloaded.el('spin-sound-toggle').checked,false);
  app.context.CompassApp.applyPreferences({'compass-spin-sound':'true','compass-spin-voice':'true'});
  assert.equal(app.el('spin-sound-toggle').checked,true);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))),['configure',{sound:true}]);
  assert.ok(calls.filter(call=>call[0]==='configure').every(call=>!Object.hasOwn(call[1],'voice')));
  app.context.CompassApp.navigate('mushaf');assert.deepEqual(calls.at(-1),['stop']);
});

test('native PWA installation only prompts on a user click and hides after acceptance', async () => {
  const app=mount({protocol:'https:'});await app.ready;let prompts=0,prevented=0;
  const event={type:'beforeinstallprompt',preventDefault(){prevented++;},prompt(){prompts++;return Promise.resolve();},userChoice:Promise.resolve({outcome:'accepted'})};
  app.context.window.dispatchEvent(event);
  assert.equal(prevented,1);assert.equal(prompts,0);assert.equal(app.el('install-app-button').hidden,false);
  await app.el('install-app-button').emit('click');
  assert.equal(prompts,1);assert.equal(app.el('install-app-button').hidden,true);assert.equal(app.el('install-app-button').disabled,false);
  assert.equal(await app.context.CompassApp.install(),false);assert.equal(prompts,1);
});

test('a dismissed install prompt cannot be reused and a later prompt can be offered', async () => {
  const app=mount({protocol:'https:'});await app.ready;let prompts=0;
  const offer=()=>({type:'beforeinstallprompt',preventDefault(){},prompt(){prompts++;return Promise.resolve();},userChoice:Promise.resolve({outcome:'dismissed'})});
  app.context.window.dispatchEvent(offer());assert.equal(await app.context.CompassApp.install(),false);
  assert.equal(app.el('install-app-button').hidden,false);assert.equal(prompts,1);
  await app.context.CompassApp.install();assert.equal(prompts,1);assert.match(app.el('toast').textContent,/Chrome.*menu.*Install app/);
  app.context.window.dispatchEvent(offer());await app.el('install-app-button').emit('click');assert.equal(prompts,2);
});

test('an install already in progress is not prompted twice', async () => {
  const app=mount({protocol:'https:'});await app.ready;let prompts=0,resolveChoice;
  app.context.window.dispatchEvent({type:'beforeinstallprompt',preventDefault(){},prompt(){prompts++;return Promise.resolve();},userChoice:new Promise(resolve=>{resolveChoice=resolve;})});
  const first=app.context.CompassApp.install();assert.equal(prompts,1);assert.equal(app.el('install-app-button').disabled,true);
  assert.equal(await app.context.CompassApp.install(),false);assert.equal(prompts,1);
  resolveChoice({outcome:'dismissed'});await first;assert.equal(app.el('install-app-button').disabled,false);
});

test('appinstalled and standalone display mode hide PWA installation controls', async () => {
  for(const options of [{standalone:true},{navigatorStandalone:true}]){
    const app=mount(options);await app.ready;let prompted=false;
    assert.equal(app.el('install-app-button').hidden,true);
    app.context.window.dispatchEvent({type:'beforeinstallprompt',preventDefault(){},prompt(){prompted=true;}});
    assert.equal(await app.context.CompassApp.install(),false);assert.equal(prompted,false);
  }
  const app=mount();await app.ready;
  app.installDisplay.matches=true;app.installDisplay.listener();assert.equal(app.el('install-app-button').hidden,true);
  app.installDisplay.matches=false;app.installDisplay.listener();assert.equal(app.el('install-app-button').hidden,false);
  app.context.window.dispatchEvent({type:'appinstalled'});assert.equal(app.el('install-app-button').hidden,true);
});

test('PWA installation gives browser-specific instructions when a native prompt is unavailable', async () => {
  const ios=mount({protocol:'https:',userAgent:'Mozilla/5.0 (iPhone) AppleWebKit Safari'});await ios.ready;
  await ios.el('install-app-button').emit('click');assert.match(ios.el('toast').textContent,/Safari.*Share.*Add to Home Screen/);
  const ipad=mount({protocol:'https:',userAgent:'Mozilla/5.0 Macintosh Safari',platform:'MacIntel',maxTouchPoints:5});await ipad.ready;
  await ipad.context.CompassApp.install();assert.match(ipad.el('toast').textContent,/Share.*Add to Home Screen/);
  const direct=mount();await direct.ready;await direct.context.CompassApp.install();assert.match(direct.el('toast').textContent,/localhost or HTTPS/);
  const edge=mount({protocol:'https:',userAgent:'Mozilla/5.0 Chrome Edg/132'});await edge.ready;await edge.context.CompassApp.install();assert.match(edge.el('toast').textContent,/Edge.*Apps.*Install this site/);
});

test('a rejected native install prompt releases its disabled state and provides a usable fallback', async () => {
  const app=mount({protocol:'https:'});await app.ready;
  app.context.window.dispatchEvent({type:'beforeinstallprompt',preventDefault(){},prompt(){throw new Error('Browser refused prompt');}});
  assert.equal(await app.context.CompassApp.install(),false);assert.equal(app.el('install-app-button').disabled,false);assert.equal(app.el('install-app-button').hidden,false);
  assert.match(app.el('toast').textContent,/Chrome.*Install app/);
});

test('the PWA manifest has a stable identity and sized local icons', () => {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./#discover');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
  for(const size of [192,512]){
    const icon=manifest.icons.find(item=>item.sizes===`${size}x${size}`);assert.ok(icon);
    const png=fs.readFileSync(path.join(root,icon.src));assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
  }
  assert.ok(manifest.icons.some(icon=>icon.purpose.split(' ').includes('maskable')));
});

test('the book bookmark preference participates in the app backup bridge alongside spin choices', async () => {
  const app=mount();await app.ready;let applied;
  app.context.CompassMushaf.getPreferences=()=>({'surah-compass-bookmark-v1':'{"version":1,"surahId":112,"x":0.14,"y":0.06}'});
  app.context.CompassMushaf.applyPreferences=values=>{applied=values;};
  const prefs=app.context.CompassApp.exportPreferences();assert.equal(prefs['surah-compass-bookmark-v1'],'{"version":1,"surahId":112,"x":0.14,"y":0.06}');
  app.context.CompassApp.applyPreferences({'surah-compass-bookmark-v1':'{"version":1,"surahId":2,"x":0.3,"y":0.1}'});
  assert.equal(applied['surah-compass-bookmark-v1'],'{"version":1,"surahId":2,"x":0.3,"y":0.1}');
});

test('an interrupted animation cancels feedback and leaves its reserved chapter saved without a stale animation', async () => {
  let cancelled=0,stopped=0,finished=0;
  const app=mount({reducedMotion:false,animation(){return {finished:Promise.reject(new Error('Test interruption')),cancel(){cancelled++;}};},spinAudio:{configure(){},start(){return 2;},finish(){finished++;},stop(){stopped++;}}});await app.ready;
  await app.el('spin-button').emit('click');
  assert.equal(app.state().history.length,1);assert.equal(cancelled,1);assert.equal(stopped,1);assert.equal(finished,0);
  assert.equal(app.errors.length,1);assert.equal(app.errors[0][0],'Spin could not complete');
  assert.equal(app.el('spin-button').disabled,false);assert.equal(app.el('wheel-wrap').classList.contains('is-spinning'),false);
});

test('Surahs navigation opens the physical catalogue and hides other primary views', async () => {
  const app=mount();await app.ready;
  app.context.CompassApp.navigate('mushaf');
  assert.equal(app.mushafOpens(),1);
  assert.equal(app.el('mushaf-view').hidden,false);
  assert.equal(app.el('discover-view').hidden,true);
  assert.equal(app.el('library-view').hidden,true);
  app.context.CompassApp.navigate('library');
  assert.equal(app.el('mushaf-view').hidden,true);
  assert.equal(app.el('library-view').hidden,false);
});

test('Arabic ayah search ignores alef-wasla and Quran annotation marks in the installed text', async () => {
  const app=mount({withLearning:true});await app.ready;
  const surahs=JSON.parse(fs.readFileSync(path.join(root,'data/surahs.json'),'utf8'));
  const chapters=Object.fromEntries(surahs.map(s=>[s.id,Array.from({length:s.total_verses},(_,i)=>({id:i+1,text:'نص تجريبي',translation_en:'Integration fixture, not Quran text.',translation_ur:'آزمائشی متن'}))]));
  chapters[1][0].text='ٱل\u06dfلَّهِ'; // Orthography fixture, not a claimed Quran verse.
  const text=JSON.stringify({format:'surah-compass-quran-v1',sources:{arabic:'Orthography test fixture',en:'Test fixture English',ur:'Test fixture Urdu'},chapters});
  app.el('pack-file').files=[{size:Buffer.byteLength(text),async text(){return text;}}];
  await app.el('pack-file').emit('change');
  app.context.CompassApp.navigate('library');
  await app.scopeButtons.find(b=>b.dataset.searchScope==='ayahs').emit('click');
  app.el('surah-search').value='الله';await app.el('surah-search').emit('input');
  assert.match(app.el('ayah-search-results').innerHTML,/data-result-surah="1" data-result-ayah="1"/);
  assert.equal(app.el('result-count').textContent,'1 Ayahs');
});
