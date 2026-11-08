'use strict';
// Exercises production content.js with explicit source fixtures and memory IndexedDB.
// These fixtures are not Quran/tafsir text and are never written into the app bundle.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const catalogue=fs.readFileSync(path.join(root,'data/surahs.js'),'utf8');
const editions=fs.readFileSync(path.join(root,'data/editions.js'),'utf8');
const source=fs.readFileSync(path.join(root,'content.js'),'utf8');
const rows=JSON.parse(fs.readFileSync(path.join(root,'data/surahs.json'),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));
const reply=value=>({ok:true,status:200,headers:{get(){return null;}},async json(){return clone(value);}});
async function tick(){for(let i=0;i<16;i++)await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));}
function idb(records,failWrites=false){return {open(){const request={};const database={objectStoreNames:{contains(){return true;}},createObjectStore(){},transaction(){const tx={objectStore(){return{
  get(key){const request={};queueMicrotask(()=>{request.result=records.has(key)?clone(records.get(key)):undefined;request.onsuccess?.();});return request;},
  getAll(){const request={};queueMicrotask(()=>{request.result=clone([...records.values()]);request.onsuccess?.();});return request;},
  put(record){queueMicrotask(()=>{if(failWrites){tx.error=new Error('Mock quota exceeded');tx.onerror?.();return;}records.set(record.key,clone(record));tx.oncomplete?.();});},
  delete(key){queueMicrotask(()=>{if(failWrites){tx.error=new Error('Mock quota exceeded');tx.onerror?.();return;}records.delete(key);tx.oncomplete?.();});}
};}};return tx;}};queueMicrotask(()=>{request.result=database;request.onsuccess?.();});return request;}};}
function mount({fetcher=async()=>{throw new Error('Mock offline source');},records=new Map(),offlineStorage=true,failWrites=false,bundled}={}){
  const calls=[],events=[];
  const context=vm.createContext({fetch:async(url,options)=>{calls.push({url,options});return fetcher(url,options,calls.length);},URL,AbortSignal,TextEncoder,console,CustomEvent:class CustomEvent{constructor(type){this.type=type;}},dispatchEvent:event=>events.push(event.type)});
  if(offlineStorage)context.indexedDB=idb(records,failWrites);
  vm.runInContext(catalogue,context,{filename:'surahs.js'});
  vm.runInContext(editions,context,{filename:'editions.js'});
  if(bundled){context.QURAN=bundled;context.QURAN_SOURCES={arabic:'Test fixture base Arabic'};}
  vm.runInContext(source,context,{filename:'content.js'});
  return{api:context.CompassContent,context,calls,events,records};
}
function payload(kind,id,surahId=1){
  const s=rows[surahId-1],base=rows.slice(0,surahId-1).reduce((n,c)=>n+c.total_verses,0),language=kind==='arabic'?'ar':id.split('.')[0];
  const format=kind==='audioTranslation'?'audio':'text',type=kind==='arabic'?'quran':kind==='tafsir'?'tafsir':'translation';
  const ayahs=Array.from({length:s.total_verses},(_,i)=>({number:base+i+1,numberInSurah:i+1,text:kind==='arabic'?'نصٌّ تجريبيٌّ محفوظٌ كما هو':'Source fixture text '+(i+1),...(format==='audio'?{audio:`https://cdn.islamic.network/quran/audio/128/${id}/${base+i+1}.mp3`}:{})}));
  return{code:200,status:'OK',data:{number:surahId,numberOfAyahs:s.total_verses,edition:{identifier:id,format,type,language,englishName:'Source-confirmed fixture edition'},ayahs}};
}
const qurancomMetadata={tafsirs:[{id:169,name:'Source-confirmed commentary fixture',author_name:'Fixture author',language_name:'english',slug:'en-tafisr-ibn-kathir'}]};

