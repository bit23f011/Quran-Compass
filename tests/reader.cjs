'use strict';

// These fixtures are software test text, never a substitute Quran corpus.
// The real reader module runs in a minimal DOM with fake audio/cache/network APIs.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const folder=path.resolve(__dirname,'..');
const readerSource=fs.readFileSync(path.join(folder,'reader.js'),'utf8');
const readerStyles=fs.readFileSync(path.join(folder,'reader.css'),'utf8');
const storeSource=fs.readFileSync(path.join(folder,'store.js'),'utf8');
const catalogueSource=fs.readFileSync(path.join(folder,'data/surahs.js'),'utf8');
const editionsSource=fs.readFileSync(path.join(folder,'data/editions.js'),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
async function flush(){for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));}
function fixtureVerses(total=7){return Array.from({length:total},(_,i)=>({id:i+1,text:`نَصّ تَجْرِيبِيّ ${i+1}`,translation_en:`Software test fixture ${i+1}, not Quran text.`,translation_ur:`آزمائشی متن ${i+1}`}));}
function audioResponse(size=100){return new Response(new Uint8Array(size),{headers:{'Content-Type':'audio/mpeg','Content-Length':String(size)}});}

function mount({text={1:fixtureVerses()},storage=new Map(),rejectWrites=false,cacheSupported=true,matchHook,fetchHook,playHook,contentService,editions,study}={}){
  const elements=new Map(),listeners=new Map(),writes=[],fetchCalls=[],revoked=[],cacheItems=new Map(),audioInstances=[],rootMessages=[];
  let generated=0,downloadCalls=0,importCalls=0;
  class Element{
    constructor(id){this.id=id;this.tagName='DIV';this.dataset={};this.attributes=new Map();this.listeners=new Map();this._html='';this.textContent='';this._value='';this.checked=false;this.disabled=false;this.hidden=false;this.open=false;this.files=[];this.isConnected=true;this.scrollTop=0;this.scrollLeft=0;this.nextElementSibling={textContent:''};const classes=new Set();this.classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,force)=>{const yes=force===undefined?!classes.has(n):!!force;yes?classes.add(n):classes.delete(n);return yes;}};this.style={setProperty(name,value){this[name]=value;}};}
    set value(value){this._value=String(value);}get value(){return this._value;}
    set innerHTML(value){this._html=String(value);for(const match of this._html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/g)){const id=match[2].match(/\bid="([^"]+)"/)?.[1];if(id){const element=new Element(id);element.tagName=match[1].toUpperCase();parseAttributes(element,match[2]);elements.set(id,element);}}}
    get innerHTML(){return this._html;}
    addEventListener(name,callback){const callbacks=this.listeners.get(name)||[];callbacks.push(callback);this.listeners.set(name,callbacks);}
    setAttribute(name,value){this.attributes.set(name,String(value));}getAttribute(name){return this.attributes.get(name)??null;}removeAttribute(name){this.attributes.delete(name);}
    showModal(){this.open=true;}close(){this.open=false;for(const callback of this.listeners.get('close')||[])callback({target:this});}focus(){}scrollIntoView(options){this.lastScroll=options;}
    getBoundingClientRect(){return {left:0,top:0,right:700,bottom:800};}
    matches(selector){const attribute=selector.match(/^\[([^\]=]+)(?:="([^\"]*)")?\]$/);if(attribute){if(attribute[1].startsWith('data-')){const key=dataKey(attribute[1].slice(5));return key in this.dataset&&(attribute[2]===undefined||this.dataset[key]===attribute[2]);}return this.attributes.has(attribute[1]);}return selector.startsWith('.')&&this.classList.contains(selector.slice(1));}
    closest(selector){return this.matches(selector)?this:null;}
    querySelector(selector){if(selector==='span'){if(!this.span)this.span=new Element(this.id+'-span');return this.span;}if(selector.startsWith('.')){const key=this.id+':'+selector;const found=elements.get(key)||new Element(key);elements.set(key,found);return found;}return this.querySelectorAll(selector)[0]||null;}
    querySelectorAll(selector){const source=this.id==='reader-view'?elements.get('reader-text')?._html||'':this._html;const found=[];for(const match of source.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/g)){const attributes=match[2];const probe=new Element('probe');parseAttributes(probe,attributes);if(!probe.matches(selector))continue;const identity=[...attributes.matchAll(/\bdata-[^=]+="([^"]+)"/g)].map(row=>row[1]).join(':');const id=attributes.match(/\bid="([^"]+)"/)?.[1]||this.id+':'+selector+':'+(identity||++generated);const element=elements.get(id)||new Element(id);element.tagName=match[1].toUpperCase();parseAttributes(element,attributes);elements.set(id,element);found.push(element);}return found;}
    async emit(name,event={}){for(const callback of this.listeners.get(name)||[])await callback({target:this,currentTarget:this,preventDefault(){},...event});}
  }
  function dataKey(value){return value.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());}
  function parseAttributes(element,attributes){for(const match of attributes.matchAll(/\b(data-[a-z-]+|class|aria-[a-z-]+)="([^"]*)"/g)){if(match[1].startsWith('data-'))element.dataset[dataKey(match[1].slice(5))]=match[2];else if(match[1]==='class')match[2].split(/\s+/).filter(Boolean).forEach(c=>element.classList.add(c));else element.setAttribute(match[1],match[2]);}if(/\bchecked(?:\s|$)/.test(attributes))element.checked=true;if(/\bdisabled(?:\s|$)/.test(attributes))element.disabled=true;if(/\bhidden(?:\s|$)/.test(attributes))element.hidden=true;}
  function el(id){const element=elements.get(id);if(!element)throw new Error('Missing reader fixture element '+id);return element;}
  const root=new Element('reader-view');elements.set(root.id,root);
  const body=new Element('body');
  const document={readyState:'interactive',body,fullscreenElement:null,getElementById:id=>elements.get(id)||null,addEventListener:(name,callback)=>subscribe('document:'+name,callback),querySelector:selector=>selector==='dialog[open]'?[...elements.values()].find(e=>e.open)||null:null};
  function subscribe(name,callback){const callbacks=listeners.get(name)||[];callbacks.push(callback);listeners.set(name,callbacks);}
  function dispatch(event){for(const callback of listeners.get(event.type)||[])callback(event);return true;}
  const cache={async keys(){return [...cacheItems.keys()].map(url=>({url}));},async match(request){const url=typeof request==='string'?request:request.url;if(matchHook){const value=matchHook(url,cacheItems);if(value!==undefined)return value;}return cacheItems.get(url)?.clone();},async put(request,response){cacheItems.set(typeof request==='string'?request:request.url,response.clone());},async delete(request){return cacheItems.delete(typeof request==='string'?request:request.url);}};
  class FakeAudio{
    constructor(){this.listeners=new Map();this.src='';this.paused=true;this.ended=false;this.currentTime=0;this.duration=5;this.playCalls=[];this.pauseCalls=0;audioInstances.push(this);}
    addEventListener(name,callback){const callbacks=this.listeners.get(name)||[];callbacks.push(callback);this.listeners.set(name,callbacks);}
    emit(name){for(const callback of this.listeners.get(name)||[])callback({target:this});}
    play(){const call={src:this.src,rate:this.playbackRate};this.playCalls.push(call);this.paused=false;this.ended=false;this.emit('play');return playHook?playHook(call,this):Promise.resolve();}
    pause(){this.pauseCalls++;this.paused=true;this.emit('pause');}
    removeAttribute(name){if(name==='src')this.src='';}load(){this.currentTime=0;this.ended=false;}
    finish(){this.currentTime=this.duration;this.ended=true;this.paused=true;this.emit('ended');}
  }
  const context=vm.createContext({document,console,Audio:FakeAudio,Response,Blob,AbortController,DOMException,
    URL:{createObjectURL:()=>`blob:software-fixture-${++generated}`,revokeObjectURL:url=>revoked.push(url)},
    localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){writes.push([key,value]);if(rejectWrites)throw new Error('Read-only storage');storage.set(key,value);},removeItem:key=>storage.delete(key)},
    navigator:{storage:{estimate:async()=>({quota:1024*1024*1024,usage:0})},clipboard:{writeText:async()=>{}}},
    fetch(url,options){fetchCalls.push({url,options});if(fetchHook)return fetchHook(url,options);throw new Error('A test must explicitly supply its fake audio response; no network is allowed.');},
    addEventListener:subscribe,dispatchEvent:dispatch,CustomEvent:class CustomEvent{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    setTimeout(callback,delay){if(delay===0)queueMicrotask(callback);return ++generated;},clearTimeout(){},queueMicrotask,matchMedia:()=>({matches:true})});
  if(cacheSupported)context.caches={open:async name=>{assert.equal(name,'compass-quran-audio-v1');return cache;}};
  vm.runInContext(catalogueSource,context,{filename:'surahs.js'});
  vm.runInContext(storeSource,context,{filename:'store.js'});
  context.QURAN=text;context.QURAN_SOURCES={arabic:'Software fixture Arabic',en:'Software fixture English',ur:'Software fixture Urdu'};
  context.CompassApp={getQuran:()=>context.QURAN,getSources:()=>context.QURAN_SOURCES,toast:message=>rootMessages.push(message),downloadPack:async()=>{downloadCalls++;},importPack:()=>{importCalls++;}};
  if(editions)vm.runInContext(editionsSource,context,{filename:'editions.js'});
  if(contentService)context.CompassContent=typeof contentService==='function'?contentService(context):contentService;
  if(study)context.STUDY=study;
  vm.runInContext(readerSource,context,{filename:'reader.js'});
  return {context,reader:context.CompassReader,learning:context.CompanionStore,el,root,storage,writes,cache,cacheItems,fetchCalls,audio:audioInstances[0],revoked,rootMessages,dispatch,
    downloads:()=>downloadCalls,imports:()=>importCalls,
    action(attribute,ayah){const element=new Element('action');element.dataset[dataKey(attribute.replace(/^data-/,''))]=String(ayah);return element;},
    addElement(id){const element=new Element(id);elements.set(id,element);return element;}};
}

