'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createStore,validateState,validateBackup,counts,storageKey,localDate}=require('../store.js');
const {SurahCycle}=require('../core.js');
class MemoryStorage{constructor(){this.data=new Map();this.fail=false;}getItem(key){return this.data.has(key)?this.data.get(key):null;}setItem(key,value){if(this.fail)throw new Error('Storage denied');this.data.set(key,String(value));}removeItem(key){if(this.fail)throw new Error('Storage denied');this.data.delete(key);}}
function fixture(){const storage=new MemoryStorage();let instant=new Date(2026,10,7,10,0);const store=createStore({storage,now:()=>new Date(instant),listen:false});return {store,storage,advance(days=1){instant.setDate(instant.getDate()+days);},date(){return localDate(instant);}};}
test('canonical ayah boundaries protect all 114 Surahs and total 6,236',()=>{assert.equal(counts.length,114);assert.equal(counts.reduce((a,b)=>a+b,0),6236);const {store}=fixture();assert.throws(()=>store.markRead(0,1),RangeError);assert.throws(()=>store.markRead(2,287),RangeError);assert.throws(()=>store.markRead(114,7),RangeError);assert.throws(()=>store.markRead(1,1.5),RangeError);assert.equal(store.snapshot().lastRead,null);});

test('spin audio choices and a ribbon bookmark survive backup export and restore',()=>{
  const f=fixture(),placed={version:1,surahId:114,x:.2,y:.08};
  f.storage.setItem('compass-spin-sound','false');f.storage.setItem('compass-spin-voice','true');f.storage.setItem('surah-compass-bookmark-v1',JSON.stringify(placed));
  const backup=f.store.exportBackup(),next=fixture();next.store.importBackup(backup);
  assert.equal(next.storage.getItem('compass-spin-sound'),'false');assert.equal(next.storage.getItem('compass-spin-voice'),'true');assert.deepEqual(JSON.parse(next.storage.getItem('surah-compass-bookmark-v1')),placed);
  for(const parked of [true,false]){const b=f.store.exportBackup();b.preferences['surah-compass-bookmark-v1']=JSON.stringify({version:1,parked});assert.doesNotThrow(()=>validateBackup(b));}
});