test('startup is offline-only and configured fallbacks never imply live availability',async()=>{
  const app=mount();await app.api.ready();
  assert.equal(app.calls.length,0);
  const cat=app.api.getCatalog();
  assert.equal(cat.reciters.length,25);assert.equal(cat.translations.length,20);
  assert.ok(cat.translations.filter(e=>e.language==='en').length>=6);assert.ok(cat.translations.filter(e=>e.language==='ur').length>=3);
  assert.ok(cat.translations.some(e=>e.language==='fr'));assert.ok(cat.translations.some(e=>e.language==='bn'));
  assert.ok([...cat.reciters,...cat.translations,...cat.tafsirs,...cat.audioTranslations].every(e=>e.status==='configured'));
  assert.equal(app.api.getLoaded('translation','en.sahih',1),null);
});

test('Arabic loader preserves source text byte for byte and validates chapter numbering',async()=>{
  const body=payload('arabic','quran-uthmani',2);
  const app=mount({fetcher:async()=>reply(body)});await app.api.ready();
  const result=await app.api.loadArabic(2);
  assert.equal(result.ayahs.length,286);assert.equal(result.ayahs[0].text,body.data.ayahs[0].text);
  assert.equal(result.ayahs[285].number,286);assert.equal(result.complete,true);assert.equal(result.persisted,true);
  assert.equal(result.edition.status,'verified');assert.equal(result.edition.sourceType,'quran');
  assert.match(app.calls[0].url,/\/surah\/2\/quran-uthmani$/);
  assert.equal(app.calls[0].options.credentials,'omit');assert.equal(app.calls[0].options.referrerPolicy,'no-referrer');
});

test('already installed Arabic is reused without external requests',async()=>{
  const original=Array.from({length:7},(_,i)=>({id:i+1,text:'نصٌّ تجريبيٌّ مضبوطٌ'}));
  const app=mount({bundled:{1:original}});await app.api.ready();
  const result=await app.api.loadArabic(1);
  assert.equal(app.calls.length,0);assert.equal(result.fromCache,true);assert.equal(result.persisted,true);
  assert.equal(result.edition.label,'Test fixture base Arabic');assert.equal(result.ayahs[0].text,original[0].text);
});

test('same edition requests coalesce while cancellation affects only its subscriber',async()=>{
  let resolveSource;
  const response=new Promise(resolve=>{resolveSource=resolve;});
  const app=mount({offlineStorage:false,fetcher:()=>response});await app.api.ready();
  const controller=new AbortController();
  const first=app.api.loadTranslation('en.sahih',1,{signal:controller.signal});
  const cancelled=assert.rejects(first,{name:'AbortError'});
  const second=app.api.loadTranslation('en.sahih',1);
  await tick();assert.equal(app.calls.length,1);
  controller.abort();await cancelled;
  resolveSource(reply(payload('translation','en.sahih')));
  const result=await second;
  assert.equal(result.ayahs.length,7);assert.equal(result.persisted,false);
  assert.equal(app.calls.length,1);
  assert.equal(app.api.getLoaded('translation','en.sahih',1).ayahs[0].text,result.ayahs[0].text);
});

test('malformed, incomplete, or incorrectly attributed translation responses are never cached',async()=>{
  const mutations=[b=>b.data.number=2,b=>b.data.edition.identifier='en.pickthall',b=>b.data.ayahs.pop(),b=>b.data.ayahs[1].numberInSurah=1,b=>b.data.ayahs[0].text=''];
  for(const mutate of mutations){const body=payload('translation','en.sahih');mutate(body);const app=mount({fetcher:async()=>reply(body)});await app.api.ready();await assert.rejects(app.api.loadTranslation('en.sahih',1));assert.equal(app.api.getLoaded('translation','en.sahih',1),null);assert.equal((await app.api.cacheStatus()).items.length,0);}
});