test('actual reader searches Arabic without diacritics, both translations, and verse references while preserving displayed source text',async()=>{
  const app=mount();await flush();
  const found=app.reader.search('نص');assert.equal(found.length,7);assert.equal(found[0].text,'نَصّ تَجْرِيبِيّ 1');
  assert.equal(app.reader.search('1:3')[0].ayah,3);assert.equal(app.reader.search('1.3')[0].ayah,3);
  assert.equal(app.reader.search('software test').length,7);assert.equal(app.reader.search('آزمائشی')[0].surahId,1);
  assert.equal(app.reader.search('not present').length,0);assert.equal(app.reader.search('نص',2).length,2);
  assert.ok(app.el('reader-text').innerHTML.includes('نَصّ تَجْرِيبِيّ 1'),'Rendering must preserve Quran-pack text verbatim; only search normalization may strip marks.');
  assert.equal(app.learning.status(1).readAyahs.length,0,'Viewing and searching cannot imply that ayahs were read.');
  assert.equal(app.fetchCalls.length,0);assert.equal(app.audio.playCalls.length,0,'Opening a reader cannot autoplay recitation.');
});

test('an absent text pack shows actionable download/import controls without fetching or fabricating verse content',async()=>{
  const app=mount({text:{}});await flush();
  assert.match(app.el('reader-text').innerHTML,/Bring the complete Quran/);assert.equal(app.reader.search('نص').length,0);
  assert.equal(app.el('reader-text').innerHTML.includes('data-ayah='),false);assert.equal(app.fetchCalls.length,0);assert.equal(app.downloads(),0);
  await app.el('reader-download-text').emit('click');assert.equal(app.downloads(),1);
  await app.el('reader-import-text').emit('click');assert.equal(app.imports(),1);
});

test('reader preferences validate restored values and survive storage write failure in memory',async()=>{
  const app=mount({rejectWrites:true});await flush();
  const defaults=app.reader.getPreferences();assert.equal(JSON.parse(defaults['compass-reader-qari']),'alafasy');
  app.reader.applyPreferences({'compass-reader-translation':'"ur"','compass-reader-font-size':'44','compass-reader-qari':'"husary"','compass-reader-follow':'false','compass-reader-rate':'1.25'});
  app.reader.refresh();const restored=app.reader.getPreferences();assert.equal(JSON.parse(restored['compass-reader-translation']),'ur');assert.equal(JSON.parse(restored['compass-reader-font-size']),44);assert.equal(JSON.parse(restored['compass-reader-qari']),'husary');assert.equal(JSON.parse(restored['compass-reader-follow']),false);assert.equal(JSON.parse(restored['compass-reader-rate']),1.25);
  app.reader.applyPreferences({'compass-reader-font-size':'999','compass-reader-qari':'"unknown"','compass-reader-rate':'2','compass-reader-follow':'"true"','compass-reader-translation':'bad json'});
  assert.deepEqual(clone(app.reader.getPreferences()),clone(restored),'Invalid backup preferences cannot change the current reader.');
});

