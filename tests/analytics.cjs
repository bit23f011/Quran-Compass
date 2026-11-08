'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../analytics.js'),'utf8');
function mount({protocol='https:',hostname='surah-compass.example.com',search='',hash='#discover',online=true,head=true,referrer='',existing=false,va}={}){
  const scripts=[],listeners=new Map(),documentListeners=new Map();
  const appendChild=script=>{scripts.push(script);return script;};
  const document={referrer,head:head?{appendChild}:null,
    getElementById:id=>scripts.find(script=>script.id===id)||null,
    querySelector:()=>existing?{}:null,
    createElement(tag){assert.equal(tag,'script');return {listeners:new Map(),addEventListener(type,callback){this.listeners.set(type,callback);}};},
    addEventListener(type,callback){documentListeners.set(type,callback);}
  };
  const context=vm.createContext({document,location:{protocol,hostname,search,hash},navigator:{onLine:online},URL,URLSearchParams,va,
    addEventListener(type,callback){const callbacks=listeners.get(type)||new Set();callbacks.add(callback);listeners.set(type,callbacks);},
    removeEventListener(type,callback){listeners.get(type)?.delete(callback);}
  });
  const rerun=()=>vm.runInContext(source,context,{filename:'analytics.js'});rerun();
  return {context,document,scripts,listeners,rerun,dispatch:type=>{for(const callback of listeners.get(type)||[])callback();},domReady(){document.head={appendChild};documentListeners.get('DOMContentLoaded')?.();}};
}
test('public online visits load one nonblocking official Vercel script with the generic queue',()=>{
  const app=mount();assert.equal(app.scripts.length,1);
  assert.equal(app.scripts[0].src,'/_vercel/insights/script.js');assert.equal(app.scripts[0].async,true);assert.equal(app.scripts[0].defer,true);
  assert.equal(typeof app.context.va,'function');assert.equal(app.context.vaq,undefined,'The app emits no custom events');
  app.context.va('fixture-command');assert.deepEqual(Array.from(app.context.vaq[0]),['fixture-command']);
  app.dispatch('online');app.rerun();assert.equal(app.scripts.length,1);assert.equal(app.listeners.get('online').size,0);
});
test('file mode, localhost, loopback and private development hosts never initialize analytics',()=>{
  for(const options of [{protocol:'file:',hostname:''},{protocol:'about:'},{hostname:'localhost'},{hostname:'localhost.'},{hostname:'app.localhost'},{hostname:'127.0.0.1'},{hostname:'127.2.3.4'},{hostname:'[::1]'},{hostname:'::ffff:127.0.0.1'},{hostname:'[::ffff:7f00:1]'},{hostname:'0.0.0.0'},{hostname:'192.168.1.2'},{hostname:'10.2.3.4'},{hostname:'172.16.0.1'},{hostname:'quran.local'}]){
    const app=mount(options);assert.equal(app.scripts.length,0,JSON.stringify(options));assert.equal(app.context.va,undefined);assert.equal(app.context.__surahCompassAnalytics.blocked,true);app.dispatch('online');assert.equal(app.scripts.length,0);
  }
});
test('offline startup waits for an online event and initializes only once',()=>{
  const app=mount({online:false});assert.equal(app.scripts.length,0);assert.equal(app.context.va,undefined);
  app.rerun();assert.equal(app.listeners.get('online').size,1);
  app.dispatch('online');assert.equal(app.scripts.length,0);
  app.context.navigator.onLine=true;app.dispatch('online');app.dispatch('online');assert.equal(app.scripts.length,1);
});
test('existing embed scripts and existing vendor queues are preserved',()=>{
  const embedded=mount({existing:true});assert.equal(embedded.scripts.length,0);embedded.dispatch('online');assert.equal(embedded.scripts.length,0);
  const vendor=()=>{};const app=mount({va:vendor});assert.equal(app.context.va,vendor);assert.equal(app.scripts.length,1);
});
test('actual credentials and authentication callbacks wait before analytics initialization',()=>{
  for(const options of [{search:'?access_token=private-token'},{search:'?refresh_token=private-token'},{search:'?token_hash=private-token'},{search:'?code=auth-code'},{search:'?auth_code=private'},{search:'?%61ccess_token=private'},{search:'?ACCESS_TOKEN=private'},{hash:'#access_token=secret&refresh_token=secret'},{hash:'#error_description=private'},{hash:'#token_hash=private-token&type=recovery'},{hash:'#code=auth-code'},{hash:'#reader/2/286?access_token=private'},{search:'?password=private'},{search:'?api_key=private'},{referrer:'https://example.com/?access_token=private'},{referrer:'https://example.com/#access_token=private'},{referrer:'https://user:password@example.com/'}]){
    const app=mount(options);assert.equal(app.scripts.length,0,JSON.stringify(options));assert.equal(app.context.va,undefined);assert.equal(app.context.__surahCompassAnalytics.waitingForSafeUrl,true);
  }
  for(const hash of ['','#discover','#reader','#reader/1/1','#reader/2/286','#reader/114/6','#settings','#journey','#translation'])assert.equal(mount({hash}).scripts.length,1,hash);
});
test('benign campaign queries, search referrers and normal anchors retain standard pageviews',()=>{
  for(const options of [{search:'?utm_source=newsletter&utm_medium=email&utm_campaign=ramadan'},{search:'?q=al-fatiha&page=2'},{search:'?utm_content=access_token%3Dnot-a-key'},{referrer:'https://example.com/?utm_source=newsletter&utm_campaign=quran'},{referrer:'https://www.google.com/search?q=surah+fatiha'},{referrer:'https://example.com/#translation'},{hash:'#reader/2/286'}]){
    const app=mount(options);assert.equal(app.scripts.length,1,JSON.stringify(options));assert.equal(app.context.__surahCompassAnalytics.waitingForSafeUrl,false);assert.equal(app.context.vaq,undefined,'No custom marketing/search events are emitted');
  }
});
test('returning online with a sensitive callback still skips analytics',()=>{
  const app=mount({online:false});app.context.location.hash='#access_token=private';app.context.navigator.onLine=true;app.dispatch('online');assert.equal(app.scripts.length,0);assert.equal(app.context.va,undefined);
});
test('analytics waits for the app to sanitize authentication without modifying its URL',async()=>{
  const app=mount({hash:'#access_token=private&refresh_token=private'});assert.equal(app.scripts.length,0);
  assert.equal(app.context.location.hash,'#access_token=private&refresh_token=private');
  app.dispatch('compass:navigation');app.context.location.hash='#settings';
  await Promise.resolve();await Promise.resolve();
  assert.equal(app.scripts.length,1);assert.equal(app.context.__surahCompassAnalytics.waitingForSafeUrl,false);
  assert.equal(app.listeners.get('compass:navigation').size,0);assert.equal(app.context.vaq,undefined);
  app.dispatch('compass:navigation');await Promise.resolve();assert.equal(app.scripts.length,1);
});
test('a missing head waits for DOM readiness, and a blocked vendor script does not retry or break the app',()=>{
  const delayed=mount({head:false});assert.equal(delayed.scripts.length,0);delayed.domReady();assert.equal(delayed.scripts.length,1);
  const app=mount();app.scripts[0].listeners.get('error')();assert.equal(app.context.__surahCompassAnalytics.failed,true);app.dispatch('online');app.rerun();assert.equal(app.scripts.length,1);
});
