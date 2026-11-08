(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const chapters = globalThis.SURAHS || [];
  if (chapters.length !== 114) { $('wheel-hint').textContent = 'The Surah catalogue could not be loaded. Please reopen the app.'; return; }
  const STATE_KEY = 'surah-compass-cycle-v1';
  const SAVE_KEY = 'surah-compass-saved-v1';
  const SPIN_DURATION=6800,SPIN_TURNS=11;
  let storageAvailable = true;
  function read(key, fallback) { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { storageAvailable = false; } }
  let cycle = new SurahEngine.SurahCycle(read(STATE_KEY, null));
  // Persist only inside a locked reservation, so opening a tab cannot overwrite a spin.
  let saved = new Set((() => { const value = read(SAVE_KEY, []); return Array.isArray(value) ? value.filter(id => Number.isInteger(id) && id > 0 && id <= 114) : []; })());
  let view = 'discover';
  const APP_VIEWS=['discover','mushaf','library','saved','reader','journey','settings'];
  let activeRouteKey=null,openedReaderRoute=null,mushafHydrated=false;
  let currentSurah = null;
  let spinning = false;
  let rotation = 0;
  let activeAnimation = null;
  let visualSurah = null;
  let translation = read('surah-translation', 'en');
  if (!['en','ur','ar'].includes(translation)) translation = 'en';
  let fontSize = Number(read('surah-font-size', 30));
  if (!Number.isFinite(fontSize)) fontSize = 30;
  fontSize = Math.max(22, Math.min(46, fontSize));
  let quran = globalThis.QURAN || {};
  let quranSources = globalThis.QURAN_SOURCES || {};
  let packDownloading = false;
  let toastTimer;
  let installPrompt=null,installInProgress=false,appInstalled=false;
  const installDisplay=typeof matchMedia==='function'?matchMedia('(display-mode: standalone)'):null;
  let searchScope='surahs';
  let spinSound=read('compass-spin-sound',true);
  if(typeof spinSound!=='boolean')spinSound=true;
  globalThis.CompassSpinAudio?.configure({sound:spinSound});
  const topics=[{label:'Sabr · Patience',ur:'صبر',aliases:['sabr','صبر','patience','steadfastness'],terms:['patience','steadfast','endurance']},{label:'Shukr · Gratitude',ur:'شکر',aliases:['shukr','شکر','gratitude'],terms:['gratitude','thank','blessings']},{label:'Tawhid · Oneness',ur:'توحید',aliases:['tawhid','tawheed','توحید','oneness'],terms:['oneness','one god','monotheism']},{label:'Mercy',ur:'رحمت',aliases:['رحمت','mercy'],terms:['mercy','merciful','compassion']},{label:'Prayer',ur:'نماز',aliases:['نماز','salah','prayer'],terms:['prayer','worship']},{label:'Charity',ur:'صدقہ',aliases:['صدقہ','زکوۃ','charity'],terms:['charity','giving','wealth','needy']},{label:'Prophets',ur:'انبیاء',aliases:['انبیاء','prophets'],terms:['prophet','moses','abraham','joseph','noah']},{label:'Hereafter',ur:'آخرت',aliases:['آخرت','hereafter','akhirah'],terms:['hereafter','resurrection','judgment','judgement']},{label:'Forgiveness',ur:'مغفرت',aliases:['مغفرت','توبہ','forgiveness'],terms:['forgiveness','repentance']}];
  const language=()=>globalThis.CompanionStore?.settings().uiLanguage||'en';
  const dictionary={en:{discover:'Discover',surahs:'Surahs',reader:'Reader',journey:'Journey',saved:'Saved',settings:'Settings',eyebrow:'114 CHAPTERS. ENDLESS REFLECTION.',discoverButton:'Discover a Surah',continueReading:'CONTINUE READING',compass:'THE SURAH COMPASS',spinOptions:'Personalise your spin',revelation:'Revelation',length:'Length',juz:'Juz',readingStatus:'Reading status',filterRule:'Filters preserve your global no-repeat cycle.',clearFilters:'Clear filters',ayahs:'Ayahs',topics:'Topics',footer:'Made for mindful discovery',about:'About & sources',openReader:'Open reader & audio',unread:'Unread',reading:'Reading',completed:'Completed'},ur:{discover:'دریافت',surahs:'سورتیں',reader:'مطالعہ',journey:'میرا سفر',saved:'محفوظ',settings:'ترتیبات',eyebrow:'۱۱۴ سورتیں، غور و فکر کا سفر',discoverButton:'ایک سورت دریافت کریں',continueReading:'مطالعہ جاری رکھیں',compass:'سورۃ کمپاس',spinOptions:'اپنی پسند سے انتخاب',revelation:'نزول',length:'طوالت',juz:'پارہ',readingStatus:'مطالعے کی حالت',filterRule:'فلٹر بدلنے سے مکمل چکر میں کوئی سورت نہیں دہرائی جاتی۔',clearFilters:'فلٹر ختم کریں',ayahs:'آیات',topics:'موضوعات',footer:'مطالعہ اور غور و فکر کے لیے',about:'تعارف اور ماخذ',openReader:'مطالعہ اور تلاوت کھولیں',unread:'ابھی نہیں پڑھا',reading:'مطالعہ جاری',completed:'مکمل'}};
  const t=(key,fallback)=>dictionary[language()][key]||fallback||key;
  Object.assign(dictionary.en,{search:'Search',brandTagline:'A MOMENT WITH THE QURAN',discoveryJourney:'Your discovery journey',progressOf:'of 114 Surahs discovered',reset:'Reset',spin:'SPIN',spinCaption:'WITH INTENTION',yetToDiscover:'Yet to discover',discovered:'Discovered',lastDiscovery:'YOUR LAST DISCOVERY',principleTurn:'Every Surah gets its turn',principleNoRepeat:'No repeats until all 114 are discovered.',principlePace:'Explore at your own pace',principleReflect:'Click a name to learn, save, and reflect.',principleStay:'Your journey stays with you',principleSaved:'Progress saved on this device.'});
  Object.assign(dictionary.ur,{search:'تلاش',brandTagline:'قرآن کے ساتھ ایک لمحہ',discoveryJourney:'سورتوں کی دریافت کا سفر',progressOf:'کل ۱۱۴ سورتوں میں سے دریافت',reset:'دوبارہ شروع',spin:'گھمائیں',spinCaption:'مطالعے کی نیت سے',yetToDiscover:'ابھی دریافت نہیں کی',discovered:'دریافت شدہ',lastDiscovery:'آخری دریافت',principleTurn:'ہر سورت کی باری آتی ہے',principleNoRepeat:'۱۱۴ سورتیں مکمل ہونے تک کوئی تکرار نہیں۔',principlePace:'اپنی رفتار سے مطالعہ کریں',principleReflect:'نام کھولیں، پڑھیں، محفوظ کریں اور غور کریں۔',principleStay:'آپ کا سفر آپ کے ساتھ',principleSaved:'پیشرفت اسی ڈیوائس پر محفوظ ہے۔'});
  function toast(message,duration=3600) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), duration); }
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const html = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pad = id => String(id).padStart(3, '0');
  const getSurah = id => chapters[id - 1];
  const typeName = type => type === 'medinan' ? 'Medinan' : 'Meccan';
  function readingStatus(id){return globalThis.CompanionStore?.status(id).status||'unread';}
  function lengthMatches(s,length){return length==='all'||!length||(length==='short'&&s.total_verses<=20)||(length==='medium'&&s.total_verses>20&&s.total_verses<=100)||(length==='long'&&s.total_verses>100);}
  function eligibleIds(){const type=$('spin-type').value||'all',length=$('spin-length').value||'all',juz=$('spin-juz').value||'all',status=$('spin-status').value||'all';return chapters.filter(s=>(type==='all'||s.type===type)&&lengthMatches(s,length)&&(juz==='all'||(s.juz[0]<=Number(juz)&&s.juz[1]>=Number(juz)))&&(status==='all'||readingStatus(s.id)===status)).map(s=>s.id);}
  function updateEligibility(){const allowed=new Set(eligibleIds());const pool=cycle.state.remaining.length?cycle.state.remaining:chapters.map(s=>s.id);const count=pool.filter(id=>allowed.has(id)).length;$('spin-filter-count').textContent=language()==='ur'?`${count} دستیاب`:`${count} available`;document.querySelectorAll('.wheel-segment').forEach(g=>g.classList.toggle('outside-filter',!allowed.has(Number(g.dataset.surah))));}
  function point(radius, degrees, center = 320) { const a = degrees * Math.PI / 180; return [center + radius * Math.cos(a), center + radius * Math.sin(a)]; }
  function wedge(start, end) { const a=point(296,start),b=point(296,end),c=point(153,end),d=point(153,start);return `M ${a} A 296 296 0 0 1 ${b} L ${c} A 153 153 0 0 0 ${d} Z`; }
  const step = 360 / 114;
  const handAngle = id => id ? ((id - .5) * step) % 360 : 0;
  function refreshSpinAudio(){
    const sound=$('spin-sound-toggle');
    if(sound)sound.checked=spinSound;
    if($('spin-sound-label'))$('spin-sound-label').textContent=language()==='ur'?'گھڑی کی آواز':'Clock sound';
    globalThis.CompassSpinAudio?.configure({sound:spinSound});
  }
  $('spin-sound-toggle')?.addEventListener('change',event=>{spinSound=Boolean(event.target.checked);write('compass-spin-sound',spinSound);refreshSpinAudio();});
  refreshSpinAudio();
  $('wheel-segments').innerHTML = chapters.map((s, i) => {
    const start = -90 + i * step, end = start + step, angle = start + step/2;
    const reverse = angle > 90 && angle < 270;
    const labelTransform = `translate(320 320) rotate(${reverse ? angle + 180 : angle})`;
    return `<g class="wheel-segment" data-surah="${s.id}" role="button" tabindex="-1" aria-label="${html(s.transliteration)}, Surah ${s.id}"><title>${s.id}. ${html(s.transliteration)} · ${s.total_verses} ayahs</title><path d="${wedge(start,end)}"/><text transform="${labelTransform}" x="${reverse ? -285 : 285}" y="2.8" text-anchor="${reverse ? 'start':'end'}">${html(s.transliteration)}</text><text class="segment-number" transform="translate(320 320) rotate(${angle+90})" x="0" y="-301" text-anchor="middle">${s.id}</text></g>`;
  }).join('');
  let ornament='';
  for(let i=0;i<16;i++){const angle=i*22.5;const a=point(112,angle,150),b=point(135,angle+11.25,150),c=point(112,angle+22.5,150);ornament+=`<path d="M ${a} L ${b} L ${c}"/><circle cx="${b[0]}" cy="${b[1]}" r="2"/>`;}
  $('ornament').innerHTML = ornament;
  $('wheel-segments').addEventListener('click', event => { if (spinning) return; const g = event.target.closest('[data-surah]'); if(g) openSurah(Number(g.dataset.surah)); });
  $('wheel-segments').addEventListener('mouseover', event => { if(spinning)return;const g=event.target.closest('[data-surah]');if(g){const s=getSurah(Number(g.dataset.surah));$('wheel-hint').textContent=`${s.transliteration} · ${s.translation} · ${s.total_verses} ayahs`;} });
  $('wheel-segments').addEventListener('mouseleave', () => { if(!spinning)$('wheel-hint').textContent='Spin the compass or click any Surah to explore'; });

  function updateProgress() {
    const n=cycle.state.history.length;
    $('explored-count').textContent=n;
    $('cycle-label').textContent=`${language()==='ur'?'چکر':'CYCLE'} ${String(cycle.state.cycle).padStart(2,'0')}`;
    $('remaining-label').textContent=language()==='ur'?(n===114?'چکر مکمل۔ نئے سفر کے لیے تیار۔':`${114-n} سورتیں ابھی باقی ہیں`):(n===114?'Journey complete. A new cycle awaits.':`${114-n} new discoveries ahead`);
    $('progress-fill').style.width=`${n/114*100}%`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow',n);
    document.querySelectorAll('.wheel-segment').forEach(g=>{const id=Number(g.dataset.surah);g.classList.toggle('discovered',cycle.state.history.includes(id));g.classList.toggle('selected',id===(visualSurah||cycle.state.history.at(-1)));});
    const last=cycle.state.history.at(-1);
    $('last-surah').hidden=!last;
    if(last)$('last-surah-name').textContent=`${getSurah(last).transliteration} · ${getSurah(last).total_verses} ayahs`;
    updateEligibility();
  }
  async function reserveSelection(reset = false) {
    const action=()=>{if(storageAvailable)cycle=new SurahEngine.SurahCycle(read(STATE_KEY,cycle.serialize()));if(reset){cycle.reset();write(STATE_KEY,cycle.serialize());return null;}const id=cycle.next(eligibleIds());if(id!==null)write(STATE_KEY,cycle.serialize());return id;};
    // Web Locks serializes reservations across tabs on HTTPS and localhost.
    if(navigator.locks?.request)return navigator.locks.request('surah-compass-selection',action);
    return action();
  }
  async function spin() {
    if(spinning)return;
    spinning=true;
    $('spin-button').disabled=true;$('discover-spin').disabled=true;$('reset-button').disabled=true;
    $('wheel-wrap').classList.add('is-spinning');
    $('wheel-hint').textContent=language()==='ur'?'ایک نئی سورت کی دریافت…':'A new chapter to discover…';
    const audioToken=globalThis.CompassSpinAudio?.start({duration:SPIN_DURATION});
    let audioFinished=false;
    try {
      const oldCycle=cycle.state.cycle;
      const id=await reserveSelection();
      if(id===null){updateProgress();$('wheel-hint').textContent=language()==='ur'?'ان فلٹرز میں کوئی نئی سورت باقی نہیں۔ فلٹر بدلیں۔':'No new Surahs match these filters. Clear or change your filters.';toast($('wheel-hint').textContent);return;}
      const target=handAngle(id);
      const destination=rotation+SPIN_TURNS*360+((target-rotation%360+360)%360);
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!reduced&&$('clock-hand').animate){activeAnimation=$('clock-hand').animate([{transform:`rotate(${rotation}deg)`},{transform:`rotate(${destination}deg)`}],{duration:SPIN_DURATION,easing:'cubic-bezier(.14,.48,.08,1)',fill:'forwards'});await activeAnimation.finished;$('clock-hand').style.transform=`rotate(${destination}deg)`;activeAnimation.cancel();activeAnimation=null;}
      else $('clock-hand').style.transform=`rotate(${destination}deg)`;
      rotation=destination;
      visualSurah=id;
      if(storageAvailable)cycle=new SurahEngine.SurahCycle(read(STATE_KEY,cycle.serialize()));
      updateProgress();
      if(oldCycle!==cycle.state.cycle)toast('All 114 explored. Your new journey has begun.');
      $('wheel-hint').textContent=language()==='ur'?`آپ نے ${getSurah(id).name} دریافت کی`:`You discovered ${getSurah(id).transliteration}`;
      openSurah(id);
      globalThis.CompassSpinAudio?.finish(getSurah(id),language(),audioToken);audioFinished=true;
      if(!storageAvailable)toast('Browser storage is unavailable. Progress is kept for this visit only.');
    } catch(error){console.error('Spin could not complete',error);updateProgress();toast('The spin was interrupted. Your latest discovery is saved below.');}
    finally{if(activeAnimation){activeAnimation.cancel();activeAnimation=null;}if(!audioFinished)globalThis.CompassSpinAudio?.stop();spinning=false;$('spin-button').disabled=false;$('discover-spin').disabled=false;$('reset-button').disabled=false;$('wheel-wrap').classList.remove('is-spinning');}
  }
  $('spin-button').addEventListener('click',spin);$('discover-spin').addEventListener('click',spin);
  $('last-surah').addEventListener('click',()=>openSurah(cycle.state.history.at(-1)));

  function isCloudFragment(hash=location.hash){return /(?:^#|&)(?:access_token|refresh_token|error|error_code|error_description)=/i.test(hash);}
  function parseAppRoute(hash=location.hash){
    if(!hash||hash==='#')return {view:'discover',options:{}};
    if(isCloudFragment(hash))return null;
    const parts=hash.slice(1).split('/'),name=parts[0];if(!APP_VIEWS.includes(name))return null;
    if(name!=='reader')return parts.length===1?{view:name,options:{}}:null;
    if(parts.length===1)return {view:name,options:{}};
    if(parts.length>3||!/^\d{1,3}$/.test(parts[1]))return null;
    const id=Number(parts[1]);if(id<1||id>114)return null;
    const options={surahId:id};if(parts.length===3){if(!/^\d{1,3}$/.test(parts[2]))return null;const ayah=Number(parts[2]);if(ayah<1||ayah>getSurah(id).total_verses)return null;options.ayah=ayah;}
    return {view:name,options};
  }
  function focusView(){
    const section=$(['library','saved'].includes(view)?'library-view':view+'-view');
    const target=section?.querySelector?.('h1')||$('main-content')||section;
    if(target?.focus){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
  }
  function setView(next,options={},navigation={}) {
    const previous=view;
    const previousSection=$(['library','saved'].includes(previous)?'library-view':previous+'-view'),focusedInPrevious=previousSection?.contains?.(document.activeElement);
    view=APP_VIEWS.includes(next)?next:'discover';
    if(view==='reader'){const last=globalThis.CompanionStore?.snapshot().lastRead,provided=Number.isInteger(Number(options.surahId))&&Number(options.surahId)>=1&&Number(options.surahId)<=114;const id=provided?Number(options.surahId):last?.surahId||1;const requested=Number(options.ayah)||(provided?globalThis.CompanionStore?.status(id).lastAyah:last?.ayah)||1;const ayah=Number.isInteger(requested)?Math.max(1,Math.min(getSurah(id).total_verses,requested)):1;options={surahId:id,ayah};}
    const routeKey=view+(view==='reader'?'/'+options.surahId+'/'+options.ayah:''),changed=routeKey!==activeRouteKey;
    activeRouteKey=routeKey;
    if(changed&&view!=='discover')globalThis.CompassSpinAudio?.stop();
    $('discover-view').hidden=view!=='discover';$('library-view').hidden=view==='discover';
    $('library-view').hidden=!['library','saved'].includes(view);
    $('mushaf-view').hidden=view!=='mushaf';
    $('reader-view').hidden=view!=='reader';$('journey-view').hidden=view!=='journey';$('settings-view').hidden=view!=='settings';
    document.querySelectorAll('[data-view]').forEach(button=>{const active=button.dataset.view===view;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    if(['library','saved'].includes(view)){$('library-title').innerHTML=language()==='ur'?(view==='saved'?'دل کے قریب<br><em>محفوظ سورتیں۔</em>':'ہر سورت،<br><em>ایک دعوت۔</em>'):(view==='saved'?'Keep a chapter<br><em>close to your heart.</em>':'Every chapter,<br><em>an invitation.</em>');$('library-description').textContent=language()==='ur'?'سورتوں، آیات اور موضوعات میں تلاش کریں۔':view==='saved'?'Your saved Surahs, ready whenever you are.':'Browse chapters, search ayahs, or explore a topic.';renderLibrary();}
    if(view==='reader'&&(changed||openedReaderRoute!==routeKey)&&globalThis.CompassReader?.open){globalThis.CompassReader.open(options.surahId,options.ayah);openedReaderRoute=routeKey;}
    if(view==='mushaf'&&(changed||!mushafHydrated)&&globalThis.CompassMushaf?.open){globalThis.CompassMushaf.open();mushafHydrated=true;}
    if(previous==='reader'&&view!=='reader'){openedReaderRoute=null;globalThis.CompassReader?.stopAudio();globalThis.CompassReader?.exitFocus();}
    if(view!=='mushaf')mushafHydrated=false;
    if(['journey','settings'].includes(view))globalThis.CompanionLearning?.refresh();
    document.body.dataset.view=view;
    if((changed||navigation.forceFocus)&&navigation.history!=='none'&&!isCloudFragment()&&location.hash!=='#'+routeKey)try{const method=navigation.history==='replace'||typeof history.pushState!=='function'?'replaceState':'pushState';history[method](null,'','#'+routeKey);}catch{}
    if(changed&&window.dispatchEvent&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('compass:navigation',{detail:{view}}));
    if(navigation.focus&&(changed||navigation.forceFocus)||changed&&previous!==view&&focusedInPrevious)focusView();
  }
  function applyHashRoute({focus=false,initial=false}={}){const route=parseAppRoute();if(route)setView(route.view,route.options,{history:'none',focus});else if(initial&&activeRouteKey===null)setView('discover',{}, {history:'none'});}
  window.addEventListener('hashchange',()=>applyHashRoute({focus:true}));window.addEventListener('popstate',()=>applyHashRoute({focus:true}));
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault?.();setView(button.dataset.view,{}, {focus:true,forceFocus:true});}));
  document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();setView('discover',{}, {focus:true,forceFocus:true});});
  $('skip-to-main')?.addEventListener('click',event=>{event.preventDefault();$('main-content')?.focus({preventScroll:true});});
  function normalize(value){return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ـ/g,'').replace(/ى/g,'ي').replace(/[^a-z0-9\u0600-\u06FF]/g,'');}
  function renderLibrary() {
    const query=normalize($('surah-search').value),type=$('type-filter').value;
    const juz=$('library-juz').value||'all',status=$('library-status').value||'all',sort=$('library-sort').value||'quran';
    const filter=s=>(view!=='saved'||saved.has(s.id))&&(type==='all'||!type||s.type===type)&&(juz==='all'||(s.juz[0]<=Number(juz)&&s.juz[1]>=Number(juz)))&&(status==='all'||readingStatus(s.id)===status);
    $('topic-explorer').hidden=searchScope!=='topics';
    if(searchScope==='topics')$('topic-explorer').innerHTML=topics.map((topic,index)=>`<button data-topic="${index}">${html(language()==='ur'?topic.ur:topic.label)}</button>`).join('');
    if(searchScope==='ayahs'){renderAyahSearch(query,filter);return;}
    $('surah-grid').hidden=false;$('ayah-search-results').hidden=true;
    const alias=searchScope==='topics'?topics.find(topic=>topic.aliases.some(value=>normalize(value)===query)):null;
    const found=chapters.filter(s=>{const text=normalize(`${s.id} ${s.name} ${s.transliteration} ${s.translation}${searchScope==='topics'?' '+s.themes.join(' ')+' '+s.overview:''}`);return filter(s)&&(!query||text.includes(query)||(alias&&alias.terms.some(term=>text.includes(normalize(term)))));});
    found.sort((a,b)=>sort==='shortest'?a.total_verses-b.total_verses:sort==='revelation'?a.revelation_order-b.revelation_order:a.id-b.id);
    $('result-count').textContent=`${found.length} Surah${found.length===1?'':'s'}`;
    $('surah-grid').innerHTML=found.map(s=>`<article class="surah-card"><button class="surah-card-main" data-open="${s.id}" aria-label="Read ${html(s.transliteration)}, ${html(s.translation)}"><div class="card-top"><span class="surah-number">${pad(s.id)}</span><span class="card-arabic" lang="ar" dir="rtl">${html(s.name)}</span></div><h2>${html(s.transliteration)}</h2><p>${html(s.translation)}</p>${searchScope==='topics'?`<div class="card-topics">${s.themes.map(theme=>`<span>${html(theme)}</span>`).join('')}</div>`:''}<div class="card-meta"><span>${typeName(s.type)}</span><span>·</span><span>${s.total_verses} ayahs</span><span>${cycle.state.history.includes(s.id)?'✓ '+t('discover'):'Explore →'}</span></div></button><div class="card-reading-footer"><span class="reading-status ${readingStatus(s.id)}">${t(readingStatus(s.id))}</span><button class="text-button" data-reader="${s.id}">${t('reader')} →</button></div><button class="icon-button card-save ${saved.has(s.id)?'is-saved':''}" data-save="${s.id}" aria-label="${saved.has(s.id)?'Unsave':'Save'} ${html(s.transliteration)}" aria-pressed="${saved.has(s.id)}">${icon('heart')}</button></article>`).join('');
    $('empty-state').hidden=found.length!==0;
    $('empty-title').textContent=view==='saved'&&saved.size===0?'A place for your favourite Surahs':'No Surahs found';
    $('empty-description').textContent=view==='saved'&&saved.size===0?'Tap the heart on any Surah to keep it here.':'Try another name, meaning, or Surah number.';
  }
  function renderAyahSearch(query,filter){
    $('surah-grid').hidden=true;$('ayah-search-results').hidden=false;$('empty-state').hidden=true;
    const results=[];let total=0;
    if(query.length>=2)for(const s of chapters){if(!filter(s))continue;for(const v of quran[s.id]||[]){if(normalize(`${v.text} ${v.translation_en} ${v.translation_ur}`).includes(query)){total++;if(results.length<80)results.push({s,v});}}}
    $('result-count').textContent=`${total} ${t('ayahs')}`;
    const ready=Object.keys(quran).length===114;
    if(!ready){$('ayah-search-results').innerHTML=`<div class="search-message">${icon('book')}<h2>${language()==='ur'?'قرآن کا متن حاصل کریں':'Bring the Quran into your search'}</h2><p>${language()==='ur'?'آیات میں تلاش کے لیے مکمل متن ایک بار ڈاؤن لوڈ کریں۔':'Download the reading pack once to search Arabic and English/Urdu ayahs offline.'}</p><button class="primary-button" data-search-download>${t('reader')} · Download pack</button></div>`;return;}
    $('ayah-search-results').innerHTML=results.length?results.map(({s,v})=>`<button class="ayah-result" data-result-surah="${s.id}" data-result-ayah="${v.id}"><div><span>${html(s.transliteration)} · ${s.id}:${v.id}</span>${icon('arrow')}</div><p class="ayah-result-arabic" lang="ar" dir="rtl">${html(v.text)}</p><p lang="${language()}" ${language()==='ur'?'dir="rtl"':''}>${html((language()==='ur'?v.translation_ur:v.translation_en)||'')}</p></button>`).join('')+(total>80?'<p class="search-limit">Showing the first 80 matches. Add more words to narrow your search.</p>':''):`<div class="search-message">${icon('search')}<h2>${query.length<2?'Search the words you remember':'No matching ayahs'}</h2><p>Enter at least two letters in Arabic, English, or Urdu.</p></div>`;
  }
  $('ayah-search-results').addEventListener('click',event=>{const result=event.target.closest('[data-result-surah]');if(result)navigateReader(Number(result.dataset.resultSurah),Number(result.dataset.resultAyah));if(event.target.closest('[data-search-download]'))downloadReadingPack();});
  $('surah-grid').addEventListener('click',event=>{const open=event.target.closest('[data-open]'),save=event.target.closest('[data-save]'),reader=event.target.closest('[data-reader]');if(open)openSurah(Number(open.dataset.open));if(save)toggleSave(Number(save.dataset.save));if(reader)navigateReader(Number(reader.dataset.reader));});
  $('surah-search').addEventListener('input',renderLibrary);$('type-filter').addEventListener('change',renderLibrary);
  $('topic-explorer').addEventListener('click',event=>{const button=event.target.closest('[data-topic]');if(button){const topic=topics[Number(button.dataset.topic)];if(topic){$('surah-search').value=topic.aliases[0];renderLibrary();}}});
  function updateSaved(){ $('saved-count').textContent=saved.size;if(currentSurah){const yes=saved.has(currentSurah);$('save-surah').classList.toggle('is-saved',yes);$('save-surah').setAttribute('aria-label',yes?'Unsave Surah':'Save Surah');$('save-surah').setAttribute('aria-pressed',yes);}if(['library','saved'].includes(view))renderLibrary(); }
  function toggleSave(id){if(storageAvailable){const latest=read(SAVE_KEY,[...saved]);if(Array.isArray(latest))saved=new Set(latest.filter(v=>Number.isInteger(v)&&v>0&&v<=114));}saved.has(id)?saved.delete(id):saved.add(id);write(SAVE_KEY,[...saved]);updateSaved();toast(saved.has(id)?'Surah saved to your collection.':'Surah removed from saved.');}
  $('save-surah').addEventListener('click',()=>{if(currentSurah)toggleSave(currentSurah);});
  function showDialog(id){$(id).showModal();document.body.classList.add('has-dialog');}
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('has-dialog');});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});});
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
  function openSurah(id){
    const s=getSurah(id);if(!s)return;currentSurah=id;
    $('detail-kicker').textContent=`SURAH ${pad(s.id)} · THE HOLY QURAN`;$('detail-arabic').textContent=s.name;$('detail-title').textContent=s.transliteration;$('detail-meaning').textContent=s.translation;
    const juz=s.juz[0]===s.juz[1]?s.juz[0]:`${s.juz[0]}–${s.juz[1]}`;
    $('detail-stats').innerHTML=[[s.total_verses,'Ayahs'],[typeName(s.type),'Revelation'],[juz,'Juz'],[s.revelation_order,'Revelation order']].map(([value,label])=>`<div class="detail-stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
    $('detail-overview').textContent=s.overview||`Surah ${s.transliteration} (${s.translation}) is chapter ${s.id} of the Quran, with ${s.total_verses} ayahs.`;
    $('detail-themes').innerHTML=(s.themes||[]).map(theme=>`<span>${html(theme)}</span>`).join('');
    $('detail-reading-state').textContent=t(readingStatus(id));
    const study=globalThis.STUDY?.[id];
    $('detail-study').innerHTML=study?`<h3>${language()==='ur'?'مزید مطالعہ':'Keep exploring'}</h3><div class="study-links">${study.references.map(ref=>`<a href="${html(ref.url)}" target="_blank" rel="noopener noreferrer">${html(ref.label)} ${icon('arrow')}</a>`).join('')}</div><p>These references open online. Study introductions and prompts are reading aids; consult the cited tafsir for interpretation.</p>`:'';
    $('detail-bottom-label').textContent=`${id} / 114`;$('previous-surah').disabled=id===1;$('next-surah').disabled=id===114;
    updateSaved();setDetailTab('overview');renderReading();
    if(!$('surah-dialog').open)showDialog('surah-dialog');
    $('surah-dialog').scrollTop=0;
  }
  function navigateReader(id,ayah){document.querySelectorAll('dialog').forEach(dialog=>{if(dialog.open)dialog.close();});const state=globalThis.CompanionStore?.status(id);setView('reader',{surahId:id,ayah:ayah||state?.lastAyah||1},{focus:true});}
  $('detail-open-reader').addEventListener('click',()=>navigateReader(currentSurah));
  $('resume-home').addEventListener('click',()=>{const last=globalThis.CompanionStore?.snapshot().lastRead;if(last)navigateReader(last.surahId,last.ayah);});
  function setDetailTab(tab){const overview=tab==='overview';$('overview-tab').setAttribute('aria-selected',overview);$('reading-tab').setAttribute('aria-selected',!overview);$('overview-content').hidden=!overview;$('reading-content').hidden=overview;}
  $('overview-tab').addEventListener('click',()=>setDetailTab('overview'));$('reading-tab').addEventListener('click',()=>setDetailTab('reading'));
  document.querySelector('.detail-tabs').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const tab=event.key==='Home'?'overview':event.key==='End'?'reading':$('overview-tab').getAttribute('aria-selected')==='true'?'reading':'overview';setDetailTab(tab);$(`${tab}-tab`).focus();}});
  $('previous-surah').addEventListener('click',()=>openSurah(currentSurah-1));$('next-surah').addEventListener('click',()=>openSurah(currentSurah+1));
  function renderReading(){
    const verses=quran[currentSurah];const ready=Array.isArray(verses)&&verses.length===getSurah(currentSurah).total_verses;
    $('reading-controls').hidden=!ready;$('reader-status-dot').textContent=ready?'':'·';
    if(!ready){$('verses').innerHTML=`<div class="pack-empty">${icon('book')}<h3>A little more space to read.</h3><p>Download the complete Arabic ayahs and English/Urdu translations once, then read without an internet connection.</p><div class="pack-actions"><button class="primary-button" id="reading-download" ${packDownloading?'disabled':''}>${packDownloading?'Downloading…':'Download reading pack'} ${icon('download')}</button><button class="secondary-button" id="reading-import">Import a pack</button></div></div>`;$('reading-import').addEventListener('click',()=>$('pack-file').click());$('reading-download').addEventListener('click',downloadReadingPack);return;}
    $('translation-select').value=translation;
    $('ayah-jump').innerHTML='<option value="">Jump to ayah</option>'+verses.map(v=>`<option value="${v.id}">Ayah ${v.id}</option>`).join('');
    const bismillah=currentSurah!==1&&currentSurah!==9?'<div class="bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>':'';
    const attribution=quranSources.arabic||'Imported Quran text';
    const translationAttribution=translation==='en'?quranSources.en:translation==='ur'?quranSources.ur:'';
    $('verses').innerHTML=bismillah+verses.map(v=>{const translated=translation==='en'?v.translation_en:translation==='ur'?v.translation_ur:'';return `<article class="ayah" id="ayah-${v.id}"><div class="ayah-top"><span>${currentSurah}:${v.id}</span><button class="icon-button" data-copy="${v.id}" aria-label="Copy ayah ${v.id}">${icon('copy')}</button></div><p class="arabic-verse" lang="ar" dir="rtl">${html(v.text)}</p>${translation!=='ar'?`<p class="translation" lang="${translation}">${html(translated||'This translation is not included in your pack.')}</p>`:''}</article>`;}).join('')+`<p class="reading-attribution">${html(attribution)}${translationAttribution?' · '+html(translationAttribution):translation!=='ar'?' · Imported translation (edition unspecified)':''}</p>`;
    $('verses').style.setProperty('--reading-size',fontSize+'px');
  }
  $('translation-select').addEventListener('change',()=>{translation=$('translation-select').value;write('surah-translation',translation);renderReading();});
  $('ayah-jump').addEventListener('change',()=>{const ayah=$(`ayah-${$('ayah-jump').value}`);if(ayah){const dialog=$('surah-dialog');dialog.scrollTo({top:ayah.offsetTop-80,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
  function changeFont(delta){fontSize=Math.max(22,Math.min(46,fontSize+delta));$('verses').style.setProperty('--reading-size',fontSize+'px');write('surah-font-size',fontSize);}
  $('font-smaller').addEventListener('click',()=>changeFont(-2));$('font-larger').addEventListener('click',()=>changeFont(2));
  $('verses').addEventListener('click',async event=>{const b=event.target.closest('[data-copy]');if(!b)return;const v=quran[currentSurah]?.find(v=>v.id===Number(b.dataset.copy));if(!v)return;const text=`${v.text}\n${translation==='en'?v.translation_en||'':translation==='ur'?v.translation_ur||'':''}\nQuran ${currentSurah}:${v.id}`;try{await navigator.clipboard.writeText(text);toast('Ayah copied.');}catch{toast('Copy is unavailable in this browser. Select the ayah text to copy it.');}});

  $('reset-button').addEventListener('click',()=>showDialog('reset-dialog'));
  $('confirm-reset').addEventListener('click',async()=>{globalThis.CompassSpinAudio?.stop();await reserveSelection(true);rotation=0;visualSurah=null;$('clock-hand').style.transform='rotate(0deg)';updateProgress();$('reset-dialog').close();if(view!=='discover')renderLibrary();$('wheel-hint').textContent='Spin the compass or click any Surah to explore';toast('A fresh journey. All 114 Surahs are ready.');});
  function updateTheme(){const dark=document.documentElement.dataset.theme==='dark';$('theme-toggle').setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');$('theme-toggle').innerHTML=icon(dark?'sun':'moon');document.querySelector('meta[name=theme-color]').content=dark?'#071a27':'#dcd3c2';}
  $('theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('surah-theme',theme);}catch{}updateTheme();});
  function updatePackStatus(){const count=Object.keys(quran).length;$('pack-status').textContent=count===114?'Your complete Quran text pack is ready. All 114 Surahs can be read offline.':`The Surah catalogue works offline. A full Arabic and translation pack can be added for complete reading.${count?` ${count} Surahs currently available.`:''}`;}
  function notifyQuranReady(){globalThis.QURAN=quran;globalThis.QURAN_SOURCES=quranSources;if(window.dispatchEvent&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('compass:quran-ready'));if(['library','saved'].includes(view)&&searchScope==='ayahs')renderLibrary();}
  $('sources-button').addEventListener('click',()=>{updatePackStatus();showDialog('about-dialog');});
  $('import-pack').addEventListener('click',()=>$('pack-file').click());
  function validatePack(input){
    if(!input||input.format!=='surah-compass-quran-v1'||!input.sources||typeof input.sources!=='object')throw new Error('Choose a Surah Compass Quran pack (quran-pack.json), with its translation editions identified.');
    const normalized=input.chapters;
    if(!normalized||typeof normalized!=='object')throw new Error('This file is not a Quran JSON pack.');
    const output={};
    for(const s of chapters){const vv=normalized[s.id];if(!Array.isArray(vv)||vv.length!==s.total_verses)throw new Error(`The pack is incomplete: Surah ${s.id} needs ${s.total_verses} ayahs.`);output[s.id]=vv.map((v,i)=>{if(!v||v.id!==i+1||typeof v.text!=='string'||!/[\u0621-\u064a]/.test(v.text)||v.text.length>20000)throw new Error(`Invalid ayah data in Surah ${s.id}.`);for(const key of ['translation_en','translation_ur'])if(v[key]!==undefined&&(typeof v[key]!=='string'||v[key].length>20000))throw new Error('Invalid translation text.');return{id:v.id,text:v.text,translation_en:typeof v.translation_en==='string'?v.translation_en:'',translation_ur:typeof v.translation_ur==='string'?v.translation_ur:''};});}
    const sources={};for(const key of ['arabic','en','ur'])if(typeof input.sources[key]==='string')sources[key]=input.sources[key].slice(0,300);
    return {format:'surah-compass-quran-v1',sources,chapters:output};
  }
  function openPackDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('surah-compass-text',1);request.onupgradeneeded=()=>request.result.createObjectStore('packs');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function storePack(pack){const db=await openPackDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('packs','readwrite');tx.objectStore('packs').put(pack,'quran');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
  async function downloadReadingPack(){
    if(packDownloading)return;packDownloading=true;
    $('download-pack').disabled=true;$('download-pack').textContent='Downloading…';
    if($('reading-download')){$('reading-download').disabled=true;$('reading-download').textContent='Downloading…';}
    try{
      const base='https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/';
      const editions=await Promise.all(['en','ur'].map(async lang=>{const response=await fetch(`${base}quran_${lang}.json`,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error('The reading pack could not be downloaded. Try again when online, or import a pack.');return response.json();}));
      const [en,ur]=editions;
      if(!Array.isArray(en)||!Array.isArray(ur)||en.length!==114||ur.length!==114)throw new Error('The downloaded pack is incomplete. Please try another pack.');
      const text={};
      for(const s of chapters){const e=en.find(c=>c.id===s.id),u=ur.find(c=>c.id===s.id);if(e?.verses?.length!==s.total_verses||u?.verses?.length!==s.total_verses)throw new Error('The downloaded pack is incomplete.');text[s.id]=e.verses.map((v,i)=>{const uv=u.verses[i];if(v.id!==uv.id||v.text!==uv.text||typeof v.translation!=='string'||typeof uv.translation!=='string')throw new Error('The downloaded text editions did not match.');return{id:v.id,text:v.text,translation_en:v.translation,translation_ur:uv.translation};});}
      const pack=validatePack({format:'surah-compass-quran-v1',sources:{arabic:'Quran JSON 3.1.2 · Arabic text',en:'Sahih International · English translation',ur:'Fateh Muhammad Jalandhry · Urdu translation'},chapters:text});
      await storePack(pack);quran=pack.chapters;quranSources=pack.sources;updatePackStatus();notifyQuranReady();if(currentSurah)renderReading();toast('All 114 Surahs are ready for offline reading.');
    }catch(error){console.error('Reading pack download failed',error);toast(error.message?.startsWith('The ')?error.message:'Could not download and save the reading pack. Check your connection and browser storage.');}
    finally{packDownloading=false;$('download-pack').disabled=false;$('download-pack').innerHTML=icon('download')+' Download reading pack';if(currentSurah)renderReading();}
  }
  $('download-pack').addEventListener('click',downloadReadingPack);
  async function restorePack(){try{const db=await openPackDB();const pack=await new Promise((resolve,reject)=>{const req=db.transaction('packs').objectStore('packs').get('quran');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});db.close();if(pack){const verified=validatePack(pack);quran=verified.chapters;quranSources=verified.sources;}updatePackStatus();notifyQuranReady();if(currentSurah)renderReading();}catch{/* Bundled text and catalogue remain available when IndexedDB is disabled. */}}
  $('pack-file').addEventListener('change',async()=>{const file=$('pack-file').files[0];if(!file)return;try{if(file.size>25*1024*1024)throw new Error('Please choose a Quran pack smaller than 25 MB.');const pack=validatePack(JSON.parse(await file.text()));try{await storePack(pack);}catch{throw new Error('Your browser could not save the pack. Allow site storage, then try again.');}quran=pack.chapters;quranSources=pack.sources;updatePackStatus();notifyQuranReady();if(currentSurah)renderReading();toast('All 114 Surahs imported. Your Quran reading is ready offline.');}catch(error){toast(error.message||'The pack could not be imported.');}finally{$('pack-file').value='';}});
  window.addEventListener('storage',event=>{if(event.key===STATE_KEY&&!spinning&&storageAvailable){cycle=new SurahEngine.SurahCycle(read(STATE_KEY,null));visualSurah=null;updateProgress();const id=cycle.state.history.at(-1);rotation=handAngle(id);$('clock-hand').style.transform=`rotate(${rotation}deg)`;if(view!=='discover')renderLibrary();}if(event.key===SAVE_KEY&&storageAvailable){const value=read(SAVE_KEY,[]);saved=new Set(Array.isArray(value)?value.filter(id=>Number.isInteger(id)&&id>0&&id<=114):[]);updateSaved();}if(event.key==='surah-theme'){document.documentElement.dataset.theme=event.newValue==='dark'?'dark':'light';updateTheme();}});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();setView('library');$('surah-search').focus();}});
  for(const id of ['spin-juz','library-juz'])$(''+id).innerHTML='<option value="all">All Juz</option>'+Array.from({length:30},(_,i)=>`<option value="${i+1}">Juz ${i+1}</option>`).join('');
  const spinFilters=read('surah-spin-filters',{});
  for(const id of ['spin-type','spin-length','spin-juz','spin-status']){if(spinFilters&&typeof spinFilters[id]==='string')$(id).value=spinFilters[id];$(id).addEventListener('change',()=>{write('surah-spin-filters',Object.fromEntries(['spin-type','spin-length','spin-juz','spin-status'].map(key=>[key,$(key).value])));updateEligibility();});}
  $('clear-spin-filters').addEventListener('click',()=>{for(const id of ['spin-type','spin-length','spin-juz','spin-status'])$(id).value='all';write('surah-spin-filters',{});updateEligibility();});
  for(const id of ['library-juz','library-status','library-sort'])$(id).addEventListener('change',renderLibrary);
  function applyLanguage(){
    const ur=language()==='ur';document.documentElement.lang=ur?'ur':'en';document.documentElement.dir=ur?'rtl':'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
    $('ui-language-toggle').textContent=ur?'EN':'اردو';$('ui-language-toggle').setAttribute('aria-label',ur?'Switch interface to English':'انٹرفیس اردو میں کریں');
    $('hero-title').innerHTML=ur?'قرآن کی تمام ۱۱۴<br><em>سورتیں دریافت کریں۔</em>':'Explore all 114<br><em>Surahs of the Quran.</em>';
    $('intro-copy').innerHTML=ur?'بغیر تکرار کے کمپاس گھمائیں اور قرآن کی سورتیں دریافت کریں۔ سورتوں کا تعارف پڑھیں، پھر ریڈر میں درج شدہ ماخذ سے عربی متن، تراجم اور تلاوت شامل کریں۔':'Discover Quran Surahs with a repeat-free spin. Browse chapter introductions, then load sourced Arabic text, translations and recitation in the reader.';
    $('surah-search').placeholder=ur?'نام، آیت یا موضوع تلاش کریں…':'Search name, meaning, ayah, or topic…';
    const optionNames=ur?{all:'سب',meccan:'مکی',medinan:'مدنی',short:'مختصر · ۲۰ آیات تک',medium:'درمیانی · ۲۱ تا ۱۰۰ آیات',long:'طویل · ۱۰۰ سے زیادہ آیات',unread:'ابھی نہیں پڑھا',reading:'مطالعہ جاری',completed:'مکمل',quran:'قرآنی ترتیب',revelation:'ترتیبِ نزول',shortest:'مختصر پہلے'}:null;
    for(const id of ['spin-type','spin-length','spin-juz','spin-status','type-filter','library-juz','library-status','library-sort'])for(const option of $(id).options){if(!option.dataset.originalText)option.dataset.originalText=option.textContent;option.textContent=optionNames?optionNames[option.value]||`پارہ ${option.value}`:option.dataset.originalText;}
    updateEligibility();updateHomeResume();refreshSpinAudio();updateInstallButton();if(['library','saved'].includes(view))setView(view);
    $('cycle-label').textContent=`${ur?'چکر':'CYCLE'} ${String(cycle.state.cycle).padStart(2,'0')}`;
    const left=cycle.state.remaining.length;$('remaining-label').textContent=ur?(left?`${left} سورتیں ابھی باقی ہیں`:'چکر مکمل۔ نئے سفر کے لیے تیار۔'):(left?`${left} new discoveries ahead`:'Journey complete. A new cycle awaits.');
    if(!spinning)$('wheel-hint').textContent=ur?'کمپاس گھمائیں یا مطالعے کے لیے کسی سورت پر کلک کریں':'Spin the compass or click any Surah to explore';
  }
  function updateHomeResume(){const last=globalThis.CompanionStore?.snapshot().lastRead;$('resume-home').hidden=!last;if(last)$('resume-home-label').textContent=`${getSurah(last.surahId).transliteration} · ${language()==='ur'?'آیت':'Ayah'} ${last.ayah}`;}
  function refreshUserState(){if(storageAvailable){cycle=new SurahEngine.SurahCycle(read(STATE_KEY,cycle.serialize()));const list=read(SAVE_KEY,[]);saved=new Set(Array.isArray(list)?list.filter(id=>Number.isInteger(id)&&id>=1&&id<=114):[]);}visualSurah=null;const id=cycle.state.history.at(-1);rotation=handAngle(id);$('clock-hand').style.transform=`rotate(${rotation}deg)`;updateProgress();updateSaved();updateHomeResume();if(globalThis.CompanionStore)applyLanguage();}
  $('ui-language-toggle').addEventListener('click',()=>globalThis.CompanionStore?.updateSettings({uiLanguage:language()==='en'?'ur':'en'}));
  if(globalThis.CompanionStore){document.querySelectorAll('[data-search-scope]').forEach(button=>button.addEventListener('click',()=>{searchScope=button.dataset.searchScope;document.querySelectorAll('[data-search-scope]').forEach(b=>b.setAttribute('aria-selected',b===button));renderLibrary();}));window.addEventListener('compass:state',()=>{applyLanguage();updateEligibility();});applyLanguage();}
  function isAppInstalled(){return appInstalled||Boolean(installDisplay?.matches)||navigator.standalone===true;}
  function installInstructions(){
    const ua=navigator.userAgent||'';
    const ios=/iPad|iPhone|iPod/i.test(ua)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
    if(ios)return language()==='ur'?'Safari میں شیئر بٹن کھولیں، پھر Add to Home Screen منتخب کریں۔':'In Safari, tap Share, then Add to Home Screen.';
    if(location.protocol==='file:')return language()==='ur'?'ایپ localhost یا HTTPS پر کھولیں، پھر براؤزر کے مینو سے Install app منتخب کریں۔':'Open this app through localhost or HTTPS, then choose Install app from the browser menu.';
    if(/Firefox/i.test(ua))return /Android/i.test(ua)?'In Firefox, open the browser menu and tap Install.':'Open this site in Chrome or Edge, then choose Install app from the browser menu.';
    if(/Safari/i.test(ua)&&!/Chrome|Chromium|Edg|Android/i.test(ua))return 'In Safari, open File and choose Add to Dock.';
    if(/Edg/i.test(ua))return 'In Edge, open the browser menu, choose Apps, then Install this site as an app.';
    return language()==='ur'?'Chrome کے مینو میں Install app یا Add to Home Screen منتخب کریں۔':'In Chrome, open the browser menu and choose Install app or Add to Home Screen.';
  }
  function updateInstallButton(){
    const button=$('install-app-button');if(!button)return;
    button.hidden=isAppInstalled();button.disabled=installInProgress;
    const label=language()==='ur'?'ایپ انسٹال کریں':'Install app';
    if($('install-app-label'))$('install-app-label').textContent=label;
    button.setAttribute('aria-label',label);button.title=installPrompt?label:installInstructions();
  }
  async function installApp(){
    if(isAppInstalled()){toast(language()==='ur'?'یہ ایپ پہلے سے انسٹال ہے۔':'This app is already installed.');return false;}
    if(installInProgress)return false;
    if(!installPrompt){toast(installInstructions(),8000);return false;}
    const event=installPrompt;installPrompt=null;installInProgress=true;updateInstallButton();
    try{
      // Call prompt directly inside the button's user gesture, before awaiting anything.
      await event.prompt();
      const choice=await event.userChoice;
      if(choice?.outcome==='accepted'){appInstalled=true;toast(language()==='ur'?'ایپ انسٹال ہو رہی ہے۔':'App installation accepted.');return true;}
      return false;
    }catch{toast(installInstructions(),8000);return false;}
    finally{installInProgress=false;updateInstallButton();}
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();if(!isAppInstalled())installPrompt=event;updateInstallButton();});
  window.addEventListener('appinstalled',()=>{appInstalled=true;installPrompt=null;updateInstallButton();});
  if(installDisplay?.addEventListener)installDisplay.addEventListener('change',updateInstallButton);
  else installDisplay?.addListener?.(updateInstallButton);
  $('install-app-button')?.addEventListener('click',installApp);updateInstallButton();
  function exportPreferences(){return {'surah-compass-cycle-v1':JSON.stringify(cycle.serialize()),'surah-compass-saved-v1':JSON.stringify([...saved]),'surah-theme':document.documentElement.dataset.theme,'surah-translation':JSON.stringify(translation),'surah-font-size':JSON.stringify(fontSize),'compass-spin-sound':JSON.stringify(spinSound),'surah-spin-filters':JSON.stringify(Object.fromEntries(['spin-type','spin-length','spin-juz','spin-status'].map(key=>[key,$(key).value||'all']))),...(globalThis.CompassMushaf?.getPreferences?.()||{}),...(globalThis.CompassReader?.getPreferences?.()||{})};}
  function applyPreferences(preferences){
    if(preferences[STATE_KEY])cycle=new SurahEngine.SurahCycle(JSON.parse(preferences[STATE_KEY]));
    if(preferences[SAVE_KEY])saved=new Set(JSON.parse(preferences[SAVE_KEY]));
    if(preferences['surah-theme'])document.documentElement.dataset.theme=preferences['surah-theme'];
    if(preferences['surah-translation'])translation=JSON.parse(preferences['surah-translation']);
    if(preferences['surah-font-size'])fontSize=JSON.parse(preferences['surah-font-size']);
    if(preferences['compass-spin-sound']){const value=JSON.parse(preferences['compass-spin-sound']);if(typeof value==='boolean')spinSound=value;}
    if(preferences['surah-spin-filters']){const filters=JSON.parse(preferences['surah-spin-filters']);for(const key of ['spin-type','spin-length','spin-juz','spin-status'])$(key).value=filters[key]||'all';}
    if(globalThis.CompanionStore&&!globalThis.CompanionStore.isPersistent())storageAvailable=false;
    globalThis.CompassMushaf?.applyPreferences?.(preferences);globalThis.CompassReader?.applyPreferences?.(preferences);refreshSpinAudio();visualSurah=null;
    const id=cycle.state.history.at(-1);rotation=handAngle(id);$('clock-hand').style.transform=`rotate(${rotation}deg)`;
    updateProgress();updateSaved();updateTheme();updateHomeResume();if(globalThis.CompanionStore)applyLanguage();
  }
  globalThis.CompassApp={getQuran:()=>quran,getSources:()=>quranSources,navigate:setView,openSurah,downloadPack:downloadReadingPack,importPack:()=>$('pack-file').click(),toast,t,refreshUserState,exportPreferences,applyPreferences,install:installApp,view:()=>view};
  updateProgress();updateSaved();updateTheme();updatePackStatus();restorePack();
  const last=cycle.state.history.at(-1);if(last){rotation=handAngle(last);$('clock-hand').style.transform=`rotate(${rotation}deg)`;}
  applyHashRoute({initial:true});
  // Deferred reader/book modules may become ready later. Hydrate the current URL, never a captured startup route.
  document.addEventListener('DOMContentLoaded',()=>applyHashRoute({initial:true}));
  if(location.protocol!=='file:'&&'serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').then(async registration=>{const worker=registration.installing||registration.waiting;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='activated'){$('offline-indicator').title='App saved for offline visits';$('offline-indicator').lastChild.textContent=' Offline ready';}});else if(registration.active){$('offline-indicator').title='App saved for offline visits';$('offline-indicator').lastChild.textContent=' Offline ready';}}).catch(()=>{/* Direct file mode already works without a service worker. */});}
})();