test('reading and memorization are separate; Hifz range actions hide/reveal exact ayahs and save a passage once',async()=>{
  const app=mount();await flush();app.reader.open(1,2);await flush();
  assert.equal(app.learning.snapshot().lastRead.ayah,2);assert.equal(app.learning.status(1).readAyahs.length,0);
  await app.el('reader-hifz-tab').emit('click');app.el('reader-range-start').value=2;app.el('reader-range-end').value=3;await app.el('reader-range-end').emit('change');
  assert.match(app.el('reader-text').innerHTML,/id="reader-ayah-2"/);assert.match(app.el('reader-text').innerHTML,/id="reader-ayah-3"/);assert.equal(app.el('reader-text').innerHTML.includes('id="reader-ayah-1"'),false);
  assert.match(app.el('reader-text').innerHTML,/is-hidden-ayah/);await app.el('reader-reveal-all').emit('click');assert.equal(app.el('reader-text').innerHTML.includes('is-hidden-ayah'),false);
  const writesBefore=app.writes.length;await app.el('reader-memorize-range').emit('click');await flush();assert.deepEqual(clone(app.learning.status(1).memorizedAyahs),[2,3]);assert.equal(app.writes.length-writesBefore,1,'Long passages should use one store mutation, not one synchronous write per ayah.');assert.equal(app.learning.status(1).readAyahs.length,0);
  const input=app.action('data-reader-read',2);input.checked=true;await app.el('reader-text').emit('change',{target:input});await flush();assert.deepEqual(clone(app.learning.status(1).readAyahs),[2]);
});

test('an ayah bookmark with a personal note opens its editor instead of silently deleting the note',async()=>{
  const app=mount();await flush();app.learning.saveNote(1,2,'<img src=x onerror=alert(1)>','Sabr');app.reader.refresh();
  const bookmark=app.action('data-reader-bookmark',2);await app.el('reader-text').emit('click',{target:bookmark});
  assert.equal(app.el('reader-note-dialog').open,true);assert.equal(app.learning.bookmarks().length,1);assert.equal(app.el('reader-note-text').value,'<img src=x onerror=alert(1)>');
  assert.ok(app.el('reader-text').innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'));assert.equal(app.el('reader-text').innerHTML.includes('<img src=x'),false);
  await app.el('reader-note-delete').emit('click');assert.equal(app.learning.bookmarks().length,0,'Removal requires the explicit note-editor action.');
});

test('manual playback selects correct EveryAyah reciter URLs and pause/resume retains the current source',async()=>{
  const app=mount();await flush();
  await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});assert.match(app.audio.src,/Alafasy_128kbps\/001002\.mp3$/);
  app.audio.currentTime=2;await app.el('reader-audio-play').emit('click');assert.equal(app.audio.paused,true);await app.el('reader-audio-play').emit('click');assert.equal(app.audio.currentTime,2,'Resuming a paused ayah must not load it again from its beginning.');
  app.el('reader-qari').value='husary';await app.el('reader-qari').emit('change');await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});assert.match(app.audio.src,/Husary_128kbps\/001002\.mp3$/);
  app.el('reader-qari').value='minshawi';await app.el('reader-qari').emit('change');await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});assert.match(app.audio.src,/Minshawy_Murattal_128kbps\/001002\.mp3$/);
  assert.equal(app.fetchCalls.length,0,'The fake Audio element records source selection without real network access.');
});

test('Pages layout traverses a complete chapter without splitting, dropping, repeating or reordering source verses',async()=>{
  const chapter=fixtureVerses(286).map((verse,index)=>({...verse,text:verse.text+' '+(index===26?'آزمائشی '.repeat(280):'آزمائشی '.repeat(12))}));
  const app=mount({text:{2:chapter}});await flush();app.reader.open(2);await flush();
  assert.equal(JSON.parse(app.reader.getPreferences()['compass-reader-layout']),'pages');assert.equal(app.root.dataset.readerLayout,'pages');
  const ids=[],pages=[];let pageCount=0;
  while(true){
    const html=app.el('reader-text').innerHTML,visible=[...html.matchAll(/data-ayah="(\d+)"/g)].map(match=>Number(match[1]));
    assert.ok(visible.length>0);pages.push(visible);ids.push(...visible);pageCount++;
    for(const id of visible){const text=chapter[id-1].text;assert.equal(html.split(text).length-1,1,`Ayah ${id} is rendered once and retains its entire source string.`);}
    if(app.el('reader-page-next').disabled)break;
    assert.ok(pageCount<287,'Page navigation must reach its end.');await app.el('reader-page-next').emit('click');await flush();
  }
  assert.deepEqual(ids,chapter.map(v=>v.id));assert.ok(pageCount>2);assert.equal(app.el('reader-page-navigation').hidden,false);
  assert.ok(pages.some(page=>page.length===1&&page[0]===27),'An unusually long verse must stay intact on its own reading page.');
  assert.equal(app.learning.status(2).readAyahs.length,0,'Turning a page does not mark its ayahs read.');
  const lastPage=pages.at(-1);await app.el('reader-page-previous').emit('click');await app.el('reader-page-next').emit('click');
  assert.deepEqual([...app.el('reader-text').innerHTML.matchAll(/data-ayah="(\d+)"/g)].map(match=>Number(match[1])),lastPage,'Returning to a page keeps the same verse boundaries.');
  assert.equal(app.fetchCalls.length,0);
});

