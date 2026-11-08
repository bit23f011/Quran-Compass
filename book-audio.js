/* A short offline paper rustle, called only for a successful user page turn. */
(() => {
  'use strict';
  const root=globalThis;
  let context=null,noise=null,resumePending=null,generation=0,active=null;
  const hidden=()=>Boolean(root.document?.hidden);
  function dispose(voice,halt=true){
    if(!voice||voice.disposed)return;
    voice.disposed=true;
    if(voice.source){voice.source.onended=null;if(halt)try{voice.source.stop();}catch{}}
    for(const node of voice.nodes)try{node.disconnect();}catch{}
    if(active===voice)active=null;
  }
  function stop(){generation++;dispose(active);}
  function paperNoise(){
    if(noise)return noise;
    const rate=context.sampleRate;
    const buffer=context.createBuffer(1,Math.ceil(rate*.56),rate),samples=buffer.getChannelData(0);
    let soft=0;
    for(let i=0;i<samples.length;i++){
      const white=Math.random()*2-1;soft=.94*soft+.06*white;
      const texture=.45+.55*Math.pow(Math.sin(i/rate*27),2);
      samples[i]=(.8*white+.2*soft)*texture;
    }
    noise=buffer;return buffer;
  }
  function play(token){
    if(token!==generation||hidden()||context?.state!=='running')return false;
    const voice={source:null,nodes:[]};
    try{
      voice.source=context.createBufferSource();voice.nodes.push(voice.source);
      voice.source.buffer=paperNoise();
      const high=context.createBiquadFilter();voice.nodes.push(high);
      const low=context.createBiquadFilter();voice.nodes.push(low);
      const gain=context.createGain();voice.nodes.push(gain);
      const at=context.currentTime;
      high.type='highpass';high.frequency.setValueAtTime(360,at);high.Q.setValueAtTime(.65,at);
      low.type='lowpass';low.frequency.setValueAtTime(4600,at);low.frequency.linearRampToValueAtTime(6200,at+.12);low.frequency.linearRampToValueAtTime(2300,at+.44);low.Q.setValueAtTime(.5,at);
      gain.gain.setValueAtTime(.0001,at);
      gain.gain.exponentialRampToValueAtTime(.052,at+.026);
      gain.gain.exponentialRampToValueAtTime(.034,at+.075);
      gain.gain.exponentialRampToValueAtTime(.068,at+.135);
      gain.gain.exponentialRampToValueAtTime(.016,at+.31);
      gain.gain.exponentialRampToValueAtTime(.0001,at+.46);
      gain.gain.linearRampToValueAtTime(0,at+.48);
      voice.source.playbackRate.setValueAtTime(.94+Math.random()*.12,at);
      voice.source.connect(high);high.connect(low);low.connect(gain);gain.connect(context.destination);
      active=voice;
      voice.source.onended=()=>dispose(voice,false);
      voice.source.start(at);voice.source.stop(at+.5);
      return true;
    }catch{dispose(voice);return false;}
  }
  function turn(){
    stop();if(hidden())return false;
    const token=generation;
    try{
      const Constructor=root.AudioContext||root.webkitAudioContext;
      if(!Constructor)return false;
      if(!context||context.state==='closed'){context=new Constructor();noise=null;resumePending=null;}
      if(context.state==='running')return play(token);
      if(typeof context.resume!=='function')return false;
      // Resume immediately during the user's click/key/swipe gesture. Only the
      // newest successful turn may play after an asynchronous device resume.
      if(!resumePending){
        const pending=Promise.resolve(context.resume());resumePending=pending;
        pending.then(()=>{if(resumePending===pending)resumePending=null;},()=>{if(resumePending===pending)resumePending=null;});
      }
      resumePending.then(()=>play(token),()=>{});
      return true;
    }catch{return false;}
  }
  root.CompassBookAudio={turn,stop};
  root.document?.addEventListener?.('visibilitychange',()=>{if(hidden())stop();});
  root.addEventListener?.('pagehide',stop);
})();
