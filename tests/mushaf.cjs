'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../mushaf.js'),'utf8'),catalogue=fs.readFileSync(path.join(__dirname,'../data/surahs.js'),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const KEY='surah-compass-bookmark-v1';
function mount({reduced=true,storage=new Map()}={}){
  const nodes=new Map(),listeners=new Map(),calls=[],timers=new Map();let language='en',sequence=0;
  class Element{
    constructor(id){this.id=id;this.listeners=new Map();this.attributes=new Map();this.style={setProperty(name,value){this[name]=value;}};this.hidden=false;this.disabled=false;this.tagName='DIV';this.value='';this.inner='';this.offsetWidth=100;this.dataset={};this.rect={left:0,top:0,right:800,bottom:500,width:800,height:500};const classes=new Set();this.classList={add:name=>classes.add(name),remove:name=>classes.delete(name),toggle(name,value){const yes=value===undefined?!classes.has(name):!!value;yes?classes.add(name):classes.delete(name);return yes;},contains:name=>classes.has(name)};}
    set innerHTML(value){this.inner=value;for(const match of value.matchAll(/\bid="([^"]+)"/g))if(!nodes.has(match[1]))nodes.set(match[1],new Element(match[1]));}
    get innerHTML(){return this.inner;}
    querySelector(selector){if(selector==='span'){if(!this.span)this.span=new Element(this.id+':span');return this.span;}return null;}
    setAttribute(name,value){this.attributes.set(name,String(value));}
    getAttribute(name){return this.attributes.get(name)||null;}
    addEventListener(name,callback){const list=this.listeners.get(name)||[];list.push(callback);this.listeners.set(name,list);}
    emit(name,event={}){const action={target:this,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...event};for(const callback of this.listeners.get(name)||[])callback(action);return action;}
    closest(){return null;}
    getBoundingClientRect(){return this.rect;}
    setPointerCapture(id){this.captured=id;}
    releasePointerCapture(id){if(this.captured===id)this.captured=null;}
  }
  const view=new Element('mushaf-view');nodes.set(view.id,view);
  const document={readyState:'interactive',getElementById:id=>nodes.get(id)||null,addEventListener(){}};
  const context=vm.createContext({document,console,matchMedia:()=>({matches:reduced}),localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))},setTimeout(callback){const id=++sequence;timers.set(id,callback);return id;},clearTimeout:id=>timers.delete(id),addEventListener(name,callback){const list=listeners.get(name)||[];list.push(callback);listeners.set(name,list);},getSelection:()=>({toString:()=>''})});
  vm.runInContext(catalogue,context);context.CompanionStore={settings:()=>({uiLanguage:language})};context.CompassApp={navigate:(view,options)=>calls.push({view,options})};vm.runInContext(source,context,{filename:'mushaf.js'});
  function el(id){const value=nodes.get(id);assert.ok(value,'Production module should create '+id);return value;}
  el('mushaf-scene').rect={left:20,top:0,right:780,bottom:485,width:760,height:485};el('mushaf-book').rect={left:80,top:20,right:720,bottom:440,width:640,height:420};el('mushaf-left-page').rect={left:85,top:26,right:400,bottom:438,width:315,height:412};el('mushaf-right-page').rect={left:400,top:26,right:715,bottom:438,width:315,height:412};
  return {api:context.CompassMushaf,context,el,view,calls,timers,storage,flush(frames=100){for(let frame=0;frame<frames&&timers.size;frame++)for(const [id,callback]of [...timers]){timers.delete(id);callback();}},setLanguage(value){language=value;for(const fn of listeners.get('compass:state')||[])fn({});},dispatch(type,detail){for(const fn of listeners.get(type)||[])fn({detail});},pointer(type,event){const value={preventDefault(){},stopPropagation(){},...event};for(const fn of listeners.get(type)||[])fn(value);},read(id,side){const target={tagName:'BUTTON',dataset:{readSurah:String(id)},closest(selector){return selector==='[data-read-surah]'?this:null;}};return el('mushaf-'+side+'-page').emit('click',{target});}};
}