test('ayah jump and playback enter their containing reading page while keeping Bismillah only on the chapter opening',async()=>{
  const app=mount({text:{2:fixtureVerses(286)}});await flush();app.reader.open(2);await flush();
  assert.match(app.el('reader-text').innerHTML,/reader-bismillah/);assert.equal(app.el('reader-page-previous').disabled,true);
  app.el('reader-jump').value=74;await app.el('reader-jump').emit('change');await flush();
  assert.match(app.el('reader-text').innerHTML,/id="reader-ayah-74"/);assert.equal(app.el('reader-text').innerHTML.includes('id="reader-ayah-1"'),false);assert.equal(app.el('reader-text').innerHTML.includes('reader-bismillah'),false);
  assert.equal(app.learning.snapshot().lastRead.ayah,74);assert.ok(app.el('reader-ayah-74').lastScroll);
  await app.el('reader-text').emit('click',{target:app.action('data-reader-detail',74)});assert.equal(app.el('reader-page-study').open,true);assert.ok(app.el('reader-page-detail-74').lastScroll);
  await app.el('reader-text').emit('click',{target:app.action('data-reader-play',74)});assert.match(app.audio.src,/002074\.mp3$/);
  app.audio.finish();await flush();assert.match(app.audio.src,/002075\.mp3$/);assert.match(app.el('reader-text').innerHTML,/id="reader-ayah-75"/);
  const boundary=Math.max(...[...app.el('reader-text').innerHTML.matchAll(/data-ayah="(\d+)"/g)].map(match=>Number(match[1])));
  await app.el('reader-text').emit('click',{target:app.action('data-reader-play',boundary)});app.audio.finish();await flush();
  assert.match(app.el('reader-text').innerHTML,new RegExp(`id="reader-ayah-${boundary+1}"`));assert.equal(app.el('reader-text').innerHTML.includes('id="reader-ayah-74"'),false,'Continuous recitation moves into the next reading page at its boundary.');
  app.reader.open(2,1);assert.match(app.el('reader-text').innerHTML,/reader-bismillah/);
});

test('reading layout persists, validates restored values, and retains existing translations, bookmarks and Hifz tools',async()=>{
  const app=mount();await flush();
  await app.el('reader-layout-ayahs').emit('click');assert.equal(app.root.dataset.readerLayout,'ayahs');assert.equal(app.el('reader-page-navigation').hidden,true);assert.equal(app.storage.get('compass-reader-layout'),'"ayahs"');
  app.reader.applyPreferences({'compass-reader-layout':'"pages"'});assert.equal(app.root.dataset.readerLayout,'pages');assert.match(app.el('reader-text').innerHTML,/Software test fixture 2, not Quran text\./);assert.match(app.el('reader-text-source').textContent,/Software fixture Arabic/,'Reading pages retain source attribution.');
  await app.el('reader-text').emit('click',{target:app.action('data-reader-bookmark',2)});assert.equal(app.learning.bookmarks()[0].ayah,2);
  app.reader.applyPreferences({'compass-reader-layout':'"invalid"'});assert.equal(JSON.parse(app.reader.getPreferences()['compass-reader-layout']),'pages');
  await app.el('reader-hifz-tab').emit('click');assert.equal(app.el('reader-reading-layout').hidden,true);assert.equal(app.el('reader-page-navigation').hidden,true);assert.match(app.el('reader-text').innerHTML,/data-reader-memorized="2"/);assert.equal(app.el('reader-text').innerHTML.includes('reader-page-flow'),false);
  await app.el('reader-read-tab').emit('click');assert.equal(app.root.dataset.readerLayout,'pages');assert.equal(app.el('reader-reading-layout').hidden,false);
  const restored=mount({storage:new Map([['compass-reader-layout','"ayahs"']])});await flush();assert.equal(restored.root.dataset.readerLayout,'ayahs');
});

test('compact mobile transport exposes Pause, preserves its source and time across page navigation, and expands settings independently',async()=>{
  const app=mount({text:{2:fixtureVerses(286)}});await flush();app.reader.open(2);await flush();
  assert.match(app.root.innerHTML,/class="reader-audio-transport"/);assert.equal(app.el('reader-audio-settings-toggle').getAttribute('aria-controls'),'reader-audio-settings');assert.equal(app.el('reader-audio-settings-toggle').getAttribute('aria-expanded'),'false');
  assert.match(readerStyles,/\.quran-reader-view \.reader-audio-bar\{position:fixed;[^}]*bottom:calc\(70px \+ env\(safe-area-inset-bottom,0px\) \+ 8px\)/);assert.match(readerStyles,/\.reader-play-controls \.icon-button\{[^}]*min-width:44px;min-height:44px/);
  await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});assert.equal(app.el('reader-audio-play').getAttribute('aria-label'),'Pause');
  const source=app.audio.src;app.audio.currentTime=2.25;await app.el('reader-audio-play').emit('click');assert.equal(app.audio.paused,true);assert.equal(app.el('reader-audio-play').getAttribute('aria-label'),'Play');
  await app.el('reader-page-next').emit('click');await app.el('reader-audio-settings-toggle').emit('click');assert.equal(app.el('reader-audio-settings-toggle').getAttribute('aria-expanded'),'true');assert.equal(app.root.classList.contains('reader-audio-settings-open'),true);
  await app.el('reader-audio-play').emit('click');assert.equal(app.audio.src,source);assert.equal(app.audio.currentTime,2.25);assert.equal(app.audio.paused,false);assert.equal(app.el('reader-audio-play').getAttribute('aria-label'),'Pause');
  assert.equal(app.fetchCalls.length,0);
});

test('a superseded play promise cannot pause a newer active ayah',async()=>{
  const pending=[];const app=mount({playHook:()=>{const request=deferred();pending.push(request);return request.promise;}});await flush();
  const first=app.el('reader-text').emit('click',{target:app.action('data-reader-play',1)});await flush();assert.equal(pending.length,1);
  const second=app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});await flush();assert.equal(pending.length,2);
  pending[1].resolve();await second;assert.equal(app.audio.paused,false);const pauses=app.audio.pauseCalls;
  pending[0].resolve();await first;assert.equal(app.audio.paused,false,'Late completion of the old play must leave the new source playing.');assert.equal(app.audio.pauseCalls,pauses);assert.match(app.audio.src,/001002\.mp3$/);
});

test('late cached source resolution after stop releases its blob and never starts playback',async()=>{
  const pending=deferred();let intercepted=false;
  const app=mount({matchHook:url=>{if(url.endsWith('/001001.mp3')&&!intercepted){intercepted=true;return pending.promise;}}});await flush();
  const click=app.el('reader-text').emit('click',{target:app.action('data-reader-play',1)});await flush();app.reader.stopAudio();pending.resolve(audioResponse(10));await click;
  assert.equal(app.audio.playCalls.length,0);assert.equal(app.audio.src,'');assert.equal(app.revoked.length,1,'A cached blob from an obsolete request must be released.');
});

