'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../book-audio.js'),'utf8');
function mount({audio=true,webkit=false,resumePending=false,resumeRejects=false,constructorThrows=false,brokenNodes=false}={}){
  const sources=[],nodes=[],buffers=[],contexts=[],listeners=new Map(),speechCalls=[];
  let resumeCalls=0,resolver,rejecter;
  const parameter=()=>({timeline:[],setValueAtTime(value,time){this.timeline.push(['set',value,time]);},linearRampToValueAtTime(value,time){this.timeline.push(['linear',value,time]);},exponentialRampToValueAtTime(value,time){this.timeline.push(['exponential',value,time]);}});
  const node=kind=>{const n={kind,connections:[],disconnects:0,connect(target){this.connections.push(target);},disconnect(){this.disconnects++;}};nodes.push(n);return n;};
  class AudioContext{
    constructor(){if(constructorThrows)throw new Error('No audio device');this.state='suspended';this.sampleRate=8000;this.currentTime=3;this.destination={};contexts.push(this);}
    resume(){resumeCalls++;if(resumeRejects)return Promise.reject(new Error('Audio blocked'));if(resumePending)return new Promise((resolve,reject)=>{resolver=()=>{this.state='running';resolve();};rejecter=reject;});this.state='running';return Promise.resolve();}
    createBuffer(channels,length,rate){const samples=new Float32Array(length);const buffer={channels,length,sampleRate:rate,getChannelData(){return samples;}};buffers.push(buffer);return buffer;}
    createBufferSource(){const n=node('source');n.playbackRate=parameter();n.starts=[];n.stops=[];n.start=time=>n.starts.push(time);n.stop=time=>n.stops.push(time);sources.push(n);return n;}
    createBiquadFilter(){if(brokenNodes)throw new Error('Filter unsupported');const n=node('filter');n.frequency=parameter();n.Q=parameter();return n;}
    createGain(){const n=node('gain');n.gain=parameter();return n;}
  }
  const document={hidden:false,addEventListener(type,callback){listeners.set(type,callback);}};
  const context=vm.createContext({document,Promise,Float32Array,AudioContext:audio&&!webkit?AudioContext:undefined,webkitAudioContext:audio&&webkit?AudioContext:undefined,
    get speechSynthesis(){speechCalls.push('speech');throw new Error('Speech must not be accessed');},
    get SpeechSynthesisUtterance(){speechCalls.push('utterance');throw new Error('Speech must not be accessed');},
    fetch(){throw new Error('Network must not be used');},addEventListener(type,callback){listeners.set(type,callback);}
  });
  vm.runInContext(source,context,{filename:'book-audio.js'});
  return {api:context.CompassBookAudio,document,sources,nodes,buffers,contexts,listeners,speechCalls,resumeCalls:()=>resumeCalls,resolveResume:()=>resolver?.(),rejectResume:()=>rejecter?.(new Error('Audio blocked')),async settle(){for(let i=0;i<5;i++)await Promise.resolve();}};
}
test('startup is silent and page-turn resume is invoked immediately in the user gesture',async()=>{
  const app=mount({resumePending:true});assert.equal(app.contexts.length,0);assert.equal(app.sources.length,0);assert.deepEqual(app.speechCalls,[]);
  assert.equal(app.api.turn(),true);assert.equal(app.resumeCalls(),1);assert.equal(app.sources.length,0);
  app.resolveResume();await app.settle();assert.equal(app.sources.length,1);assert.equal(app.sources[0].starts.length,1);assert.deepEqual(app.speechCalls,[]);
});
test('paper sound uses finite filtered noise with a quiet envelope and disconnects naturally',async()=>{
  const app=mount();app.api.turn();await app.settle();
  const source=app.sources[0],buffer=app.buffers[0],filters=app.nodes.filter(n=>n.kind==='filter'),gain=app.nodes.find(n=>n.kind==='gain');
  assert.equal(buffer.channels,1);assert.ok(buffer.length/buffer.sampleRate<.6);
  const samples=buffer.getChannelData(0);assert.ok(samples.some(value=>value!==0));assert.ok(samples.every(value=>Number.isFinite(value)&&Math.abs(value)<=1));
  assert.deepEqual(filters.map(n=>n.type),['highpass','lowpass']);assert.equal(source.connections[0],filters[0]);assert.equal(filters[1].connections[0],gain);
  assert.equal(source.stops[0]-source.starts[0],.5);assert.ok(gain.gain.timeline.every(([,value])=>value>=0&&value<.1));assert.equal(gain.gain.timeline.at(-1)[1],0);
  source.onended();assert.ok(app.nodes.every(node=>node.disconnects===1));app.api.stop();assert.ok(app.nodes.every(node=>node.disconnects===1));
});
test('fast superseding calls share a pending resume and only the newest turn starts',async()=>{
  const app=mount({resumePending:true});app.api.turn();app.api.turn();app.api.turn();assert.equal(app.resumeCalls(),1);
  app.resolveResume();await app.settle();assert.equal(app.sources.length,1);assert.equal(app.sources[0].starts.length,1);
  const staleEnded=app.sources[0].onended;
  app.api.turn();assert.equal(app.sources.length,2);assert.equal(app.sources[0].stops.length,2);assert.ok(app.nodes.slice(0,4).every(node=>node.disconnects===1));
  staleEnded();assert.ok(app.nodes.slice(0,4).every(node=>node.disconnects===1));assert.equal(app.sources[1].disconnects,0,'A stale completion cannot dispose the newer sound');
  assert.equal(app.buffers.length,1,'The paper texture is reused rather than repeatedly allocated');app.api.stop();assert.ok(app.nodes.every(node=>node.disconnects===1));
});
test('stop invalidates a pending resume and cleans an active turn without late audio',async()=>{
  const app=mount({resumePending:true});app.api.turn();app.api.stop();app.resolveResume();await app.settle();assert.equal(app.sources.length,0);
  app.api.turn();assert.equal(app.sources.length,1);app.api.stop();assert.equal(app.sources[0].stops.length,2);assert.ok(app.nodes.every(node=>node.disconnects===1));
});
test('hidden pages and page exit stop active sound and invalidate asynchronous completions',async()=>{
  const hidden=mount({resumePending:true});hidden.api.turn();hidden.document.hidden=true;hidden.listeners.get('visibilitychange')();hidden.resolveResume();await hidden.settle();assert.equal(hidden.sources.length,0);assert.equal(hidden.api.turn(),false);
  const active=mount();active.api.turn();await active.settle();active.document.hidden=true;active.listeners.get('visibilitychange')();assert.ok(active.nodes.every(node=>node.disconnects===1));
  active.document.hidden=false;active.api.turn();active.listeners.get('pagehide')();assert.ok(active.nodes.every(node=>node.disconnects===1));
});
test('unavailable or rejected audio APIs stay silent and partial nodes are cleaned',async()=>{
  const missing=mount({audio:false});assert.equal(missing.api.turn(),false);missing.api.stop();assert.equal(missing.sources.length,0);
  const badDevice=mount({constructorThrows:true});assert.equal(badDevice.api.turn(),false);assert.equal(badDevice.sources.length,0);
  const blocked=mount({resumeRejects:true});assert.equal(blocked.api.turn(),true);await blocked.settle();assert.equal(blocked.sources.length,0);
  const broken=mount({brokenNodes:true});broken.api.turn();await broken.settle();assert.equal(broken.sources[0].starts.length,0);assert.equal(broken.sources[0].disconnects,1);
  const webkit=mount({webkit:true});webkit.api.turn();await webkit.settle();assert.equal(webkit.sources.length,1);assert.deepEqual(webkit.speechCalls,[]);
});
