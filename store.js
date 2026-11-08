/* Local learning state. Quran text/audio are separate offline packs. */
(function(root){
  'use strict';
  const KEY='surah-compass-learning-v2';
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const PREFERENCE_KEYS=['surah-compass-cycle-v1','surah-compass-saved-v1','surah-theme','surah-translation','surah-font-size','surah-compass-filters-v1','surah-spin-filters','surah-compass-bookmark-v1','compass-spin-sound','compass-spin-voice','compass-reader-layout','compass-reader-translation','compass-reader-translation-edition','compass-reader-tafsir-edition','compass-reader-audio-mode','compass-reader-audio-language','compass-reader-audio-edition','compass-reader-font-size','compass-reader-qari','compass-reader-follow','compass-reader-rate'];
  const baseCatalog=root.COMPASS_EDITIONS||(typeof module!=='undefined'&&module.exports&&typeof require==='function'?require('./data/editions.js'):{reciters:[],translations:[],tafsirs:[],audioTranslations:[]});
  const isoLanguages=new Set('aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' '));
  function editionCatalog(){try{return root.CompassContent?.getCatalog?.()||root.COMPASS_EDITIONS||baseCatalog;}catch{return baseCatalog;}}
  function knownEdition(list,id){return (editionCatalog()[list]||[]).find(e=>e.id===id)||(baseCatalog[list]||[]).find(e=>e.id===id);}
  function knownElsewhere(list,id){return ['reciters','translations','tafsirs','audioTranslations'].some(other=>other!==list&&knownEdition(other,id));}
  function readerLanguage(value,audio=false){return typeof value==='string'&&/^[a-z]{2,3}$/.test(value)&&(!audio||value!=='ar')&&(isoLanguages.has(value)||['translations','audioTranslations'].some(list=>(editionCatalog()[list]||[]).some(e=>e.language===value)));}
  function sourceEditionId(value,audio=false){return typeof value==='string'&&value.length<=120&&/^[a-z]{2,3}\.[a-z0-9][a-z0-9_.-]*$/i.test(value)&&!value.includes('..')&&(!audio||!/^ar\./i.test(value));}
  function translationEdition(value){return value===''||['builtin:en','builtin:ur'].includes(value)||!!knownEdition('translations',value)||!knownElsewhere('translations',value)&&sourceEditionId(value);}
  function tafsirEdition(value){return value==='none'||!!knownEdition('tafsirs',value)||!knownElsewhere('tafsirs',value)&&(sourceEditionId(value)||typeof value==='string'&&/^qurancom\.[1-9][0-9]{0,4}$/.test(value));}
  function audioEdition(value){return value===''||!!knownEdition('audioTranslations',value)||!knownElsewhere('audioTranslations',value)&&sourceEditionId(value,true);}
  function reciterEdition(value){return typeof value==='string'&&(['alafasy','husary','minshawi'].includes(value)||!!knownEdition('reciters',value)||value.length<=220&&/^everyayah\.[a-z0-9][a-z0-9_.-]*$/i.test(value)&&!value.includes('..'));}
  const clone=value=>JSON.parse(JSON.stringify(value));
  const localDate=value=>{const d=value instanceof Date?value:new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const isDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&localDate(new Date(value+'T12:00:00'))===value;
  const timestamp=value=>typeof value==='string'&&value.length<40&&!Number.isNaN(Date.parse(value));
  const chapter=id=>Number.isInteger(id)&&id>=1&&id<=114;
  const ayah=(id,value)=>chapter(id)&&Number.isInteger(value)&&value>=1&&value<=COUNTS[id-1];
  const pair=value=>{if(typeof value!=='string'||!/^\d+:\d+$/.test(value))return false;const [id,v]=value.split(':').map(Number);return ayah(id,v);};
  const blankStatus=()=>({status:'unread',lastAyah:1,readAyahs:[],memorizedAyahs:[],updatedAt:null});
  function defaultState(now){return {version:2,updatedAt:now,surahs:{},bookmarks:[],settings:{uiLanguage:'en',dailyTarget:10,reminderTime:'20:00',reminderEnabled:false},logs:{},revisions:{},lastRead:null};}
  function validateState(input){
    if(!input||input.version!==2||typeof input!=='object'||!timestamp(input.updatedAt)||!input.surahs||typeof input.surahs!=='object'||Array.isArray(input.surahs)||!Array.isArray(input.bookmarks)||input.bookmarks.length>6236||!input.settings||typeof input.settings!=='object'||!input.logs||typeof input.logs!=='object'||Array.isArray(input.logs)||!input.revisions||typeof input.revisions!=='object'||Array.isArray(input.revisions))throw new Error('Invalid learning backup.');
    const out=defaultState(input.updatedAt);
    for(const [key,s] of Object.entries(input.surahs)){
      const id=Number(key);if(String(id)!==key||!chapter(id)||!s||!['unread','reading','completed'].includes(s.status)||!ayah(id,s.lastAyah)||!Array.isArray(s.readAyahs)||!Array.isArray(s.memorizedAyahs)||s.readAyahs.length>COUNTS[id-1]||s.memorizedAyahs.length>COUNTS[id-1])throw new Error('Invalid Surah progress.');
      for(const list of [s.readAyahs,s.memorizedAyahs])if(new Set(list).size!==list.length||!list.every(v=>ayah(id,v)))throw new Error('Invalid ayah progress.');
      if(s.status==='completed'&&s.readAyahs.length!==COUNTS[id-1])throw new Error('Completed Surah progress is inconsistent.');
      if(s.updatedAt!==null&&!timestamp(s.updatedAt))throw new Error('Invalid progress timestamp.');
      out.surahs[key]={status:s.status,lastAyah:s.lastAyah,readAyahs:[...s.readAyahs].sort((a,b)=>a-b),memorizedAyahs:[...s.memorizedAyahs].sort((a,b)=>a-b),updatedAt:s.updatedAt};
    }
    const seen=new Set();
    for(const b of input.bookmarks){if(!b||!ayah(b.surahId,b.ayah)||b.key!==`${b.surahId}:${b.ayah}`||seen.has(b.key)||typeof b.collection!=='string'||!b.collection.trim()||b.collection.length>80||typeof b.note!=='string'||b.note.length>10000||!timestamp(b.createdAt)||!timestamp(b.updatedAt))throw new Error('Invalid bookmark or note.');seen.add(b.key);out.bookmarks.push({key:b.key,surahId:b.surahId,ayah:b.ayah,collection:b.collection,note:b.note,createdAt:b.createdAt,updatedAt:b.updatedAt});}
    const st=input.settings;if(!['en','ur'].includes(st.uiLanguage)||!Number.isInteger(st.dailyTarget)||st.dailyTarget<1||st.dailyTarget>500||typeof st.reminderEnabled!=='boolean'||typeof st.reminderTime!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(st.reminderTime))throw new Error('Invalid learning settings.');out.settings={uiLanguage:st.uiLanguage,dailyTarget:st.dailyTarget,reminderTime:st.reminderTime,reminderEnabled:st.reminderEnabled};
    if(Object.keys(input.logs).length>36600)throw new Error('Too many reading log entries.');
    for(const [date,ids] of Object.entries(input.logs)){if(!isDate(date)||!Array.isArray(ids)||ids.length>6236||new Set(ids).size!==ids.length||!ids.every(pair))throw new Error('Invalid daily reading log.');out.logs[date]=[...ids];}
    for(const [key,r] of Object.entries(input.revisions)){const id=Number(key);if(String(id)!==key||!chapter(id)||!r||!isDate(r.dueDate)||!Number.isInteger(r.intervalDays)||r.intervalDays<1||r.intervalDays>90||(r.lastReviewed!==null&&!isDate(r.lastReviewed)))throw new Error('Invalid revision schedule.');out.revisions[key]={dueDate:r.dueDate,intervalDays:r.intervalDays,lastReviewed:r.lastReviewed};}
    if(input.lastRead!==null){const p=input.lastRead;if(!p||!ayah(p.surahId,p.ayah)||!timestamp(p.at))throw new Error('Invalid last-read position.');out.lastRead={surahId:p.surahId,ayah:p.ayah,at:p.at};}
    return out;
  }
  function validatePreference(key,raw){
    if(!PREFERENCE_KEYS.includes(key)||typeof raw!=='string'||raw.length>50000)throw new Error('Invalid backup preference.');
    if(key==='surah-theme'){if(!['light','dark'].includes(raw))throw new Error('Invalid theme preference.');return raw;}
    let value;try{value=JSON.parse(raw);}catch{throw new Error('Invalid backup preference data.');}
    if(['compass-spin-sound','compass-spin-voice'].includes(key)&&typeof value!=='boolean')throw new Error('Invalid spin audio preference.');
    if(key==='surah-compass-bookmark-v1'){
      const keys=value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value):[];
      const placed=keys.length===4&&keys.every(k=>['version','surahId','x','y'].includes(k))&&chapter(value.surahId)&&Number.isFinite(value.x)&&value.x>=.05&&value.x<=.95&&Number.isFinite(value.y)&&value.y>=.03&&value.y<=.8;
      const parked=keys.length===2&&keys.every(k=>['version','parked'].includes(k))&&typeof value.parked==='boolean';
      if(value?.version!==1||!(placed||parked))throw new Error('Invalid book bookmark preference.');
    }
    if(key==='surah-compass-cycle-v1'){const ids=[...(Array.isArray(value?.remaining)?value.remaining:[]),...(Array.isArray(value?.history)?value.history:[])];if(value?.version!==1||!Number.isSafeInteger(value.cycle)||value.cycle<1||ids.length!==114||new Set(ids).size!==114||!ids.every(chapter))throw new Error('Invalid discovery cycle.');}
    if(key==='surah-compass-saved-v1'&&(!Array.isArray(value)||value.length>114||new Set(value).size!==value.length||!value.every(chapter)))throw new Error('Invalid saved Surahs.');
    if(key==='surah-translation'&&!['en','ur','ar'].includes(value))throw new Error('Invalid translation preference.');
    if(key==='surah-font-size'&&(!Number.isFinite(value)||value<22||value>46))throw new Error('Invalid font preference.');
    if(key==='surah-compass-filters-v1'&&(!value||typeof value!=='object'||Array.isArray(value)))throw new Error('Invalid spin filters.');
    if(key==='surah-spin-filters'){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid spin filters.');for(const [field,selected]of Object.entries(value)){const options={'spin-type':['all','meccan','medinan'],'spin-length':['all','short','medium','long'],'spin-status':['all','unread','reading','completed'],'spin-juz':['all',...Array.from({length:30},(_,i)=>String(i+1))]};if(!options[field]?.includes(selected))throw new Error('Invalid spin filter selection.');}}
    if(key==='compass-reader-translation'&&!readerLanguage(value))throw new Error('Invalid reader translation language.');
    if(key==='compass-reader-translation-edition'&&!translationEdition(value))throw new Error('Invalid reader translation edition.');
    if(key==='compass-reader-tafsir-edition'&&!tafsirEdition(value))throw new Error('Invalid reader tafsir edition.');
    if(key==='compass-reader-layout'&&!['pages','ayahs'].includes(value))throw new Error('Invalid reader page layout.');
    if(key==='compass-reader-audio-mode'&&!['recitation','translation'].includes(value))throw new Error('Invalid reader audio mode.');
    if(key==='compass-reader-audio-language'&&!readerLanguage(value,true))throw new Error('Invalid spoken translation language.');
    if(key==='compass-reader-audio-edition'&&!audioEdition(value))throw new Error('Invalid spoken translation edition.');
    if(key==='compass-reader-font-size'&&(!Number.isFinite(value)||value<24||value>48))throw new Error('Invalid reader font size.');
    if(key==='compass-reader-qari'&&!reciterEdition(value))throw new Error('Invalid reciter preference.');
    if(key==='compass-reader-follow'&&typeof value!=='boolean')throw new Error('Invalid reader follow preference.');
    if(key==='compass-reader-rate'&&![0.75,1,1.25,1.5].includes(value))throw new Error('Invalid recitation speed.');
    return raw;
  }
  function validateBackup(input){
    if(!input||input.format!=='surah-compass-backup-v2'||!timestamp(input.createdAt)||!input.preferences||typeof input.preferences!=='object'||Array.isArray(input.preferences))throw new Error('Choose a Surah Compass backup file.');
    const preferences={};for(const [key,raw] of Object.entries(input.preferences))preferences[key]=validatePreference(key,raw);
    return {format:'surah-compass-backup-v2',createdAt:input.createdAt,learning:validateState(input.learning),preferences};
  }
  function createStore(options={}){
    let storage=options.storage;try{if(storage===undefined)storage=root.localStorage;}catch{storage=null;}
    const now=options.now||(()=>new Date());const iso=()=>now().toISOString();const listeners=new Set();let persistent=!!storage;
    function load(){try{const raw=storage?.getItem(KEY);return raw?validateState(JSON.parse(raw)):null;}catch{return null;}}
    let state=load()||defaultState(iso());
    function emit(){const snap=clone(state);for(const callback of listeners){try{callback(clone(snap));}catch(error){root.console?.error('Learning view update failed',error);}}if(typeof options.onChange==='function')options.onChange(clone(snap));if(typeof root.dispatchEvent==='function'&&typeof root.CustomEvent==='function')root.dispatchEvent(new root.CustomEvent('compass:state',{detail:snap}));}
    function mutate(action){if(persistent){const latest=load();if(latest)state=latest;}action(state);state.updatedAt=iso();try{if(persistent)storage.setItem(KEY,JSON.stringify(state));}catch{persistent=false;}emit();return clone(state);}
    function check(id,v){if(!chapter(id)||(v!==undefined&&!ayah(id,v)))throw new RangeError('Choose a valid Surah and ayah.');}
    function logRead(s,id,v){const date=localDate(now());const key=`${id}:${v}`;if(!s.logs[date])s.logs[date]=[];if(!s.logs[date].includes(key))s.logs[date].push(key);}
    const api={
      snapshot:()=>clone(state),status:id=>{check(id);return clone(state.surahs[id]||blankStatus());},settings:()=>clone(state.settings),bookmarks:()=>clone(state.bookmarks),logs:()=>clone(state.logs),revisions:()=>clone(state.revisions),isPersistent:()=>persistent,
      setLastRead(id,v){check(id,v);mutate(s=>{const item=s.surahs[id]||(s.surahs[id]=blankStatus());item.lastAyah=v;item.updatedAt=iso();s.lastRead={surahId:id,ayah:v,at:iso()};});},
      markRead(id,v){check(id,v);mutate(s=>{const item=s.surahs[id]||(s.surahs[id]=blankStatus());if(!item.readAyahs.includes(v))item.readAyahs.push(v);item.readAyahs.sort((a,b)=>a-b);item.status=item.readAyahs.length===COUNTS[id-1]?'completed':'reading';item.lastAyah=v;item.updatedAt=iso();s.lastRead={surahId:id,ayah:v,at:iso()};logRead(s,id,v);});},
      setStatus(id,status){check(id);if(!['unread','reading','completed'].includes(status))throw new Error('Invalid reading status.');mutate(s=>{const item=s.surahs[id]||(s.surahs[id]=blankStatus());item.status=status;item.updatedAt=iso();if(status==='completed'){item.readAyahs=Array.from({length:COUNTS[id-1]},(_,i)=>i+1);item.lastAyah=COUNTS[id-1];for(const v of item.readAyahs)logRead(s,id,v);}if(status==='unread'){item.readAyahs=[];item.lastAyah=1;}});},
      setMemorized(id,v,value){check(id,v);if(typeof value!=='boolean')throw new Error('Invalid memorization status.');mutate(s=>{const item=s.surahs[id]||(s.surahs[id]=blankStatus());const index=item.memorizedAyahs.indexOf(v);if(value&&index<0)item.memorizedAyahs.push(v);if(!value&&index>=0)item.memorizedAyahs.splice(index,1);item.memorizedAyahs.sort((a,b)=>a-b);item.updatedAt=iso();});},
      setMemorizedRange(id,start,end,value=true){check(id,start);check(id,end);if(start>end||typeof value!=='boolean')throw new Error('Invalid memorization range.');mutate(s=>{const item=s.surahs[id]||(s.surahs[id]=blankStatus());const values=new Set(item.memorizedAyahs);for(let v=start;v<=end;v++)value?values.add(v):values.delete(v);item.memorizedAyahs=[...values].sort((a,b)=>a-b);item.updatedAt=iso();});},
      toggleBookmark(id,v){check(id,v);let added=false;mutate(s=>{const key=`${id}:${v}`,index=s.bookmarks.findIndex(b=>b.key===key);if(index>=0)s.bookmarks.splice(index,1);else{s.bookmarks.push({key,surahId:id,ayah:v,collection:'General',note:'',createdAt:iso(),updatedAt:iso()});added=true;}});return added;},
      saveNote(id,v,text,collection='General'){check(id,v);if(typeof text!=='string'||text.length>10000||typeof collection!=='string'||collection.length>80||!collection.trim())throw new Error('Keep notes under 10,000 characters and collection names under 80.');mutate(s=>{const key=`${id}:${v}`;let b=s.bookmarks.find(b=>b.key===key);if(!b){b={key,surahId:id,ayah:v,collection:'General',note:'',createdAt:iso(),updatedAt:iso()};s.bookmarks.push(b);}b.note=text;b.collection=collection.trim();b.updatedAt=iso();});},
      removeBookmark(key){if(!pair(key))throw new Error('Invalid bookmark.');mutate(s=>{s.bookmarks=s.bookmarks.filter(b=>b.key!==key);});},
      updateSettings(patch){if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(key=>!['uiLanguage','dailyTarget','reminderTime','reminderEnabled'].includes(key)))throw new Error('Invalid learning settings.');const next={...state.settings,...patch};validateState({...clone(state),settings:next});mutate(s=>{s.settings={...s.settings,...patch};});},
      scheduleRevision(id,dueDate,intervalDays=7){check(id);if(!isDate(dueDate)||!Number.isInteger(intervalDays)||intervalDays<1||intervalDays>90)throw new Error('Choose a valid revision date and interval.');mutate(s=>{s.revisions[id]={dueDate,intervalDays,lastReviewed:s.revisions[id]?.lastReviewed||null};});},
      markRevised(id){check(id);mutate(s=>{const previous=s.revisions[id];const days=previous?.intervalDays||7;const next=now();next.setDate(next.getDate()+days);s.revisions[id]={dueDate:localDate(next),intervalDays:days,lastReviewed:localDate(now())};});},
      removeRevision(id){check(id);mutate(s=>{delete s.revisions[id];});},
      resetReading(){mutate(s=>{for(const item of Object.values(s.surahs)){item.status='unread';item.readAyahs=[];item.lastAyah=1;item.updatedAt=iso();}s.logs={};s.lastRead=null;});},
      exportBackup(){const preferences={};for(const key of PREFERENCE_KEYS){try{const raw=storage?.getItem(key);if(raw!==null&&raw!==undefined)preferences[key]=validatePreference(key,raw);}catch{}}if(root.CompassApp?.exportPreferences){const current=root.CompassApp.exportPreferences();for(const [key,raw] of Object.entries(current||{}))preferences[key]=validatePreference(key,raw);}return {format:'surah-compass-backup-v2',createdAt:iso(),learning:clone(state),preferences};},
      importBackup(input){const backup=validateBackup(input);const previous=[];if(persistent){try{for(const [key,raw] of Object.entries(backup.preferences)){previous.push([key,storage.getItem(key)]);storage.setItem(key,raw);}storage.setItem(KEY,JSON.stringify(backup.learning));}catch{for(const [key,raw] of previous){try{raw===null?storage.removeItem(key):storage.setItem(key,raw);}catch{}}throw new Error('Your browser could not save the backup. Allow site storage and try again.');}}state=backup.learning;emit();if(root.CompassApp?.applyPreferences)root.CompassApp.applyPreferences(clone(backup.preferences));else if(root.CompassApp?.refreshUserState)root.CompassApp.refreshUserState(clone(backup.preferences));return clone(state);},
      validateBackup,
      subscribe(callback){listeners.add(callback);return()=>listeners.delete(callback);},
      refresh(){const latest=load();if(latest){state=latest;emit();}}
    };
    if(options.listen!==false&&typeof root.addEventListener==='function')root.addEventListener('storage',event=>{if(event.key===KEY)api.refresh();});
    return api;
  }
  root.CompanionStore=createStore();
  root.CompanionStoreUtils={createStore,validateState,validateBackup,localDate,counts:[...COUNTS],storageKey:KEY};
  if(typeof module!=='undefined')module.exports=root.CompanionStoreUtils;
})(typeof globalThis!=='undefined'?globalThis:this);