test('queued obsolete media errors do not mislabel a newly selected source, while current playback errors remain visible',async()=>{
  const app=mount();await flush();await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});const previous=app.rootMessages.length;
  app.audio.error=null;app.audio.emit('error');assert.equal(app.rootMessages.length,previous,'A reset MediaError belongs to an obsolete load, not the new current source.');
  app.audio.error={code:2};app.audio.emit('error');assert.ok(app.rootMessages.at(-1).includes('could not be played'));
});

test('cached ayah playback uses a local blob and releases it when leaving the reader',async()=>{
  const app=mount();await flush();app.cacheItems.set('https://everyayah.com/data/Alafasy_128kbps/001002.mp3',audioResponse(15));
  await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});assert.match(app.audio.src,/^blob:software-fixture-/);assert.equal(app.fetchCalls.length,0);
  const local=app.audio.src;app.dispatch(new app.context.CustomEvent('compass:navigation',{detail:{view:'journey'}}));assert.equal(app.audio.paused,true);assert.equal(app.audio.src,'');assert.ok(app.revoked.includes(local));
});

test('Hifz playback repeats only the selected passage and stops after the configured rounds',async()=>{
  const app=mount();await flush();await app.el('reader-hifz-tab').emit('click');app.el('reader-range-start').value=2;app.el('reader-range-end').value=3;await app.el('reader-range-end').emit('change');app.el('reader-repeat').value=3;await app.el('reader-repeat').emit('change');await app.el('reader-practice').emit('click');await flush();
  for(let i=0;i<6;i++){app.audio.finish();await flush();}
  assert.deepEqual(app.audio.playCalls.map(call=>Number(call.src.match(/(\d{3})\.mp3$/)[1])),[2,3,2,3,2,3]);assert.equal(app.audio.paused,true);assert.equal(app.learning.status(1).readAyahs.length,0);assert.equal(app.learning.status(1).memorizedAyahs.length,0,'Listening is not an automatic memorization claim.');
});

test('audio manager accounts for cached bytes and removes only the requested Surah/Qari pack',async()=>{
  const app=mount();app.cacheItems.set('https://everyayah.com/data/Alafasy_128kbps/112001.mp3',audioResponse(12));app.cacheItems.set('https://everyayah.com/data/Alafasy_128kbps/112002.mp3',audioResponse(24));app.cacheItems.set('https://everyayah.com/data/Husary_128kbps/112001.mp3',audioResponse(36));await flush();
  const before=await app.reader.audioStatus();assert.equal(before.totalFiles,3);assert.equal(before.totalBytes,72);assert.equal(before.packs.length,2);assert.equal(before.packs.find(item=>item.qariId==='alafasy').complete,false);
  assert.equal(await app.reader.removeAudio(112,'alafasy'),true);const after=await app.reader.audioStatus();assert.equal(after.totalFiles,1);assert.equal(after.totalBytes,36);assert.equal(after.packs[0].qariId,'husary');
  assert.equal(await app.reader.removeAudio(0),false);assert.equal(app.fetchCalls.length,0);
});

test('cancelled audio download preserves finished ayahs, makes no late cache writes, and resumes the remaining files',async()=>{
  const waiting=[];let immediate=false;
  const app=mount({fetchHook:(url,{signal})=>{if(immediate)return Promise.resolve(audioResponse(10));const request=deferred();waiting.push({url,...request});if(signal.aborted)request.reject(new DOMException('Aborted','AbortError'));else signal.addEventListener('abort',()=>request.reject(new DOMException('Aborted','AbortError')),{once:true});return request.promise;}});await flush();
  await app.el('reader-audio-download').emit('click');await flush();assert.equal(waiting.length,3,'Audio downloads use a bounded worker pool.');waiting[0].resolve(audioResponse(10));await flush();assert.equal(app.cacheItems.size,1);
  await app.el('reader-audio-download').emit('click');await flush();const partial=await app.reader.audioStatus();assert.equal(partial.totalFiles,1);assert.equal(partial.packs[0].complete,false);assert.ok(app.rootMessages.some(message=>message.includes('Download stopped')));
  const cachedURL=[...app.cacheItems.keys()][0];immediate=true;const callsBefore=app.fetchCalls.length;await app.el('reader-audio-download').emit('click');await flush();const complete=await app.reader.audioStatus();assert.equal(complete.totalFiles,7);assert.equal(complete.packs[0].complete,true);assert.equal(app.fetchCalls.length-callsBefore,6,'Previously completed ayahs must be reused when a partial download resumes.');assert.equal(app.fetchCalls.slice(callsBefore).some(call=>call.url===cachedURL),false);
});

test('offline manager reports unavailable Cache API honestly and renders its supported settings panel',async()=>{
  const unsupported=mount({cacheSupported:false});await flush();assert.equal((await unsupported.reader.audioStatus()).supported,false);assert.equal(unsupported.el('reader-audio-download').disabled,true);assert.match(unsupported.el('reader-audio-status').textContent,/cannot save audio offline/);
  const app=mount();await flush();const panel=app.addElement('offline-panel');await app.reader.renderStoragePanel(panel);assert.match(panel.innerHTML,/No Surah audio downloaded/);assert.equal(app.fetchCalls.length,0);
});

test('Urdu interface updates direction and reader labels without altering Arabic source or reading counts',async()=>{
  const app=mount();await flush();app.learning.updateSettings({uiLanguage:'ur'});await flush();assert.equal(app.root.dir,'rtl');assert.equal(app.el('reader-read-tab').textContent,'مطالعہ');assert.ok(app.el('reader-text').innerHTML.includes('نَصّ تَجْرِيبِيّ 1'));assert.equal(app.learning.status(1).readAyahs.length,0);
});