test('invalid ribbon positions and audio settings fail before changing local progress',()=>{
  const f=fixture();f.store.markRead(1,1);const before=f.store.snapshot();
  const invalid=[['compass-spin-sound','yes'],['compass-spin-voice',1],['surah-compass-bookmark-v1',{version:1,surahId:115,x:.2,y:.05}],['surah-compass-bookmark-v1',{version:1,surahId:1,x:0,y:.05}],['surah-compass-bookmark-v1',{version:1,surahId:1,x:.2,y:1}],['surah-compass-bookmark-v1',{version:1,parked:'true'}],['surah-compass-bookmark-v1',{version:1,parked:true,surahId:1}],['surah-compass-bookmark-v1',{version:1,surahId:1,x:.2,y:.05,url:'remote'}]];
  for(const [key,value]of invalid){const b=f.store.exportBackup();b.preferences[key]=JSON.stringify(value);assert.throws(()=>f.store.importBackup(b));assert.deepEqual(f.store.snapshot(),before);}
});
test('read marks are unique overall and once per local day; positions do not count as reading',()=>{const f=fixture();f.store.setLastRead(1,4);assert.equal(f.store.status(1).readAyahs.length,0);assert.deepEqual(f.store.logs(),{});f.store.markRead(1,1);f.store.markRead(1,1);assert.deepEqual(f.store.status(1).readAyahs,[1]);assert.equal(f.store.logs()[f.date()].length,1);f.advance();f.store.markRead(1,1);assert.equal(f.store.logs()[f.date()].length,1);assert.equal(Object.keys(f.store.logs()).length,2);assert.deepEqual(f.store.status(1).readAyahs,[1]);});
test('completion is internally consistent and reading reset retains notes/memorization/revisions',()=>{const f=fixture();for(let v=1;v<=7;v++)f.store.markRead(1,v);assert.equal(f.store.status(1).status,'completed');f.store.setStatus(112,'completed');assert.deepEqual(f.store.status(112).readAyahs,[1,2,3,4]);f.store.saveNote(1,2,'A reflection','Sabr');f.store.setMemorized(1,2,true);f.store.scheduleRevision(1,f.date(),3);f.store.resetReading();assert.equal(f.store.status(1).status,'unread');assert.equal(f.store.status(1).readAyahs.length,0);assert.deepEqual(f.store.status(1).memorizedAyahs,[2]);assert.equal(f.store.bookmarks()[0].note,'A reflection');assert.equal(f.store.revisions()[1].intervalDays,3);assert.equal(f.store.snapshot().lastRead,null);assert.deepEqual(f.store.logs(),{});});
test('read-only browser storage continues from memory without dropping changes',()=>{const f=fixture();f.store.markRead(1,1);f.storage.fail=true;f.store.markRead(1,2);f.store.markRead(1,3);assert.equal(f.store.isPersistent(),false);assert.deepEqual(f.store.status(1).readAyahs,[1,2,3]);f.store.saveNote(1,1,'Still here');assert.equal(f.store.bookmarks()[0].note,'Still here');});
test('bookmark/note state is detached from callers and rejects malformed inputs',()=>{const f=fixture();assert.equal(f.store.toggleBookmark(112,1),true);f.store.saveNote(112,1,'Text <script> remains plain text','Reflection');const bookmark=f.store.bookmarks()[0];bookmark.note='External mutation';assert.equal(f.store.bookmarks()[0].note,'Text <script> remains plain text');assert.throws(()=>f.store.saveNote(112,1,'x'.repeat(10001)));assert.throws(()=>f.store.saveNote(112,1,'good',''));assert.throws(()=>f.store.removeBookmark('112:99'));assert.equal(f.store.toggleBookmark(112,1),false);assert.equal(f.store.bookmarks().length,0);});
test('revision completion advances from today and does not mark ayahs read or memorized',()=>{const f=fixture();f.store.scheduleRevision(1,'2026-11-01',7);f.store.markRevised(1);assert.equal(f.store.revisions()[1].dueDate,'2026-11-14');assert.equal(f.store.revisions()[1].lastReviewed,'2026-11-07');assert.equal(f.store.status(1).readAyahs.length,0);assert.equal(f.store.status(1).memorizedAyahs.length,0);assert.throws(()=>f.store.scheduleRevision(1,'2026-02-31',7));assert.throws(()=>f.store.scheduleRevision(1,'2026-11-10',0));});
test('complete backups restore reading, discovery cycle and preferences',()=>{const f=fixture();const cycle=new SurahCycle(null);cycle.next();f.storage.setItem('surah-compass-cycle-v1',JSON.stringify(cycle.serialize()));f.storage.setItem('surah-compass-saved-v1','[1,112]');f.storage.setItem('surah-theme','dark');f.storage.setItem('surah-translation','"ur"');f.store.markRead(1,2);f.store.saveNote(1,2,'My note','Shukr');f.store.updateSettings({uiLanguage:'ur',dailyTarget:25,reminderEnabled:true,reminderTime:'21:30'});const backup=f.store.exportBackup();const destination=fixture();destination.store.importBackup(backup);assert.equal(destination.store.status(1).lastAyah,2);assert.equal(destination.store.bookmarks()[0].note,'My note');assert.equal(destination.store.settings().uiLanguage,'ur');assert.equal(destination.storage.getItem('surah-theme'),'dark');assert.equal(JSON.parse(destination.storage.getItem('surah-compass-cycle-v1')).history.length,1);assert.deepEqual(validateBackup(backup),backup);});
test('invalid backup is rejected before any state or preference writes',()=>{const f=fixture();f.store.markRead(1,1);f.storage.setItem('surah-theme','light');const before=f.store.snapshot();const bad=f.store.exportBackup();bad.preferences['surah-theme']='dark';bad.learning.surahs[1].readAyahs=[1,1];assert.throws(()=>f.store.importBackup(bad));assert.deepEqual(f.store.snapshot(),before);assert.equal(f.storage.getItem('surah-theme'),'light');const malformed=f.store.exportBackup();malformed.preferences['arbitrary-secret']='bad';assert.throws(()=>validateBackup(malformed));const impossible=f.store.exportBackup();impossible.learning.surahs[1].status='completed';assert.throws(()=>validateBackup(impossible));});
test('failed backup persistence rolls back preference writes and preserves learning state',()=>{const f=fixture();f.store.markRead(1,1);f.storage.setItem('surah-theme','light');const backup=f.store.exportBackup();backup.preferences['surah-theme']='dark';const set=f.storage.setItem.bind(f.storage);f.storage.setItem=(key,value)=>{if(key===storageKey)throw new Error('Quota');return set(key,value);};assert.throws(()=>f.store.importBackup(backup));assert.equal(f.storage.getItem('surah-theme'),'light');assert.deepEqual(f.store.status(1).readAyahs,[1]);});
test('settings and restored data are validated, storage refresh observes another tab',()=>{const f=fixture();assert.throws(()=>f.store.updateSettings({dailyTarget:0}));assert.throws(()=>f.store.updateSettings({uiLanguage:'xx'}));assert.throws(()=>f.store.updateSettings({reminderTime:'29:00'}));const other=createStore({storage:f.storage,now:()=>new Date(2026,10,7),listen:false});other.markRead(2,1);f.store.refresh();assert.deepEqual(f.store.status(2).readAyahs,[1]);const invalid=f.store.snapshot();invalid.logs['2026-02-31']=['2:1'];assert.throws(()=>validateState(invalid));});
test('memorization ranges commit once and never imply reading completion',()=>{const f=fixture();let updates=0;f.store.subscribe(()=>updates++);f.store.setMemorizedRange(2,1,286);assert.equal(updates,1);assert.equal(f.store.status(2).memorizedAyahs.length,286);assert.equal(f.store.status(2).status,'unread');f.store.setMemorizedRange(2,1,10,false);assert.equal(f.store.status(2).memorizedAyahs.length,276);assert.throws(()=>f.store.setMemorizedRange(2,285,287));assert.throws(()=>f.store.setMemorizedRange(2,10,5));});
test('current in-memory root preferences override stale stored defaults and never include cloud tokens',()=>{const f=fixture();f.storage.setItem('surah-compass-saved-v1','[1]');const cycle=new SurahCycle(null);cycle.next();const previous=globalThis.CompassApp;globalThis.CompassApp={exportPreferences:()=>({'surah-compass-cycle-v1':JSON.stringify(cycle.serialize()),'surah-compass-saved-v1':'[112]','compass-reader-qari':'"husary"'})};try{const backup=f.store.exportBackup();assert.equal(backup.preferences['surah-compass-saved-v1'],'[112]');assert.equal(JSON.parse(backup.preferences['surah-compass-cycle-v1']).history.length,1);assert.equal(backup.preferences['compass-reader-qari'],'"husary"');globalThis.CompassApp.exportPreferences=()=>({'surah-compass-cloud-session':'secret'});assert.throws(()=>f.store.exportBackup());}finally{if(previous===undefined)delete globalThis.CompassApp;else globalThis.CompassApp=previous;}});
test('restored preference map reaches the root bridge even in memory-only mode',()=>{const f=fixture();f.storage.fail=true;f.store.markRead(1,1);const backup=f.store.exportBackup();backup.preferences['surah-theme']='dark';let received;const previous=globalThis.CompassApp;globalThis.CompassApp={refreshUserState:map=>{received=map;}};try{f.store.importBackup(backup);assert.deepEqual(received,{'surah-theme':'dark'});assert.equal(f.store.isPersistent(),false);}finally{if(previous===undefined)delete globalThis.CompassApp;else globalThis.CompassApp=previous;}});
test('validated current-preference apply hook takes precedence over stale storage refresh',()=>{const f=fixture();f.storage.fail=true;f.store.markRead(1,1);const backup=f.store.exportBackup();backup.preferences['compass-reader-qari']='"minshawi"';let applied,refreshCount=0;const previous=globalThis.CompassApp;globalThis.CompassApp={applyPreferences:map=>{applied=map;},refreshUserState:()=>refreshCount++};try{f.store.importBackup(backup);assert.deepEqual(applied,{'compass-reader-qari':'"minshawi"'});assert.equal(refreshCount,0);const invalid=JSON.parse(JSON.stringify(backup));invalid.preferences['compass-reader-qari']='"invalid"';assert.throws(()=>f.store.importBackup(invalid));assert.equal(refreshCount,0);}finally{if(previous===undefined)delete globalThis.CompassApp;else globalThis.CompassApp=previous;}});

