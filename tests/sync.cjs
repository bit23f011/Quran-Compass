'use strict';
// Runs the production sync module with a local DOM, real backup validation,
// and mocked fetch. No account, email, or network request is created.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createStore}=require('../store.js');
const source=fs.readFileSync(path.join(__dirname,'../sync.js'),'utf8');
const SESSION_KEY='surah-compass-cloud-session';
const USER_ID='00000000-0000-4000-8000-000000000001';
const ACCESS='dummy-access-token-for-tests';
const REFRESH='dummy-refresh-token-for-tests';
const CONFIG={supabaseUrl:'https://unit-test.supabase.co',supabaseAnonKey:'dummy-public-anon-key-for-tests-only'};
class MemoryStorage{
  constructor(){this.data=new Map();this.writes=[];this.removals=[];}
  getItem(key){return this.data.has(key)?this.data.get(key):null;}
  setItem(key,value){this.writes.push([key,String(value)]);this.data.set(key,String(value));}
  removeItem(key){this.removals.push(key);this.data.delete(key);}
}
class Element{
  constructor(){this.listeners=new Map();this.dataset={};this.value='';}
  addEventListener(type,callback){const callbacks=this.listeners.get(type)||[];callbacks.push(callback);this.listeners.set(type,callbacks);}
  emit(type,event={}){for(const callback of this.listeners.get(type)||[])callback({target:this,preventDefault(){},...event});}
}
class Panel extends Element{
  set innerHTML(html){
    this.html=String(html);this.buttons=new Map();
    for(const match of this.html.matchAll(/data-cloud="([^"]+)"/g)){const button=new Element();button.dataset.cloud=match[1];this.buttons.set(match[1],button);}
    this.form=this.html.includes('id="cloud-email-form"')?new Element():null;
    this.email=this.form?new Element():null;
  }
  get innerHTML(){return this.html||'';}
  querySelector(selector){if(selector==='form')return this.form;if(selector==='#cloud-email')return this.email;throw new Error(`Unexpected sync selector ${selector}`);}
  querySelectorAll(selector){assert.equal(selector,'[data-cloud]');return [...this.buttons.values()];}
}
const result=(value,status=200)=>({ok:status>=200&&status<300,status,async text(){return value===undefined?'':JSON.stringify(value);},async json(){return value;}});
function session(){return {access_token:ACCESS,refresh_token:REFRESH,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:USER_ID,email:'reader@example.invalid'}};}
async function settle(){for(let i=0;i<35;i++)await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));}
function mount({config={},hash='',initialSession,fetcher=async()=>{throw new Error('Unexpected fetch');},storage=new MemoryStorage()}={}){
  if(initialSession)storage.setItem(SESSION_KEY,JSON.stringify(initialSession));
  const store=createStore({storage,listen:false,now:()=>new Date('2026-11-07T10:00:00Z')});
  const panel=new Panel(),trace=[],requests=[],navigation=[];
  const location={origin:'https://compass.example.test',pathname:'/study/',search:'?reading=1',hash};
  const context=vm.createContext({
    COMPASS_CONFIG:config,CompanionStore:store,localStorage:storage,
    CompassApp:{navigate(view){navigation.push(view);}},
    document:{readyState:'complete',getElementById(id){assert.equal(id,'cloud-sync-panel');return panel;}},
    location,history:{replaceState(_state,_title,url){trace.push({kind:'history',url});const parsed=new URL(url,location.origin);location.pathname=parsed.pathname;location.search=parsed.search;location.hash=parsed.hash;}},
    fetch:async(url,options)=>{const request={url,options,hashAtFetch:location.hash};trace.push({kind:'fetch',url});requests.push(request);return fetcher(request,requests.length);},
    URL,URLSearchParams,AbortSignal,console,
  });
  vm.runInContext(source,context,{filename:'sync.js'});
  return {context,panel,store,storage,trace,requests,navigation,location,
    async click(action){const button=panel.buttons.get(action);assert.ok(button,`Missing cloud action ${action}`);button.emit('click');await settle();},
    async signIn(email){assert.ok(panel.form);panel.email.value=email;panel.form.emit('submit');await settle();}
  };
}

test('default config makes no request and offers local backup transfer',async()=>{
  const app=mount();await settle();
  assert.equal(app.context.CompassSync.enabled(),false);
  assert.equal(app.requests.length,0);
  assert.match(app.panel.innerHTML,/Export a backup above, then import it on your other device/);
  assert.equal(app.panel.form,null);
  assert.equal(app.panel.buttons.size,0);
});

test('cloud configuration rejects non-Supabase and non-HTTPS destinations without fetching',async()=>{
  for(const url of ['http://unit-test.supabase.co','https://another.example.test','https://user:secret@unit-test.supabase.co']){
    const app=mount({config:{...CONFIG,supabaseUrl:url}});await settle();
    assert.equal(app.context.CompassSync.enabled(),false);
    assert.equal(app.requests.length,0);
  }
});