function contentFixture({records=[],handlers={},extraTranslations=[],extraReciters=[]}={}){
  const catalogContext={};vm.runInNewContext(editionsSource,catalogContext);const catalog=clone(catalogContext.COMPASS_EDITIONS);
  catalog.translations.push(...extraTranslations);catalog.reciters.push(...extraReciters);
  const loaded=new Map(),calls=[];const key=(kind,id,chapter)=>`${kind}:${id}:${chapter}`;
  for(const row of records)loaded.set(key(row.kind,row.edition.id,row.surahId),row);
  const service={getCatalog:()=>catalog,getArabic:chapter=>loaded.get(key('arabic','quran-uthmani',chapter))||null,getLoaded:(kind,id,chapter)=>loaded.get(key(kind,id,chapter))||null,
    ready:async()=>{},discover:async()=>{calls.push({kind:'catalog'});return catalog;},
    cacheStatus:async()=>{const items=[...loaded.values()].filter(row=>row.persisted).map(row=>({kind:row.kind,editionId:row.edition.id,surahId:row.surahId,label:row.edition.label,language:row.edition.language,complete:row.complete,bytes:400,purpose:row.kind==='audioTranslation'?'audio-metadata':'text'}));return {supported:true,items,bytes:items.length*400};},
    removeCached:async(kind,id,chapter)=>{calls.push({kind:'remove',sourceKind:kind,id,chapter});loaded.delete(key(kind,id,chapter));return true;}};
  for(const kind of ['arabic','translation','tafsir','audioTranslation']){const method={arabic:'loadArabic',translation:'loadTranslation',tafsir:'loadTafsir',audioTranslation:'loadAudioTranslation'}[kind];service[method]=async(...args)=>{const id=kind==='arabic'?'quran-uthmani':args[0],chapter=kind==='arabic'?args[0]:args[1],options=kind==='arabic'?args[1]:args[2];calls.push({kind,id,chapter,options});if(handlers[kind])return handlers[kind](id,chapter,options,loaded);const row=loaded.get(key(kind,id,chapter));if(!row)throw new Error('Software fixture source unavailable');return row;};}
  return {service,catalog,loaded,calls,key};
}
function textRecord(kind,id,language='en',chapter=1,total=7){return {kind,surahId:chapter,edition:{id,language,label:`Software fixture ${id}`,author:`Fixture author ${id}`,format:'text'},ayahs:Array.from({length:total},(_,i)=>({number:i+1,text:kind==='arabic'?`نَصّ تَجْرِيبِيّ ${i+1}`:`Software ${language} translated fixture ${i+1}`})),complete:true,persisted:true};}
function spokenFixture(id='en.walk',language='en',chapter=1,total=7){return {kind:'audioTranslation',surahId:chapter,edition:{id,sourceEdition:id,language,label:'Software spoken translation fixture',author:'Fixture speaker',sourceUrl:'https://alquran.cloud/',format:'audio',sourceType:'translation'},ayahs:Array.from({length:total},(_,i)=>({number:i+1,url:`https://cdn.islamic.network/quran/audio/128/${id}/${i+1}.mp3`})),complete:true,persisted:true};}
async function select(app,id,value){app.el(id).value=value;await app.el(id).emit('change');await flush();}

test('reader offers the full configured reciter catalog and maps archive paths without accepting traversal',async()=>{
  const source=contentFixture({extraReciters:[{id:'unsafe',label:'Unsafe path fixture',path:'../outside'},{id:'url',label:'Unsafe URL fixture',path:'https://example.test/'}]});const app=mount({contentService:source.service});await flush();
  const menu=app.el('reader-qari').innerHTML;assert.equal((menu.match(/<option/g)||[]).length,25);assert.match(menu,/Abdul Basit/);assert.match(menu,/Maher/);assert.doesNotMatch(menu,/Unsafe/);
  await select(app,'reader-qari','ajamy');await app.el('reader-text').emit('click',{target:app.action('data-reader-play',3)});assert.match(app.audio.src,/Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah\.net\/001003\.mp3$/);
  await select(app,'reader-qari','unsafe');assert.equal(JSON.parse(app.reader.getPreferences()['compass-reader-qari']),'ajamy');assert.equal(app.fetchCalls.length,0);assert.equal(source.calls.length,0);
});

test('language and scholar selectors render cached multilingual text with attribution and require explicit source loading',async()=>{
  const first=textRecord('translation','fr.hamidullah','fr');first.ayahs[0].text='Logiciel français de référence';
  const second=textRecord('translation','fr.fixture','fr');second.ayahs[0].text='Autre traduction logicielle';
  const source=contentFixture({records:[first],extraTranslations:[{id:'fr.fixture',language:'fr',label:'Second French software scholar',author:'Fixture author',format:'text',kind:'translation'}],handlers:{translation:async(id)=>{assert.equal(id,'fr.fixture');return second;}}});
  const app=mount({contentService:source.service});await flush();await select(app,'reader-translation','fr');assert.equal(app.el('reader-translation-edition').value,'fr.hamidullah');assert.match(app.el('reader-text').innerHTML,/Logiciel français de référence/);assert.match(app.el('reader-selected-source').textContent,/fr.hamidullah/);assert.match(app.el('reader-edition-status').textContent,/offline/);assert.equal(source.calls.length,0);
  await select(app,'reader-translation-edition','fr.fixture');assert.doesNotMatch(app.el('reader-text').innerHTML,/Logiciel français de référence/);assert.equal(source.calls.length,0);
  await app.el('reader-load-selection').emit('click');assert.match(app.el('reader-text').innerHTML,/Autre traduction logicielle/);assert.match(app.el('reader-text-source').textContent,/fr.fixture/);assert.equal(source.calls.length,1);assert.equal(app.fetchCalls.length,0);
  const found=app.reader.search('autre traduction');assert.equal(found.length,1);assert.equal(found[0].translation,'Autre traduction logicielle');assert.equal(found[0].language,'fr');assert.equal(found[0].sourceLabel,'Software fixture fr.fixture');assert.equal(app.learning.status(1).readAyahs.length,0);
});

test('an empty reader keeps its offline study page and explicitly loads canonical Arabic chapter text',async()=>{
  const arabic=textRecord('arabic','quran-uthmani','ar');const source=contentFixture({handlers:{arabic:async()=>arabic}});const app=mount({text:{},contentService:source.service,study:{1:{introduction:'Software study introduction',readingGuide:['Software reading guide'],reflectionPrompts:['Software reflection question'],note:'Editorial software fixture'}}});await flush();
  assert.match(app.el('reader-study-page').innerHTML,/Software study introduction/);assert.match(app.el('reader-study-page').innerHTML,/Software reflection question/);assert.equal(source.calls.length,0);assert.equal(app.fetchCalls.length,0);
  await select(app,'reader-translation','ar');await app.el('reader-load-chapter').emit('click');assert.match(app.el('reader-text').innerHTML,/نَصّ تَجْرِيبِيّ 1/);assert.equal((app.el('reader-text').innerHTML.match(/data-ayah=/g)||[]).length,7);assert.equal(source.calls.length,1);assert.equal(source.calls[0].kind,'arabic');assert.equal(app.learning.status(1).readAyahs.length,0);assert.equal(app.reader.search('1:3')[0].text,'نَصّ تَجْرِيبِيّ 3');
});