test('reader-facing book opens to Bismillah, then right-odd/left-even spreads without opening the reader',()=>{
  const app=mount();assert.equal(app.api.getState().opened,false);assert.doesNotMatch(app.view.innerHTML,/rehal|stand/);app.el('mushaf-open').emit('click');assert.equal(app.api.getState().spread,0);assert.match(app.el('mushaf-right-page').innerHTML,/بِسْمِ اللَّهِ/);app.el('mushaf-left-page').emit('click');assert.equal(app.api.getState().rightSurah,1);assert.equal(app.api.getState().leftSurah,2);app.el('mushaf-left-page').emit('click');assert.equal(app.api.getState().rightSurah,3);assert.equal(app.api.getState().leftSurah,4);app.el('mushaf-right-page').emit('click');assert.equal(app.api.getState().rightSurah,1);assert.equal(app.api.getState().leftSurah,2);assert.equal(app.calls.length,0);
});

test('all 114 Surahs occupy consecutive left/right leaves with authentic complete directory metadata',()=>{
  const app=mount();
  for(const s of app.context.SURAHS){assert.equal(app.api.goToSurah(s.id),true);const side=s.id%2?'right':'left',html=app.el('mushaf-'+side+'-page').innerHTML;assert.ok(html.includes(s.name));assert.ok(html.includes(String(s.total_verses)));assert.ok(html.includes(String(s.revelation_order)));assert.ok(html.includes(s.overview.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))));for(const theme of s.themes)assert.ok(html.includes(theme.replace(/'/g,'&#39;')));assert.equal(app.api.getState().surahId,s.id);assert.equal(app.api.getState().leftSurah,Math.ceil(s.id/2)*2);assert.equal(app.api.getState().rightSurah,Math.ceil(s.id/2)*2-1);assert.ok(!app.el('mushaf-left-page').innerHTML.includes('بِسْمِ اللَّهِ'));assert.ok(!app.el('mushaf-right-page').innerHTML.includes('بِسْمِ اللَّهِ'));}
  assert.equal(app.el('mushaf-next').disabled,true);assert.equal(app.calls.length,0);
});

test('only each leaf’s explicit Open Surah action routes to its own chapter',()=>{
  const app=mount();app.api.goToSurah(27);app.read(27,'right');app.read(28,'left');assert.deepEqual(clone(app.calls),[{view:'reader',options:{surahId:27,ayah:1}},{view:'reader',options:{surahId:28,ayah:1}}]);app.el('mushaf-right-page').emit('keydown',{key:'Enter'});assert.equal(app.api.getState().rightSurah,25);app.el('mushaf-left-page').emit('keydown',{key:' '});assert.equal(app.api.getState().rightSurah,27);app.el('mushaf-left-page').emit('keydown',{key:'Enter',target:{tagName:'BUTTON'}});assert.equal(app.api.getState().rightSurah,27,'Only the focused leaf itself handles leaf keyboard navigation.');assert.equal(app.calls.length,2);
});

test('forward flips travel left to right in English and Urdu; keyboard and swipe direction stay physical',()=>{
  const app=mount({reduced:false});app.api.goToSurah(1);app.el('mushaf-left-page').emit('click');assert.equal(app.el('mushaf-turn-leaf').dataset.direction,'left-to-right');assert.equal(app.api.getState().rightSurah,3);app.flush();app.setLanguage('ur');assert.equal(app.el('mushaf-left-page').getAttribute('dir'),'rtl');app.view.emit('keydown',{key:'ArrowRight'});assert.equal(app.api.getState().rightSurah,5);assert.equal(app.el('mushaf-turn-leaf').dataset.direction,'left-to-right');app.flush();app.el('mushaf-stage').emit('touchstart',{touches:[{clientX:100}]});app.el('mushaf-stage').emit('touchend',{changedTouches:[{clientX:210}]});assert.equal(app.api.getState().rightSurah,7);app.flush();app.el('mushaf-right-page').emit('click');assert.equal(app.el('mushaf-turn-leaf').dataset.direction,'right-to-left');assert.equal(app.api.getState().rightSurah,5);app.flush();app.el('mushaf-right-page').emit('keydown',{key:' '});assert.equal(app.el('mushaf-turn-leaf').dataset.direction,'right-to-left');assert.equal(app.api.getState().rightSurah,3);app.flush();app.el('mushaf-left-page').emit('keydown',{key:'Enter'});assert.equal(app.el('mushaf-turn-leaf').dataset.direction,'left-to-right');assert.equal(app.api.getState().rightSurah,5);
});

test('bounded jumps and cancellation preserve the containing spread instead of stale flipped pages',()=>{
  const app=mount({reduced:false});for(const invalid of [0,-1,115,'missing',NaN,1.5,null])assert.equal(app.api.goToSurah(invalid),false);app.api.goToSurah(112);app.el('mushaf-next').emit('click');assert.equal(app.api.getState().leftSurah,114);const stale=[...app.timers.values()][0];app.api.close();stale();assert.equal(app.api.getState().opened,false);assert.equal(app.api.getState().spread,0);app.api.goToSurah(4);app.el('mushaf-next').emit('click');app.api.goToSurah(100);app.flush();assert.equal(app.api.getState().rightSurah,99);assert.equal(app.api.getState().leftSurah,100);assert.equal(app.api.getState().busy,false);app.el('mushaf-next').emit('click');app.dispatch('compass:navigation',{view:'reader'});assert.equal(app.api.getState().busy,false);assert.equal(app.el('mushaf-turn-leaf').innerHTML,'');
});

test('cursor motion subtly tilts the book, resets on leave and respects reduced motion',()=>{
  const app=mount({reduced:false});app.el('mushaf-stage').emit('pointermove',{clientX:750,clientY:100,pointerType:'mouse'});assert.notEqual(app.el('mushaf-scene').style['--tilt-x'],'0deg');assert.notEqual(app.el('mushaf-scene').style['--tilt-y'],'0deg');assert.ok(Math.abs(parseFloat(app.el('mushaf-scene').style['--tilt-y']))<=3);app.el('mushaf-stage').emit('pointerleave');assert.equal(app.el('mushaf-scene').style['--tilt-x'],'0deg');assert.equal(app.el('mushaf-scene').style['--tilt-y'],'0deg');const quiet=mount();quiet.el('mushaf-stage').emit('pointermove',{clientX:750,clientY:100,pointerType:'mouse'});assert.equal(quiet.el('mushaf-scene').style['--tilt-x'],undefined);
});

test('dragging the ribbon onto either leaf saves that exact Surah and relative location across reload',()=>{
  const app=mount();app.api.goToSurah(10);const ribbon=app.el('mushaf-ribbon');ribbon.emit('pointerdown',{pointerId:1,button:0,clientX:120,clientY:60});assert.equal(ribbon.captured,1);app.pointer('pointermove',{pointerId:1,clientX:242.5,clientY:190.8});assert.notEqual(ribbon.style.left,'284.8px','Global movement fallback moves the real ribbon.');app.el('mushaf-left-page').emit('click');assert.equal(app.api.getState().leftSurah,10,'Held ribbon never turns pages.');app.pointer('pointerup',{pointerId:1,clientX:242.5,clientY:190.8});assert.deepEqual(clone(app.api.getState().bookmark),{surahId:10,x:.5,y:.4});assert.equal(ribbon.captured,null);assert.equal(app.calls.length,0);const reloaded=mount({storage:app.storage});assert.deepEqual(clone(reloaded.api.getState().bookmark),{surahId:10,x:.5,y:.4});reloaded.api.jumpToBookmark();assert.equal(reloaded.api.getState().leftSurah,10);assert.equal(reloaded.el('mushaf-ribbon').classList.contains('is-parked'),false);app.flush();app.el('mushaf-save-right').emit('click');assert.equal(app.api.getState().bookmark.surahId,9);
});

test('off-page parking and pointer cancellation cannot accidentally save another page or navigate',()=>{
  const app=mount();app.api.goToSurah(3);app.api.setBookmark(3,.2,.1);const ribbon=app.el('mushaf-ribbon');ribbon.emit('pointerdown',{pointerId:2,button:0,clientX:110,clientY:60});ribbon.emit('pointerup',{pointerId:2,clientX:790,clientY:5});assert.equal(app.api.getState().bookmark,null);assert.equal(app.api.getState().ribbonParked,true);assert.equal(ribbon.classList.contains('is-parked'),true);app.flush();app.api.setBookmark(4,.3,.2);ribbon.emit('pointerdown',{pointerId:3,button:0,clientX:500,clientY:90});ribbon.emit('pointermove',{pointerId:3,clientX:150,clientY:250});ribbon.emit('pointercancel',{pointerId:3});assert.deepEqual(clone(app.api.getState().bookmark),{surahId:4,x:.3,y:.2});assert.equal(ribbon.captured,null);assert.equal(app.api.getState().rightSurah,3);assert.equal(app.calls.length,0);
});

test('lost pointer capture restores the previous bookmark and Escape works from an Open Surah button',()=>{
  const app=mount();app.api.goToSurah(8);app.api.setBookmark(8,.3,.2);const ribbon=app.el('mushaf-ribbon');ribbon.emit('pointerdown',{pointerId:7,button:0,clientX:490,clientY:70});ribbon.emit('pointermove',{pointerId:7,clientX:150,clientY:240});ribbon.emit('lostpointercapture',{pointerId:7});assert.deepEqual(clone(app.api.getState().bookmark),{surahId:8,x:.3,y:.2});assert.equal(ribbon.classList.contains('is-dragging'),false);app.view.emit('keydown',{key:'Escape',target:{tagName:'BUTTON'}});assert.equal(app.api.getState().opened,false);
});

test('bookmark backup bridges hydrate memory directly and reject invalid input without replacing it',()=>{
  const app=mount();app.api.setBookmark(114,.7,.2);const preferences=app.api.getPreferences();const destination=mount();assert.equal(destination.api.applyPreferences(preferences),true);assert.equal(destination.storage.size,0,'Preference apply must not depend on or overwrite stale localStorage.');assert.deepEqual(clone(destination.api.getState().bookmark),{surahId:114,x:.7,y:.2});for(const record of [{version:1,surahId:115,x:.5,y:.2},{version:1,surahId:1,x:-1,y:.2},{version:1,surahId:1,x:.5,y:3},{version:2,parked:true}])assert.equal(destination.api.applyPreferences({[KEY]:JSON.stringify(record)}),false);assert.equal(destination.api.getState().bookmark.surahId,114);destination.el('mushaf-bookmark-park').emit('click');assert.deepEqual(JSON.parse(destination.api.getPreferences()[KEY]),{version:1,parked:true});
});

test('clear native cover tooling and full page layouts contain no stand, gradients, internal scrolling or em dashes',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../mushaf.css'),'utf8');assert.equal(/gradient\s*\(/.test(css),false);assert.doesNotMatch(css,/overflow\s*:\s*(auto|scroll)/);assert.doesNotMatch(source+css,/\u2014/);assert.match(css,/transform-origin:right center/);assert.match(css,/--book-min-height:820px/);assert.ok(fs.statSync(path.join(__dirname,'../assets/book-page-edges.svg')).size>0);const app=mount();assert.match(app.view.innerHTML,/mushaf-cover-art/);assert.match(app.view.innerHTML,/الْقُرْآنُ/);assert.doesNotMatch(app.view.innerHTML,/book-cover-photo|rehal/);app.api.goToSurah(1);assert.equal(app.el('mushaf-left-page').innerHTML.includes('data-ayah='),false);assert.match(app.el('mushaf-catalogue-note').textContent,/introductions are study aids/);
});

test('sixteen articulated strips curve during a turn and keep the old opposite page until the sheet lands',()=>{
  const app=mount({reduced:false});app.api.goToSurah(1);const oldRight=app.el('mushaf-right-page').innerHTML;app.el('mushaf-next').emit('click');const curl=app.el('mushaf-turn-leaf').innerHTML;assert.match(app.view.innerHTML,/id="mushaf-turn-leaf" aria-hidden="true" inert/);assert.equal((curl.match(/class="mushaf-curl-strip"/g)||[]).length,16);assert.equal((curl.match(/<button tabindex="-1"/g)||[]).length,32,'Visual copies cannot enter the keyboard tab order.');assert.equal(app.el('mushaf-right-page').innerHTML,oldRight);app.flush(20);assert.equal(Number(app.el('mushaf-turn-leaf').dataset.progress),.5);const angles=Array.from({length:16},(_,i)=>Number(app.el('mushaf-curl-strip-'+i).dataset.angle));assert.ok(Math.max(...angles)-Math.min(...angles)>.5,'A bowed sheet has different tangents across its width.');assert.ok(app.el('mushaf-curl-strip-8').style.transform.includes('translate3d'));assert.equal(app.api.getState().busy,true);app.flush();assert.equal(app.api.getState().busy,false);assert.match(app.el('mushaf-right-page').innerHTML,/data-read-surah="3"/);assert.equal(app.el('mushaf-turn-leaf').innerHTML,'');
});

test('center ribbon appears only on opening, docks above later spreads and returns only to its saved spread',()=>{
  const app=mount();app.el('mushaf-open').emit('click');const ribbon=app.el('mushaf-ribbon');assert.equal(ribbon.style.left,'400px');assert.equal(parseFloat(ribbon.style.height),420*.7);assert.equal(ribbon.classList.contains('is-parked'),false);app.el('mushaf-next').emit('click');assert.equal(app.api.getState().ribbonParked,true);assert.equal(ribbon.classList.contains('is-parked'),true);assert.equal(ribbon.style['--ribbon-angle'],'-84deg');assert.ok(parseFloat(ribbon.style.top)<20);app.api.setBookmark(2,.5,.03);assert.equal(ribbon.classList.contains('is-parked'),false);app.api.goToSurah(7);assert.equal(ribbon.classList.contains('is-parked'),true);assert.equal(app.api.getState().bookmark.surahId,2);app.api.jumpToBookmark();assert.equal(ribbon.classList.contains('is-parked'),false);assert.equal(app.el('mushaf-left-page').classList.contains('has-bookmark'),true);app.api.close();assert.equal(ribbon.hidden,true);
});

test('page sizing grows for complete metadata instead of forcing a nested details scroll area',()=>{
  const app=mount();app.api.goToSurah(11);app.el('mushaf-left-page').scrollHeight=790;app.el('mushaf-right-page').scrollHeight=760;app.api.refresh();assert.equal(app.el('mushaf-stage').style['--book-height'],'808px');assert.match(app.el('mushaf-left-page').innerHTML,/mushaf-themes/);assert.match(app.el('mushaf-right-page').innerHTML,/mushaf-overview/);app.el('mushaf-left-page').scrollHeight=400;app.el('mushaf-right-page').scrollHeight=400;app.api.refresh();assert.equal(app.el('mushaf-stage').style['--book-height'],'560px');
});

test('plain ribbon clicks and small pointer jitter preserve the opening ribbon and existing saved location',()=>{
  const app=mount();app.el('mushaf-open').emit('click');const ribbon=app.el('mushaf-ribbon');ribbon.emit('pointerdown',{pointerId:8,button:0,clientX:400,clientY:30});ribbon.emit('pointermove',{pointerId:8,clientX:402,clientY:31});ribbon.emit('pointerup',{pointerId:8,clientX:402,clientY:31});assert.equal(app.api.getState().ribbonParked,false);assert.equal(app.api.getState().bookmark,null);assert.equal(app.storage.size,0);app.api.goToSurah(3);app.api.setBookmark(3,.7,.2);ribbon.emit('pointerdown',{pointerId:9,button:0,clientX:580,clientY:130});ribbon.emit('pointerup',{pointerId:9,clientX:580,clientY:130});assert.deepEqual(clone(app.api.getState().bookmark),{surahId:3,x:.7,y:.2});assert.equal(app.calls.length,0);
});

test('flat ribbon follows moving book bounds and repositions when book or scene transforms settle',()=>{
  const app=mount({reduced:false});app.el('mushaf-open').emit('click');const ribbon=app.el('mushaf-ribbon'),book=app.el('mushaf-book');assert.equal(app.el('mushaf-stage').classList.contains('is-ribbon-tracking'),true);book.rect={left:120,top:40,right:760,bottom:460,width:640,height:420};app.flush();assert.equal(ribbon.style.left,'440px');assert.equal(ribbon.style.top,'44px');assert.equal(app.el('mushaf-stage').classList.contains('is-ribbon-tracking'),false);book.rect.left=140;app.el('mushaf-scene').emit('transitionend',{propertyName:'transform'});app.flush();assert.equal(ribbon.style.left,'460px');book.rect.left=160;book.emit('transitionend',{propertyName:'transform'});app.flush();assert.equal(ribbon.style.left,'480px');assert.equal(app.timers.size,0);
});

test('left clicks advance every spread and right clicks return to opening within first/final bounds in EN and UR',()=>{
  for(const language of ['en','ur']){
    const app=mount();app.setLanguage(language);app.el('mushaf-open').emit('click');
    const left=app.el('mushaf-left-page'),right=app.el('mushaf-right-page');
    assert.match(left.innerHTML,language==='en'?/left page for next pages and the right page for previous pages/:/اگلے صفحات کے لیے بائیں صفحے اور پچھلے صفحات کے لیے دائیں صفحے/);
    assert.match(app.el('mushaf-description').textContent,language==='en'?/Left page: next.*Right page: previous/:/بایاں صفحہ: اگلا.*دایاں صفحہ: پچھلا/);
    assert.match(right.getAttribute('aria-label'),language==='en'?/previous pages.*first spread/:/پچھلے صفحات.*پہلے صفحات/);
    right.emit('click');right.emit('keydown',{key:'Enter'});right.emit('keydown',{key:' '});assert.equal(app.api.getState().spread,0);
    const begin={tagName:'BUTTON',dataset:{begin:''},closest(selector){return selector==='[data-begin]'?this:null;}};
    left.emit('click',{target:begin});assert.equal(app.api.getState().spread,1);assert.equal(app.calls.length,0,'Begin advances to the first spread rather than opening reader.');
    for(let spread=2;spread<=57;spread++){left.emit('click');assert.equal(app.api.getState().spread,spread);assert.equal(app.api.getState().rightSurah,spread*2-1);assert.equal(app.api.getState().leftSurah,spread*2);}
    assert.match(left.getAttribute('aria-label'),language==='en'?/next pages.*final spread/:/اگلے صفحات.*آخری صفحات/);
    left.emit('click');left.emit('keydown',{key:'Enter'});left.emit('keydown',{key:' '});assert.equal(app.api.getState().spread,57);assert.equal(app.el('mushaf-next').disabled,true);
    for(let spread=56;spread>=0;spread--){right.emit('click');assert.equal(app.api.getState().spread,spread);if(spread){assert.equal(app.api.getState().rightSurah,spread*2-1);assert.equal(app.api.getState().leftSurah,spread*2);}}
    right.emit('click');assert.equal(app.api.getState().spread,0);assert.equal(app.el('mushaf-previous').disabled,true);assert.equal(app.calls.length,0);
  }
});

test('side clicks and matching leaf keys ignore busy flips, held ribbons and the suppressed post-drag click',()=>{
  const app=mount({reduced:false});app.api.goToSurah(1);const left=app.el('mushaf-left-page'),right=app.el('mushaf-right-page'),ribbon=app.el('mushaf-ribbon');
  left.emit('click');assert.equal(app.api.getState().spread,2);assert.equal(app.api.getState().busy,true);right.emit('click');right.emit('keydown',{key:'Enter'});left.emit('keydown',{key:' '});app.read(3,'right');assert.equal(app.api.getState().spread,2);assert.equal(app.calls.length,0);app.flush();
  ribbon.emit('pointerdown',{pointerId:12,button:0,clientX:285,clientY:5});left.emit('click');right.emit('click');left.emit('keydown',{key:'Enter'});right.emit('keydown',{key:' '});assert.equal(app.api.getState().spread,2);ribbon.emit('pointercancel',{pointerId:12});
  right.emit('keydown',{key:'Enter'});assert.equal(app.api.getState().spread,1);assert.equal(app.el('mushaf-turn-leaf').dataset.direction,'right-to-left');app.flush();
  ribbon.emit('pointerdown',{pointerId:13,button:0,clientX:285,clientY:5});ribbon.emit('pointermove',{pointerId:13,clientX:550,clientY:70});ribbon.emit('pointerup',{pointerId:13,clientX:550,clientY:70});left.emit('click');left.emit('keydown',{key:' '});right.emit('click');assert.equal(app.api.getState().spread,1);app.flush();left.emit('keydown',{key:' '});assert.equal(app.api.getState().spread,2);assert.equal(app.el('mushaf-turn-leaf').dataset.direction,'left-to-right');assert.equal(app.calls.length,0);
});