test('persisted editions hydrate on reload and remain available without a source connection',async()=>{
  const records=new Map(),first=mount({records,fetcher:async()=>reply(payload('translation','ur.jalandhry'))});await first.api.ready();
  const original=await first.api.loadTranslation('ur.jalandhry',1);assert.equal(original.persisted,true);
  const offline=mount({records});await offline.api.ready();
  const loaded=offline.api.getLoaded('translation','ur.jalandhry',1);assert.ok(loaded);assert.equal(loaded.persisted,true);
  const restored=await offline.api.loadTranslation('ur.jalandhry',1);assert.equal(restored.fromCache,true);assert.equal(restored.ayahs[0].text,original.ayahs[0].text);assert.equal(offline.calls.length,0);
  const status=await offline.api.cacheStatus();assert.equal(status.items.length,1);assert.equal(status.items[0].editionId,'ur.jalandhry');assert.ok(status.bytes>0);
  assert.equal(await offline.api.removeCached('translation','ur.jalandhry',1),true);assert.equal(offline.api.getLoaded('translation','ur.jalandhry',1),null);assert.equal((await offline.api.cacheStatus()).items.length,0);
});

test('failed offline persistence never claims downloaded content is saved',async()=>{
  const app=mount({failWrites:true,fetcher:async()=>reply(payload('translation','en.sahih'))});await app.api.ready();
  const result=await app.api.loadTranslation('en.sahih',1);
  assert.equal(result.persisted,false);assert.equal(result.fromCache,false);
  assert.equal(app.api.getLoaded('translation','en.sahih',1).persisted,false);
  assert.equal((await app.api.cacheStatus()).items.length,0);
});

test('a cached record with an inconsistent content format is rejected rather than presented as a translation',async()=>{
  const records=new Map(),first=mount({records,fetcher:async()=>reply(payload('translation','en.sahih'))});await first.api.ready();
  await first.api.loadTranslation('en.sahih',1);
  const record=records.get('translation:en.sahih:1');record.result.edition.format='audio';records.set(record.key,record);
  const offline=mount({records});await offline.api.ready();
  assert.equal(offline.api.getLoaded('translation','en.sahih',1),null);
  assert.equal((await offline.api.cacheStatus()).items.length,0);
  await assert.rejects(offline.api.loadTranslation('en.sahih',1));
});

test('catalog discovery verifies source metadata and never treats Arabic recitation as spoken translation',async()=>{
  const metadata={code:200,data:[
    {identifier:'en.sahih',format:'text',type:'translation',language:'en',englishName:'Source English scholar'},
    {identifier:'es.fixture',format:'text',type:'translation',language:'es',englishName:'Source Spanish scholar'},
    {identifier:'ar.alafasy',format:'audio',type:'versebyverse',language:'ar',englishName:'Recitation'},
    {identifier:'en.walk',format:'audio',type:'translation',language:'en',englishName:'Verified spoken-English reader'}
  ]};
  const app=mount({fetcher:async url=>reply(url.includes('/edition')?metadata:url.includes('/resources/tafsirs')?{tafsirs:[...qurancomMetadata.tafsirs,{id:999,name:'Source Urdu tafsir fixture',author_name:'Fixture scholar',language_name:'urdu'}]}:{one:{subfolder:'Alafasy_128kbps',name:'Source Reciter label'}})});await app.api.ready();
  const cat=await app.api.discover();
  assert.equal(app.calls.length,3);
  assert.equal(cat.translations.find(e=>e.id==='es.fixture').status,'verified');
  assert.equal(cat.translations.find(e=>e.id==='en.sahih').label,'Source English scholar');
  assert.equal(cat.reciters.find(e=>e.id==='alafasy').label,'Source Reciter label');
  assert.equal(cat.tafsirs.find(e=>e.id==='qurancom.999').language,'ur');
  assert.equal(cat.audioTranslations.find(e=>e.id==='en.walk').status,'verified');
  assert.ok(!cat.audioTranslations.some(e=>e.id==='ar.alafasy'));
  assert.equal(cat.errors.length,0);assert.ok(app.events.includes('compass:catalog'));
});

