'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../spin-audio.js'),'utf8');
function mount({audio=true,speech=true,resumePending=false}={}){
  const timers=new Map(),listeners=new Map(),oscillators=[],speechCalls=[];let now=0,timerId=0,created=0,resumeResolve;
  const document={hidden:false,addEventListener(type,fn){listeners.set(type,fn);}};
  class AudioContext{
    constructor(){created++;this.state='suspended';this.currentTime=0;this.destination={};}
    resume(){this.state='running';return resumePending?new Promise(resolve=>{resumeResolve=resolve;}):Promise.resolve();}
    createOscillator(){const oscillator={frequency:{setValueAtTime(){}},connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stops=(this.stops||0)+1;}};oscillators.push(oscillator);return oscillator;}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  }
  class Utterance{constructor(text){speechCalls.push(['utterance',text]);}}
  const context=vm.createContext({document,Date:{now:()=>now},Promise,
    AudioContext:audio?AudioContext:undefined,
    get SpeechSynthesisUtterance(){speechCalls.push('utterance access');return speech?Utterance:undefined;},
    get speechSynthesis(){speechCalls.push('synthesis access');return speech?{getVoices(){speechCalls.push('getVoices');return [];},cancel(){speechCalls.push('cancel');},speak(){speechCalls.push('speak');}}:undefined;},
    setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},addEventListener(type,fn){listeners.set(type,fn);}
  });
  vm.runInContext(source,context);const api=context.CompassSpinAudio;
  return {api,document,listeners,timers,oscillators,speechCalls,created:()=>created,resolveResume:()=>resumeResolve?.(),async settle(){for(let i=0;i<5;i++)await Promise.resolve();},tick(milliseconds){now+=milliseconds;const entry=timers.entries().next().value;if(entry){timers.delete(entry[0]);entry[1].fn();}}};
}
const surah={id:112,transliteration:'Al-Ikhlas',name:'الإخلاص'};
test('feedback stays silent on startup and unavailable device APIs do not prevent a spin',async()=>{
  const app=mount({audio:false,speech:false});assert.equal(app.created(),0);assert.equal(app.timers.size,0);assert.equal(app.api.announce,undefined);
  const token=app.api.start({duration:6800});await app.settle();assert.equal(app.api.finish(surah,'en',token),true);assert.equal(app.api.getState().running,false);assert.equal(app.timers.size,0);assert.deepEqual(app.speechCalls,[]);
});
test('clock ticks slow down through the spin and mute removes scheduled and already sounding feedback',async()=>{
  const app=mount();const token=app.api.start({duration:6800});await app.settle();assert.equal(app.created(),1);assert.equal(app.oscillators.length,1);assert.equal(app.timers.size,1);
  const initial=[...app.timers.values()][0].delay;app.tick(4500);assert.ok([...app.timers.values()][0].delay>initial);
  app.api.configure({sound:false});assert.equal(app.timers.size,0);assert.ok(app.oscillators.every(node=>node.stops>=2&&node.disconnected));
  const count=app.oscillators.length;assert.equal(app.api.finish(surah,'en',token),true);assert.equal(app.oscillators.length,count);assert.deepEqual(app.speechCalls,[]);
});

test('enabling sound during a muted spin starts its current clock and completion chime',async()=>{
  const app=mount();app.api.configure({sound:false});const token=app.api.start();await app.settle();
  assert.equal(app.created(),0);assert.equal(app.timers.size,0);
  app.api.configure({sound:true});await app.settle();assert.equal(app.created(),1);assert.equal(app.timers.size,1);assert.equal(app.oscillators.length,1);
  app.api.configure({sound:false});assert.equal(app.timers.size,0);app.api.configure({sound:true});await app.settle();assert.equal(app.created(),1);assert.equal(app.timers.size,1);
  const ticks=app.oscillators.length;assert.equal(app.api.finish(surah,'en',token),true);assert.equal(app.timers.size,0);assert.equal(app.oscillators.length,ticks+2);
});
test('spins never access speech APIs, even when legacy voice preferences request speech',async()=>{
  const app=mount();assert.deepEqual(app.speechCalls,[]);assert.equal(app.api.announce,undefined);
  app.api.configure({voice:true});const token=app.api.start();await app.settle();
  const ticks=app.oscillators.length;assert.equal(app.api.finish(surah,'ur',token),true);
  assert.equal(app.oscillators.length,ticks+2);app.api.stop();app.api.configure({voice:false});
  assert.deepEqual(app.speechCalls,[]);assert.equal(app.api.getState().voice,undefined);
});
test('old resume callbacks cannot restart stopped ticks',async()=>{
  const app=mount({resumePending:true});const token=app.api.start();app.api.stop();app.resolveResume();await app.settle();
  assert.equal(app.oscillators.length,0);assert.equal(app.timers.size,0);assert.equal(app.api.finish(surah,'en',token),false);assert.deepEqual(app.speechCalls,[]);
});
test('hidden pages and page exit cancel feedback and invalidate a late completion',async()=>{
  const app=mount();const token=app.api.start();await app.settle();app.document.hidden=true;app.listeners.get('visibilitychange')();
  assert.equal(app.api.getState().running,false);assert.equal(app.timers.size,0);assert.equal(app.api.finish(surah,'en',token),false);assert.deepEqual(app.speechCalls,[]);
  app.document.hidden=false;const newer=app.api.start();await app.settle();app.listeners.get('pagehide')();assert.equal(app.api.finish(surah,'en',newer),false);
});