test('email sign-in uses the configured OTP endpoint with an explicit app redirect',async()=>{
  const app=mount({config:CONFIG,fetcher:async()=>result(undefined)});await settle();
  await app.signIn('reader@example.invalid');
  assert.equal(app.requests.length,1);
  const request=app.requests[0],url=new URL(request.url);
  assert.equal(url.origin,CONFIG.supabaseUrl);
  assert.equal(url.pathname,'/auth/v1/otp');
  assert.equal(url.searchParams.get('redirect_to'),'https://compass.example.test/study/');
  assert.equal(request.options.method,'POST');
  assert.equal(request.options.headers.apikey,CONFIG.supabaseAnonKey);
  assert.equal(request.options.headers.Authorization,undefined);
  assert.deepEqual(JSON.parse(request.options.body),{email:'reader@example.invalid',create_user:true});
  assert.match(app.panel.innerHTML,/Check your email/);
  assert.equal(app.storage.getItem(SESSION_KEY),null);
});

test('incoming tokens leave the visible URL before verification and persist only after a valid user response',async()=>{
  let resolveUser;
  const response=new Promise(resolve=>{resolveUser=resolve;});
  const app=mount({config:CONFIG,hash:`#access_token=${ACCESS}&refresh_token=${REFRESH}&expires_in=3600`,fetcher:()=>response});
  assert.equal(app.location.hash,'#settings');
  assert.deepEqual(app.trace.map(item=>item.kind),['history','fetch']);
  assert.equal(app.requests[0].hashAtFetch,'#settings');
  assert.equal(app.requests[0].options.headers.Authorization,'Bearer '+ACCESS);
  assert.equal(app.storage.getItem(SESSION_KEY),null,'Unverified incoming tokens cannot be persisted');
  resolveUser(result({id:USER_ID,email:'reader@example.invalid'}));await settle();
  const saved=JSON.parse(app.storage.getItem(SESSION_KEY));
  assert.equal(saved.access_token,ACCESS);assert.equal(saved.refresh_token,REFRESH);assert.equal(saved.user.id,USER_ID);
  assert.deepEqual(app.navigation,['settings']);
  assert.match(app.panel.innerHTML,/Signed in as/);
});

test('invalid or missing authenticated user responses cannot persist incoming tokens',async()=>{
  for(const response of [result({},200),result(null,200),result({id:USER_ID},401)]){
    const app=mount({config:CONFIG,hash:`#access_token=${ACCESS}&refresh_token=${REFRESH}`,fetcher:async()=>response});await settle();
    assert.equal(app.location.hash,'#settings');
    assert.equal(app.storage.getItem(SESSION_KEY),null);
    assert.ok(!app.panel.buttons.has('upload'));
    assert.match(app.panel.innerHTML,/could not be verified/);
  }
});

test('incomplete and disabled-cloud token fragments are removed without verification or persistence',async()=>{
  for(const input of [
    {config:CONFIG,hash:`#access_token=${ACCESS}`},
    {config:CONFIG,hash:`#refresh_token=${REFRESH}`},
    {config:{},hash:`#access_token=${ACCESS}&refresh_token=${REFRESH}`}
  ]){
    const app=mount(input);await settle();
    assert.equal(app.location.hash,'#settings');
    assert.equal(app.requests.length,0);
    assert.equal(app.storage.getItem(SESSION_KEY),null);
    assert.deepEqual(app.trace.map(item=>item.kind),['history']);
    assert.deepEqual(app.navigation,['settings']);
  }
});

test('upload sends a validated backup for the authenticated user and excludes session tokens from its payload',async()=>{
  const app=mount({config:CONFIG,initialSession:session(),fetcher:async()=>result(undefined,204)});await settle();
  app.store.markRead(112,1);app.store.saveNote(112,1,'A local test reflection','Shukr');
  await app.click('upload');
  assert.equal(app.requests.length,1);
  const request=app.requests[0],url=new URL(request.url),body=JSON.parse(request.options.body);
  assert.equal(url.pathname,'/rest/v1/compass_backups');assert.equal(url.searchParams.get('on_conflict'),'user_id');
  assert.equal(request.options.headers.Authorization,'Bearer '+ACCESS);
  assert.equal(request.options.headers.apikey,CONFIG.supabaseAnonKey);
  assert.equal(request.options.headers.Prefer,'resolution=merge-duplicates,return=minimal');
  assert.equal(body.user_id,USER_ID);
  assert.equal(body.payload.format,'surah-compass-backup-v2');
  assert.equal(body.payload.learning.bookmarks[0].note,'A local test reflection');
  assert.deepEqual(app.store.validateBackup(body.payload),body.payload);
  assert.ok(!JSON.stringify(body.payload).includes(ACCESS));assert.ok(!JSON.stringify(body.payload).includes(REFRESH));
  const sql=fs.readFileSync(path.join(__dirname,'../cloud-setup.sql'),'utf8');
  assert.match(sql,/enable row level security/i);assert.match(sql,/revoke all .* from anon/i);
  assert.ok((sql.match(/auth\.uid\(\)\)\s*=\s*user_id/g)||[]).length>=5,'Provided policies must enforce user ownership for read/write/delete');
});