test('failed live discovery retains explicit configured fallbacks and reports source failures',async()=>{
  const app=mount();await app.api.ready();const before=app.api.getCatalog();const after=await app.api.discover();
  assert.equal(after.reciters.length,before.reciters.length);assert.equal(after.translations.length,before.translations.length);
  assert.equal(after.errors.length,3);assert.equal(after.sourceStatus.alquran,'unavailable');
  assert.ok(after.translations.every(e=>e.status==='configured'));
});

test('tafsir uses source-grouped ayahs, escapes source markup into plain text and preserves coverage gaps',async()=>{
  const passage={resource_id:169,verse_key:'1:1-3',text:'<p>Fixture &amp; commentary.</p><script>UNSAFE SCRIPT CONTENT</script><p>Second paragraph.</p>'};
  const app=mount({fetcher:async url=>reply(url.includes('/resources/tafsirs')?qurancomMetadata:{tafsirs:[passage,passage],pagination:{next_page:null}})});await app.api.ready();
  const result=await app.api.loadTafsir('qurancom.169',1);
  assert.equal(result.entries.length,1,'Source-repeated grouped commentary must not be duplicated for display');
  assert.deepEqual([...result.entries[0].ayahs],[1,2,3]);assert.deepEqual([...result.coverage],[1,2,3]);assert.equal(result.complete,false);
  assert.equal(result.edition.author,'Fixture author');assert.match(result.entries[0].text,/Fixture & commentary/);
  assert.ok(!result.entries[0].text.includes('<p>'));assert.ok(!result.entries[0].text.includes('UNSAFE SCRIPT CONTENT'));
  assert.equal(result.persisted,true);assert.equal(app.calls.length,2);
});

test('tafsir references from a different chapter or invalid pagination are rejected without saving commentary',async()=>{
  for(const body of [
    {tafsirs:[{resource_id:169,verse_key:'2:1',text:'Fixture commentary'}]},
    {tafsirs:[{resource_id:169,verse_key:'1:1',text:'Fixture commentary'}],pagination:{next_page:1}}
  ]){const app=mount({fetcher:async url=>reply(url.includes('/resources/tafsirs')?qurancomMetadata:body)});await app.api.ready();await assert.rejects(app.api.loadTafsir('qurancom.169',1));assert.equal((await app.api.cacheStatus()).items.length,0);}
});

test('spoken translation requires verified audio-translation metadata and vetted HTTPS source URLs',async()=>{
  const app=mount({fetcher:async()=>reply(payload('audioTranslation','en.walk'))});await app.api.ready();
  const result=await app.api.loadAudioTranslation('en.walk',1);
  assert.equal(result.edition.sourceType,'translation');assert.equal(result.edition.format,'audio');assert.equal(result.ayahs.length,7);
  assert.match(result.ayahs[0].url,/^https:\/\/cdn\.islamic\.network\/quran\/audio\/128\/en\.walk\//);
  assert.equal((await app.api.cacheStatus()).items[0].purpose,'audio-metadata');
  for(const mutate of [b=>b.data.edition.type='versebyverse',b=>b.data.edition.language='ar',b=>b.data.ayahs[0].audio='https://untrusted.example.test/speech.mp3',b=>b.data.ayahs[0].audio=b.data.ayahs[0].audio.replace('https:','http:')]){
    const body=payload('audioTranslation','en.walk');mutate(body);const bad=mount({fetcher:async()=>reply(body)});await bad.api.ready();await assert.rejects(bad.api.loadAudioTranslation('en.walk',1));assert.equal((await bad.api.cacheStatus()).items.length,0);
  }
});

test('unknown editions and already cancelled requests cannot start external reads',async()=>{
  const app=mount();await app.api.ready();
  await assert.rejects(app.api.loadTranslation('missing.edition',1));
  const controller=new AbortController();controller.abort();
  await assert.rejects(app.api.loadTranslation('en.sahih',1,{signal:controller.signal}),{name:'AbortError'});
  assert.equal(app.calls.length,0);
});