test('multilingual scholar, tafsir, spoken translation and famous reciter preferences roundtrip',()=>{
  const f=fixture();
  const selected={
    'compass-reader-layout':'pages',
    'compass-reader-translation':'fr',
    'compass-reader-translation-edition':'fr.hamidullah',
    'compass-reader-tafsir-edition':'qurancom.168',
    'compass-reader-audio-mode':'translation',
    'compass-reader-audio-language':'ur',
    'compass-reader-audio-edition':'ur.khan',
    'compass-reader-qari':'abdulbasit-mujawwad',
    'compass-reader-font-size':48
  };
  for(const [key,value]of Object.entries(selected))f.storage.setItem(key,JSON.stringify(value));
  const backup=f.store.exportBackup();const destination=fixture();destination.store.importBackup(backup);
  for(const [key,value]of Object.entries(selected)){
    assert.equal(backup.preferences[key],JSON.stringify(value),key);
    assert.equal(destination.storage.getItem(key),JSON.stringify(value),key);
  }
  assert.deepEqual(validateBackup(backup),backup);
});

test('Arabic-only and deliberately empty source choices remain valid backup preferences',()=>{
  const f=fixture(),backup=f.store.exportBackup();
  const selected={'compass-reader-translation':'ar','compass-reader-translation-edition':'','compass-reader-tafsir-edition':'none','compass-reader-audio-mode':'recitation','compass-reader-audio-language':'en','compass-reader-audio-edition':'','compass-reader-qari':'husary','compass-reader-font-size':24};
  backup.preferences=Object.fromEntries(Object.entries(selected).map(([key,value])=>[key,JSON.stringify(value)]));
  f.store.importBackup(backup);
  assert.deepEqual(f.store.exportBackup().preferences,backup.preferences);
  for(const edition of ['builtin:en','builtin:ur']){
    backup.preferences['compass-reader-translation-edition']=JSON.stringify(edition);
    assert.doesNotThrow(()=>validateBackup(backup));
  }
});