test('cancelled edition loads and late results for previous Surahs cannot replace the active reader',async()=>{
  const waiting=[];const source=contentFixture({handlers:{translation:(id,chapter,options)=>{const request=deferred();waiting.push({id,chapter,options,...request});return request.promise;}}});const app=mount({contentService:source.service});await flush();await select(app,'reader-translation-edition','en.sahih');
  const old=app.el('reader-load-selection').emit('click');await flush();assert.equal(waiting.length,1);assert.equal(app.el('reader-cancel-selection').hidden,false);
  await select(app,'reader-translation-edition','en.pickthall');assert.equal(waiting[0].options.signal.aborted,true);const late=textRecord('translation','en.sahih');late.ayahs[0].text='OLD SOURCE MUST NOT DISPLAY';waiting[0].resolve(late);await old;assert.doesNotMatch(app.el('reader-text').innerHTML,/OLD SOURCE/);
  const navigation=app.el('reader-load-selection').emit('click');await flush();app.reader.open(112);assert.equal(waiting[1].options.signal.aborted,true);waiting[1].resolve(textRecord('translation','en.pickthall'));await navigation;assert.equal(app.el('reader-surah-title').textContent,'Al-Ikhlas');assert.doesNotMatch(app.el('reader-text').innerHTML,/Software en translated/);
  app.reader.open(1);const leaving=app.el('reader-load-selection').emit('click');await flush();app.dispatch(new app.context.CustomEvent('compass:navigation',{detail:{view:'journey'}}));assert.equal(waiting[2].options.signal.aborted,true);waiting[2].resolve(textRecord('translation','en.pickthall'));await leaving;
});

test('grouped tafsir preserves source references and coverage gaps while stripping remote markup',async()=>{
  const source=contentFixture();const edition=source.catalog.tafsirs.find(row=>row.language==='en');assert.ok(edition);
  const record={kind:'tafsir',surahId:1,edition:{...edition,label:'Software grouped tafsir source'},entries:[{ayahs:[1,2,3],reference:'Software commentary on 1:1–3',text:'<p>Software grouped explanation &amp; source.</p><script>alert("fixture")</script>'},{ayahs:[5],reference:'Software commentary on 1:5',text:'Separate software explanation'}],coverage:[1,2,3,5],complete:false,persisted:true};source.loaded.set(source.key('tafsir',edition.id,1),record);
  const app=mount({contentService:source.service});await flush();await select(app,'reader-tafsir-edition',edition.id);assert.match(app.el('reader-tafsir-status').textContent,/4\/7/);assert.match(app.el('reader-tafsir-book').innerHTML,/Software commentary on 1:1–3/);assert.doesNotMatch(app.el('reader-tafsir-book').innerHTML,/<script|alert\(/);
  await app.el('reader-text').emit('click',{target:app.action('data-reader-tafsir',2)});assert.match(app.el('reader-text').innerHTML,/Software grouped explanation &amp; source\./);assert.match(app.el('reader-text').innerHTML,/Software grouped tafsir source/);assert.match(app.el('reader-text').innerHTML,/Software commentary on 1:1–3/);assert.doesNotMatch(app.el('reader-text').innerHTML,/alert\(|<script/);
  await app.el('reader-text').emit('click',{target:app.action('data-reader-tafsir',4)});assert.match(app.el('reader-text').innerHTML,/no entry for this ayah/);assert.equal(source.calls.length,0,'Cached grouped commentary must not be fetched again or invented for its coverage gap.');assert.equal(app.learning.status(1).readAyahs.length,0);
});

test('tafsir cancellation keeps the current chapter intact when the previous source finishes late',async()=>{
  const pending=deferred();let signal;const source=contentFixture({handlers:{tafsir:(id,chapter,options)=>{signal=options.signal;return pending.promise;}}});const edition=source.catalog.tafsirs[0];const app=mount({contentService:source.service});await flush();await select(app,'reader-tafsir-edition',edition.id);const request=app.el('reader-load-tafsir').emit('click');await flush();await app.el('reader-cancel-tafsir').emit('click');assert.equal(signal.aborted,true);
  pending.resolve({surahId:1,edition,entries:[{ayahs:[1],text:'Cancelled tafsir software text',reference:'1:1'}],coverage:[1],complete:false});await request;assert.equal(app.el('reader-tafsir-book').hidden,true);assert.doesNotMatch(app.el('reader-text').innerHTML,/Cancelled tafsir/);
});

test('spoken translations play only validated translation editions and never substitute recitation or generated speech',async()=>{
  const valid=spokenFixture();const source=contentFixture({records:[valid]});const app=mount({contentService:source.service});await flush();await select(app,'reader-audio-mode','translation');assert.equal(app.el('reader-qari-field').hidden,true);assert.equal(app.el('reader-audio-language-field').hidden,false);assert.equal(source.calls.length,0);
  await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});assert.equal(app.audio.src,'https://cdn.islamic.network/quran/audio/128/en.walk/2.mp3');assert.equal(app.audio.playCalls.length,1);assert.match(app.el('reader-audio-source').textContent,/Spoken translation source/);assert.equal(app.fetchCalls.length,0);
  for(const mutate of [row=>{row.edition.sourceType='quran';},row=>{row.edition.language='ar';},row=>{row.ayahs[0].url='https://everyayah.com/data/Alafasy_128kbps/001001.mp3';},row=>{row.ayahs[0].url='https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3';},row=>{row.ayahs[0].url='https://cdn.islamic.network/quran/audio/128/en.walk/200.mp3';}]){
    const invalid=clone(valid);mutate(invalid);const rejected=contentFixture({handlers:{audioTranslation:async()=>invalid}});const other=mount({contentService:rejected.service});await flush();await select(other,'reader-audio-mode','translation');await other.el('reader-text').emit('click',{target:other.action('data-reader-play',1)});assert.equal(other.audio.playCalls.length,0);assert.equal(other.audio.src,'');assert.match(other.rootMessages.at(-1),/No speech is generated or substituted/);assert.equal(other.fetchCalls.length,0);
  }
});