test('invalid cloud backups are rejected before any restore or local progress change',async()=>{
  const storage=new MemoryStorage(),local=createStore({storage,listen:false});local.markRead(1,1);
  const malformed=local.exportBackup();malformed.learning.surahs[1].readAyahs=[1,1];
  const app=mount({config:CONFIG,storage,initialSession:session(),fetcher:async()=>result([{payload:malformed}])});await settle();
  const before=app.store.snapshot();await app.click('load');
  assert.ok(!app.panel.buttons.has('restore'));
  assert.deepEqual(app.store.snapshot(),before);
  assert.match(app.panel.innerHTML,/Invalid ayah progress/);
  const url=new URL(app.requests[0].url);
  assert.equal(url.searchParams.get('user_id'),'eq.'+USER_ID);
  assert.equal(app.requests[0].options.headers.Authorization,'Bearer '+ACCESS);
});

test('a valid cloud backup is reviewed before its explicit restore replaces local progress',async()=>{
  const remote=createStore({storage:new MemoryStorage(),listen:false});remote.markRead(112,2);remote.saveNote(112,2,'A remotely backed up test note');
  const backup=remote.exportBackup();
  const app=mount({config:CONFIG,initialSession:session(),fetcher:async()=>result([{payload:backup,updated_at:backup.createdAt}])});await settle();
  app.store.markRead(1,1);await app.click('load');
  assert.deepEqual(app.store.status(1).readAyahs,[1]);
  assert.deepEqual(app.store.status(112).readAyahs,[]);
  assert.ok(app.panel.buttons.has('restore'));
  assert.match(app.panel.innerHTML,/Restoring replaces progress on this device/);
  await app.click('restore');
  assert.deepEqual(app.store.status(1).readAyahs,[]);
  assert.deepEqual(app.store.status(112).readAyahs,[2]);
  assert.equal(app.store.bookmarks()[0].note,'A remotely backed up test note');
  assert.ok(!app.panel.buttons.has('restore'));
});

test('logout clears local session and keeps reading progress when the network fails',async()=>{
  const app=mount({config:CONFIG,initialSession:session(),fetcher:async()=>{throw new Error('Mock offline failure');}});await settle();
  app.store.markRead(1,1);await app.click('logout');
  assert.equal(app.storage.getItem(SESSION_KEY),null);
  assert.ok(app.storage.removals.includes(SESSION_KEY));
  assert.deepEqual(app.store.status(1).readAyahs,[1]);
  assert.match(app.panel.innerHTML,/Signed out/);assert.ok(app.panel.form);
});

test('an expired session refreshes tokens before authenticating the actual backup request',async()=>{
  const expired={...session(),expires_at:Math.floor(Date.now()/1000)-10};
  const nextAccess='dummy-refreshed-access-token',nextRefresh='dummy-refreshed-refresh-token';
  const app=mount({config:CONFIG,initialSession:expired,fetcher:async(request,index)=>index===1?result({access_token:nextAccess,refresh_token:nextRefresh,expires_in:3600,user:{id:USER_ID,email:'reader@example.invalid'}}):result(undefined,204)});await settle();
  await app.click('upload');
  assert.equal(app.requests.length,2);
  assert.equal(new URL(app.requests[0].url).pathname,'/auth/v1/token');
  assert.equal(new URL(app.requests[0].url).searchParams.get('grant_type'),'refresh_token');
  assert.deepEqual(JSON.parse(app.requests[0].options.body),{refresh_token:REFRESH});
  assert.equal(app.requests[1].options.headers.Authorization,'Bearer '+nextAccess);
  assert.equal(JSON.parse(app.requests[1].options.body).user_id,USER_ID);
  assert.equal(JSON.parse(app.storage.getItem(SESSION_KEY)).access_token,nextAccess);
});

test('failed or invalid refresh responses clear the expired session without uploading a backup',async()=>{
  for(const response of [result({error:'mock invalid refresh'},400),result({access_token:'dummy-new',refresh_token:'dummy-new'})]){
    const app=mount({config:CONFIG,initialSession:{...session(),expires_at:Math.floor(Date.now()/1000)-10},fetcher:async()=>response});await settle();
    await app.click('upload');
    assert.equal(app.requests.length,1);
    assert.equal(new URL(app.requests[0].url).pathname,'/auth/v1/token');
    assert.equal(app.storage.getItem(SESSION_KEY),null);
    assert.ok(app.panel.form);
    assert.ok(!app.panel.buttons.has('upload'));
    assert.match(app.panel.innerHTML,/Sign in again/);
  }
});