test('bounded discovered edition IDs are portable and discovered language codes remain usable',()=>{
  const f=fixture(),backup=f.store.exportBackup();
  const selected={'compass-reader-translation':'fr','compass-reader-translation-edition':'fr.new_scholar-2','compass-reader-tafsir-edition':'ur.newcommentary','compass-reader-audio-language':'fr','compass-reader-audio-edition':'fr.newvoice','compass-reader-qari':'everyayah.new_reciter_128kbps'};
  backup.preferences=Object.fromEntries(Object.entries(selected).map(([key,value])=>[key,JSON.stringify(value)]));
  assert.deepEqual(validateBackup(backup),backup);
  backup.preferences['compass-reader-tafsir-edition']='"qurancom.99999"';
  assert.doesNotThrow(()=>validateBackup(backup));
  const previous=globalThis.CompassContent;
  globalThis.CompassContent={getCatalog:()=>({translations:[{id:'ace.newscholar',language:'ace'}],audioTranslations:[{id:'ace.newvoice',language:'ace'}],tafsirs:[],reciters:[]})};
  try{
    backup.preferences['compass-reader-translation']='"ace"';backup.preferences['compass-reader-audio-language']='"ace"';
    backup.preferences['compass-reader-translation-edition']='"ace.newscholar"';backup.preferences['compass-reader-audio-edition']='"ace.newvoice"';
    assert.doesNotThrow(()=>validateBackup(backup));
    backup.preferences['compass-reader-translation-edition']='"en.walk"';
    assert.throws(()=>validateBackup(backup),/translation edition/);
  }finally{if(previous===undefined)delete globalThis.CompassContent;else globalThis.CompassContent=previous;}
});

test('malformed reader sources and known wrong-kind editions are rejected before writes or state changes',()=>{
  const invalid=[
    ['compass-reader-translation-edition','https://example.com/en.sahih'],
    ['compass-reader-translation-edition','javascript:alert(1)'],
    ['compass-reader-translation-edition','en.scholar/../../file'],
    ['compass-reader-translation-edition','en..scholar'],
    ['compass-reader-translation-edition','en.'+'x'.repeat(121)],
    ['compass-reader-translation-edition',{id:'en.sahih'}],
    ['compass-reader-translation-edition','ar.muyassar'],
    ['compass-reader-translation-edition','en.walk'],
    ['compass-reader-tafsir-edition','en.sahih'],
    ['compass-reader-tafsir-edition','ur.khan'],
    ['compass-reader-tafsir-edition','qurancom.100000'],
    ['compass-reader-tafsir-edition','qurancom.0'],
    ['compass-reader-audio-edition','en.sahih'],
    ['compass-reader-audio-edition','ar.jalalayn'],
    ['compass-reader-audio-edition','AR.unverifiedvoice'],
    ['compass-reader-audio-edition','file:///voice.mp3'],
    ['compass-reader-qari','everyayah.reciter/../file'],
    ['compass-reader-qari','everyayah.'+'x'.repeat(221)],
    ['compass-reader-qari','unknown-reciter'],
    ['compass-reader-audio-mode','both'],
    ['compass-reader-layout','unknown'],
    ['compass-reader-layout',{mode:'pages'}],
    ['compass-reader-audio-language','ar'],
    ['compass-reader-audio-language','en-US'],
    ['compass-reader-translation','zzz'],
    ['compass-reader-translation',{language:'en'}],
    ['compass-reader-font-size',49]
  ];
  for(const [key,value]of invalid){
    const f=fixture();f.store.markRead(1,1);f.storage.setItem('surah-theme','light');
    const before=f.store.snapshot(),beforeStorage=new Map(f.storage.data),backup=f.store.exportBackup();
    backup.preferences['surah-theme']='dark';backup.preferences[key]=JSON.stringify(value);
    let writes=0,updates=0;const set=f.storage.setItem.bind(f.storage);f.storage.setItem=(k,v)=>{writes++;set(k,v);};f.store.subscribe(()=>updates++);
    assert.throws(()=>f.store.importBackup(backup),undefined,`${key}: ${JSON.stringify(value)}`);
    assert.equal(writes,0,key);assert.equal(updates,0,key);assert.deepEqual(f.store.snapshot(),before,key);assert.deepEqual(f.storage.data,beforeStorage,key);
  }
});