test('spoken audio downloads, accounting, cached playback and scoped removal remain distinct from Arabic recitation',async()=>{
  const source=contentFixture({records:[spokenFixture()]});const app=mount({contentService:source.service,fetchHook:async()=>audioResponse(10)});await flush();app.cacheItems.set('https://everyayah.com/data/Alafasy_128kbps/001001.mp3',audioResponse(20));await select(app,'reader-audio-mode','translation');await app.el('reader-audio-download').emit('click');await flush();
  const status=await app.reader.audioStatus();assert.equal(status.totalFiles,8);assert.equal(status.totalBytes,90);const translated=status.packs.find(row=>row.mode==='translation');assert.equal(translated.qariId,'translation:en.walk');assert.equal(translated.language,'en');assert.equal(translated.complete,true);assert.equal(app.fetchCalls.length,7);assert.ok(app.fetchCalls.every(row=>row.url.includes('/en.walk/')));
  await app.el('reader-text').emit('click',{target:app.action('data-reader-play',3)});assert.match(app.audio.src,/^blob:/);const local=app.audio.src;await app.el('reader-audio-remove').emit('click');assert.equal(app.cacheItems.size,1);assert.ok(app.cacheItems.has('https://everyayah.com/data/Alafasy_128kbps/001001.mp3'));assert.ok(app.revoked.includes(local));assert.equal(app.audio.src,'');
});

test('offline shelf distinguishes persisted text, grouped tafsir and audio metadata from actual downloaded files',async()=>{
  const source=contentFixture({records:[textRecord('translation','fr.hamidullah','fr'),spokenFixture()]});const app=mount({contentService:source.service});await flush();const panel=app.addElement('expanded-offline');await app.reader.renderStoragePanel(panel);assert.match(panel.innerHTML,/Saved text &amp; source editions|Saved text & source editions/);assert.match(panel.innerHTML,/fr.hamidullah/);assert.match(panel.innerHTML,/Source metadata only/);assert.match(panel.innerHTML,/No Surah audio downloaded/);
  const button=panel.querySelectorAll('[data-storage-edition-remove]').find(row=>row.dataset.storageKind==='translation');assert.ok(button);await button.emit('click');await flush();assert.deepEqual(source.calls.at(-1),{kind:'remove',sourceKind:'translation',id:'fr.hamidullah',chapter:1});assert.equal(source.loaded.has(source.key('translation','fr.hamidullah',1)),false);assert.equal(source.loaded.has(source.key('audioTranslation','en.walk',1)),true);assert.equal(app.fetchCalls.length,0);
});

test('extended reader preferences restore validated catalog choices and reject arbitrary IDs and remote URLs',async()=>{
  const source=contentFixture();const app=mount({contentService:source.service});await flush();const tafsir=source.catalog.tafsirs[0].id;
  app.reader.applyPreferences({'compass-reader-translation':'"fr"','compass-reader-translation-edition':'"fr.hamidullah"','compass-reader-tafsir-edition':JSON.stringify(tafsir),'compass-reader-qari':'"abdulbasit"','compass-reader-audio-mode':'"translation"','compass-reader-audio-language':'"ur"','compass-reader-audio-edition':'"ur.khan"'});app.reader.refresh();
  const before=clone(app.reader.getPreferences());assert.equal(JSON.parse(before['compass-reader-translation']),'fr');assert.equal(JSON.parse(before['compass-reader-translation-edition']),'fr.hamidullah');assert.equal(JSON.parse(before['compass-reader-tafsir-edition']),tafsir);assert.equal(JSON.parse(before['compass-reader-qari']),'abdulbasit');assert.equal(JSON.parse(before['compass-reader-audio-mode']),'translation');assert.equal(JSON.parse(before['compass-reader-audio-language']),'ur');assert.equal(JSON.parse(before['compass-reader-audio-edition']),'ur.khan');assert.equal(app.el('reader-qari-field').hidden,true);
  app.reader.applyPreferences({'compass-reader-translation':'"xx-unknown"','compass-reader-translation-edition':'"https://example.test/text"','compass-reader-tafsir-edition':'"../file"','compass-reader-qari':'"javascript:alert(1)"','compass-reader-audio-mode':'"speech"','compass-reader-audio-language':'"ar"','compass-reader-audio-edition':'"https://example.test/audio"'});assert.deepEqual(clone(app.reader.getPreferences()),before);assert.equal(source.calls.length,0);assert.equal(app.fetchCalls.length,0);
});

test('cached catalog hydration restores its previously saved edition without automatic discovery or fetch',async()=>{
  const source=contentFixture();const stored=new Map([['compass-reader-translation','"sw"'],['compass-reader-translation-edition','"sw.fixture"']]);const app=mount({contentService:source.service,storage:stored});await flush();assert.equal(JSON.parse(app.reader.getPreferences()['compass-reader-translation']),'en');
  const edition={id:'sw.fixture',language:'sw',label:'Software Kiswahili source',format:'text',kind:'translation'};source.catalog.translations.push(edition);const record=textRecord('translation',edition.id,'sw');record.ayahs[0].text='Kiswahili software fixture';source.loaded.set(source.key('translation',edition.id,1),record);
  app.dispatch(new app.context.CustomEvent('compass:catalog'));app.dispatch(new app.context.CustomEvent('compass:edition-cache'));await flush();assert.equal(app.el('reader-translation').value,'sw');assert.equal(app.el('reader-translation-edition').value,edition.id);assert.match(app.el('reader-text').innerHTML,/Kiswahili software fixture/);assert.equal(source.calls.length,0);assert.equal(app.fetchCalls.length,0);
  await app.el('reader-text').emit('click',{target:app.action('data-reader-note',2)});app.el('reader-note-text').value='Unsaved software reflection';app.dispatch(new app.context.CustomEvent('compass:edition-cache'));await flush();assert.equal(app.el('reader-note-dialog').open,true);assert.equal(app.el('reader-note-text').value,'Unsaved software reflection');
});

test('late spoken translation metadata after a source switch never attaches or plays its old URL',async()=>{
  const pending=deferred();let signal;const source=contentFixture({handlers:{audioTranslation:(id,chapter,options)=>{signal=options.signal;return pending.promise;}}});const app=mount({contentService:source.service});await flush();await select(app,'reader-audio-mode','translation');const request=app.el('reader-text').emit('click',{target:app.action('data-reader-play',1)});await flush();assert.ok(signal);
  await select(app,'reader-audio-mode','recitation');assert.equal(signal.aborted,true);await app.el('reader-text').emit('click',{target:app.action('data-reader-play',2)});assert.match(app.audio.src,/everyayah\.com/);const plays=app.audio.playCalls.length;pending.resolve(spokenFixture());await request;assert.equal(app.audio.playCalls.length,plays);assert.match(app.audio.src,/everyayah\.com/);assert.equal(app.audio.paused,false);
});
