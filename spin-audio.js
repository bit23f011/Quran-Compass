/* Quiet clock ticks and a completion chime, started by a spin gesture. */
(() => {
  'use strict';
  const root=globalThis;
  let context=null,clockTimer=null,generation=0,running=false,unlocked=false;
  let sound=true,startedAt=0,duration=6800;
  const nodes=new Set();
  const hidden=()=>Boolean(root.document?.hidden);
  function clearNoise(){
    if(clockTimer!==null){root.clearTimeout(clockTimer);clockTimer=null;}
    for(const node of nodes){try{node.oscillator.stop();}catch{}try{node.oscillator.disconnect();node.gain.disconnect();}catch{}}
    nodes.clear();
  }
  function stop(){generation++;running=false;clearNoise();}
  function tone(frequency,when,length,volume,type='sine'){
    if(!context||!sound||hidden())return;
    try{
      const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+when;
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
      gain.gain.setValueAtTime(0.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.003);gain.gain.exponentialRampToValueAtTime(0.0001,start+length);
      oscillator.connect(gain);gain.connect(context.destination);
      const node={oscillator,gain};nodes.add(node);
      oscillator.onended=()=>{nodes.delete(node);try{oscillator.disconnect();gain.disconnect();}catch{}};
      oscillator.start(start);oscillator.stop(start+length+.01);
    }catch{/* Devices without WebAudio still spin normally. */}
  }
  function tick(token){
    if(token!==generation||!running||!sound||hidden())return;
    const fraction=Math.min(1,(Date.now()-startedAt)/duration);
    if(fraction>=1)return;
    tone(1550,0,.012,.024,'triangle');
    clockTimer=root.setTimeout(()=>tick(token),65+Math.pow(fraction,3)*320);
  }
  function enableClock(token){
    if(!sound||!running||!unlocked||hidden())return;
    try{
      const Constructor=root.AudioContext||root.webkitAudioContext;
      if(Constructor&&!context)context=new Constructor();
      if(context){
        const ready=context.state==='suspended'&&context.resume?context.resume():undefined;
        Promise.resolve(ready).then(()=>{if(token===generation&&running&&sound&&!hidden())tick(token);}).catch(()=>{});
      }
    }catch{}
  }
  function start(options={}){
    stop();unlocked=true;running=true;startedAt=Date.now();
    duration=Number.isFinite(options.duration)?Math.max(100,Math.min(30000,options.duration)):6800;
    const token=generation;
    enableClock(token);
    return token;
  }
  function finish(surah,uiLanguage,token){
    if(token!==generation||!running||hidden())return false;
    running=false;clearNoise();
    if(sound){tone(740,0,.31,.035);tone(988,.11,.36,.025);}
    return true;
  }
  function configure(options={}){
    const wasSound=sound;
    if(typeof options.sound==='boolean')sound=options.sound;
    if(!sound)clearNoise();
    if(sound&&!wasSound)enableClock(generation);
    return {sound};
  }
  root.CompassSpinAudio={start,stop,finish,configure,getState:()=>({sound,running})};
  root.document?.addEventListener?.('visibilitychange',()=>{if(hidden())stop();});
  root.addEventListener?.('pagehide',stop);
})();
