/* A curved, left-to-right Surah directory. Quran text remains in the sourced reader. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),chapters=globalThis.SURAHS||[];
  const KEY='surah-compass-bookmark-v1';
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ur=()=>globalThis.CompanionStore?.settings().uiLanguage==='ur';
  const tr=(en,urdu)=>ur()?urdu:en;
  const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const star='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="m20 2 5 8 9-1-1 9 5 2-5 5 1 9-9-1-5 5-5-5-9 1 1-9-5-5 5-2-1-9 9 1Z"/><path d="m20 11 9 9-9 9-9-9Z"/></svg>';
  const arabicNumbers=value=>String(value).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)]);
  const state={opened:false,spread:0,focusedSurah:0,busy:false,bookmark:null,ribbonParked:false};
  let mounted=false,flipTimer=null,generation=0,drag=null,touchStart=null,suppressClick=false,ribbonPosition=null,ribbonFrame=null,ribbonGeneration=0;
  const CURL_STRIPS=16,CURL_FRAMES=40,CURL_DURATION=820;
  function readBookmark(){try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version!==1)return;if(saved.parked===true){state.ribbonParked=true;return;}if(Number.isInteger(saved.surahId)&&saved.surahId>=1&&saved.surahId<=114&&Number.isFinite(saved.x)&&saved.x>=.05&&saved.x<=.95&&Number.isFinite(saved.y)&&saved.y>=.03&&saved.y<=.8){state.bookmark={surahId:saved.surahId,x:saved.x,y:saved.y};state.ribbonParked=false;}}catch{}}
  readBookmark();
  function persistBookmark(){try{localStorage.setItem(KEY,JSON.stringify(state.bookmark?{version:1,...state.bookmark}:{version:1,parked:state.ribbonParked}));}catch{}if(typeof globalThis.dispatchEvent==='function'&&typeof CustomEvent==='function')globalThis.dispatchEvent(new CustomEvent('compass:bookmarked',{detail:{bookmark:state.bookmark?{...state.bookmark}:null}}));}
  function corners(){return '<i class="mushaf-page-corner tl"></i><i class="mushaf-page-corner tr"></i><i class="mushaf-page-corner bl"></i><i class="mushaf-page-corner br"></i>';}
  function leftId(){return state.spread?state.spread*2:0;}
  function rightId(){return state.spread?(state.spread-1)*2+1:0;}
  function coverArt(){return `<svg class="mushaf-cover-art" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="mushaf-tooling" width="40" height="40" patternUnits="userSpaceOnUse"><path d="m20 0 20 20-20 20L0 20Z M0 0l40 40M40 0 0 40" fill="none" stroke="#ba9957" stroke-width=".6"/><path d="m20 8 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="none" stroke="#ba9957" stroke-width=".8"/></pattern></defs><rect x="11" y="11" width="378" height="578" rx="8" fill="none" stroke="#c0a168" stroke-width="2"/><rect x="20" y="20" width="360" height="560" rx="3" fill="url(#mushaf-tooling)"/><rect x="40" y="40" width="320" height="520" rx="2" fill="#153b31" stroke="#c0a168" stroke-width="1.5"/><rect x="46" y="46" width="308" height="508" fill="none" stroke="#9c804b" stroke-width=".7"/><path d="M200 154c-17 28-56 27-69 52-17 33-32 29-38 52-9 35 4 63 30 80 26 17 39 18 77 47 38-29 51-30 77-47 26-17 39-45 30-80-6-23-21-19-38-52-13-25-52-24-69-52Z" fill="#102c25" stroke="#c6a970" stroke-width="2"/><path d="M200 167c-18 25-52 23-64 49-14 30-31 25-36 44-8 30 5 55 29 70 24 16 34 17 71 42 37-25 47-26 71-42 24-15 37-40 29-70-5-19-22-14-36-44-12-26-46-24-64-49Z" fill="none" stroke="#ac8b50" stroke-width=".8"/><path d="m58 58 26 0-26 26Zm284 0h-26l26 26ZM58 542h26l-26-26Zm284 0h-26l26-26Z" fill="#c3a363"/><path d="M168 111h64M174 117h52M168 441h64M174 447h52" stroke="#b59659" fill="none"/></svg>`;}
  function mount(){
    if(mounted||!$('mushaf-view'))return;
    mounted=true;
    $('mushaf-view').innerHTML=`<div class="mushaf-heading"><div><span class="eyebrow" id="mushaf-eyebrow"></span><h1 id="mushaf-title"></h1></div><button class="secondary-button" id="mushaf-list">${icon('search')}<span></span></button></div>
      <div class="mushaf-navigation"><label class="mushaf-jump-label"><span id="mushaf-jump-label"></span><select id="mushaf-jump" aria-label="Choose a Surah page"></select></label><p id="mushaf-description"></p><button class="text-button" id="mushaf-close">${icon('book')}<span></span></button></div>
      <div class="mushaf-stage" id="mushaf-stage"><div class="mushaf-scene" id="mushaf-scene"><div class="mushaf-floor-shadow" aria-hidden="true"></div><div class="mushaf-book" id="mushaf-book"><div class="mushaf-bottom-cover" aria-hidden="true"></div><div class="mushaf-paper-block" aria-hidden="true"></div><div class="mushaf-leaf-edges" aria-hidden="true"></div><div class="mushaf-spine" aria-hidden="true"></div>
        <div class="mushaf-leaf mushaf-left-page" id="mushaf-left-page" tabindex="0" aria-label="Turn to the next Surah spread"></div><div class="mushaf-leaf mushaf-right-page" id="mushaf-right-page" tabindex="0" aria-label="Turn to the previous Surah spread"></div><div class="mushaf-turn-leaf" id="mushaf-turn-leaf" aria-hidden="true" inert></div>
        <div class="mushaf-cover" id="mushaf-cover"><button class="mushaf-cover-face" id="mushaf-open" aria-label="Open the Quran catalogue">${coverArt()}<span class="mushaf-cover-title" lang="ar" dir="rtl">الْقُرْآنُ<br>الْكَرِيمُ</span><span class="mushaf-cover-action" id="mushaf-cover-action"></span></button><div class="mushaf-cover-lining" aria-hidden="true"></div></div></div>
        <button class="mushaf-open-caption" id="mushaf-open-caption"></button></div><div class="mushaf-ribbon-layer" id="mushaf-ribbon-layer"><button class="mushaf-bookmark-ribbon" id="mushaf-ribbon" aria-label="Drag the red ribbon onto a Surah page to bookmark it"><svg viewBox="0 0 28 300" preserveAspectRatio="none" aria-hidden="true"><path class="mushaf-ribbon-cloth" id="mushaf-ribbon-cloth" d="M7 0H21Q18 110 21 210L22 300 14 290 6 300Q10 200 7 0Z"/><path class="mushaf-ribbon-stitch" id="mushaf-ribbon-stitch" d="M10 2Q9 150 10 282M18 2Q19 150 18 282"/></svg></button></div></div>
      <div class="mushaf-page-controls"><button class="secondary-button" id="mushaf-previous">${icon('arrow')}<span></span></button><div class="mushaf-page-indicator"><span id="mushaf-page-position"></span><small id="mushaf-page-kind"></small></div><button class="secondary-button" id="mushaf-next"><span></span>${icon('arrow')}</button></div>
      <div class="mushaf-bookmark-tools"><span class="mushaf-ribbon-key" aria-hidden="true"></span><span id="mushaf-bookmark-status"></span><button class="text-button" id="mushaf-save-left"></button><button class="text-button" id="mushaf-save-right"></button><button class="text-button" id="mushaf-bookmark-jump"></button><button class="text-button" id="mushaf-bookmark-park"></button></div><p class="mushaf-catalogue-note" id="mushaf-catalogue-note"></p><div id="mushaf-announcement" class="visually-hidden" role="status" aria-live="polite"></div>`;
    $('mushaf-open').addEventListener('click',openCover);$('mushaf-open-caption').addEventListener('click',openCover);$('mushaf-close').addEventListener('click',close);
    $('mushaf-list').addEventListener('click',()=>globalThis.CompassApp?.navigate('library'));
    $('mushaf-previous').addEventListener('click',()=>turn(-1));$('mushaf-next').addEventListener('click',()=>state.opened?turn(1):openCover());
    $('mushaf-jump').addEventListener('change',()=>{const id=Number($('mushaf-jump').value);if(id===0){openCover();showSpread(0,false);}else goToSurah(id);});
    for(const side of ['left','right']){
      const leaf=$('mushaf-'+side+'-page');leaf.addEventListener('click',event=>pageClick(event,side));
      leaf.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target===leaf){event.preventDefault();pageClick(event,side);}});
    }
    $('mushaf-view').addEventListener('keydown',event=>{if(!state.opened)return;if(event.key==='Escape'){event.preventDefault();close();return;}if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(event.target.tagName))return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();turn(event.key==='ArrowRight'?1:-1);}});
    $('mushaf-stage').addEventListener('pointermove',tilt);$('mushaf-stage').addEventListener('pointerleave',resetTilt);
    $('mushaf-book').addEventListener('transitionend',event=>{if(event.propertyName==='width'||event.propertyName==='transform'){scheduleFit();trackRibbon(40);}});$('mushaf-scene').addEventListener('transitionend',event=>{if(event.target===$('mushaf-scene')&&event.propertyName==='transform')trackRibbon(40);});
    $('mushaf-stage').addEventListener('touchstart',event=>{if(!drag&&!event.target.closest?.('button,select,details'))touchStart=event.touches?.[0]?.clientX??null;},{passive:true});
    $('mushaf-stage').addEventListener('touchend',event=>{if(touchStart===null||drag||!state.opened)return;const delta=event.changedTouches?.[0]?.clientX-touchStart;touchStart=null;if(Number.isFinite(delta)&&Math.abs(delta)>55){suppressClick=true;turn(delta>0?1:-1);setTimeout(()=>suppressClick=false,100);}},{passive:true});
    $('mushaf-save-left').addEventListener('click',()=>setBookmark(leftId()));$('mushaf-save-right').addEventListener('click',()=>setBookmark(rightId()));$('mushaf-bookmark-jump').addEventListener('click',jumpToBookmark);$('mushaf-bookmark-park').addEventListener('click',removeBookmark);
    $('mushaf-ribbon').addEventListener('pointerdown',startDrag);$('mushaf-ribbon').addEventListener('pointermove',moveDrag);$('mushaf-ribbon').addEventListener('pointerup',finishDrag);$('mushaf-ribbon').addEventListener('pointercancel',cancelDrag);
    $('mushaf-ribbon').addEventListener('lostpointercapture',cancelDrag);
    $('mushaf-ribbon').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});
    $('mushaf-ribbon').addEventListener('keydown',event=>{if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();removeBookmark();}else if(event.key==='Enter'){event.preventDefault();state.bookmark?jumpToBookmark():setBookmark(rightId());}});
    refresh();
  }
  function openingPage(side){return `${corners()}<div class="mushaf-page-content mushaf-welcome"><div class="mushaf-page-heading-art">${star}</div>${side==='right'?`<span class="mushaf-page-small">${tr('IN THE NAME OF ALLAH','اللہ کے نام سے')}</span><h2 class="mushaf-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ<br>الرَّحْمَٰنِ الرَّحِيمِ</h2><span class="mushaf-quran-title" lang="ar" dir="rtl">الْقُرْآنُ الْكَرِيمُ</span>`:`<span class="mushaf-page-small">${tr('114 SURAHS · 30 JUZ','۱۱۴ سورتیں · ۳۰ پارے')}</span><h2><span class="mushaf-hint-wide">${tr('A page for every Surah.','ہر سورت کے لیے ایک صفحہ۔')}</span><span class="mushaf-hint-compact">${tr('The Surah directory','سورتوں کی فہرست')}</span></h2><p><span class="mushaf-hint-wide">${tr('Click the left page for next pages and the right page for previous pages. Use Open Surah to read.','اگلے صفحات کے لیے بائیں صفحے اور پچھلے صفحات کے لیے دائیں صفحے پر کلک کریں۔ مطالعے کے لیے «سورت کھولیں» منتخب کریں۔')}</span><span class="mushaf-hint-compact">${tr('Left: next pages','بائیں: اگلے صفحات')}<br>${tr('Right: previous pages','دائیں: پچھلے صفحات')}</span></p><span class="mushaf-welcome-rule"></span><button class="mushaf-page-read" data-begin>${tr('Begin with Al-Fatihah','الفاتحہ سے شروع کریں')} ${icon('arrow')}</button>`}<span class="mushaf-page-number">${tr('Opening','افتتاح')}</span></div>`;}
  function surahPage(s){
    const juz=s.juz[0]===s.juz[1]?s.juz[0]:`${s.juz[0]}–${s.juz[1]}`;
    const labels=ur()?['آیات','نزول','پارہ','ترتیبِ نزول']:['Ayahs','Revelation','Juz','Revelation order'];
    const values=[s.total_verses,ur()?(s.type==='medinan'?'مدنی':'مکی'):(s.type==='medinan'?'Medinan':'Meccan'),juz,s.revelation_order];
    return `${corners()}<div class="mushaf-page-content mushaf-surah-page"><div class="mushaf-chapter-kicker">${tr('SURAH','سورت')} ${String(s.id).padStart(3,'0')} <span>${star}</span></div><h2 class="mushaf-surah-arabic" lang="ar" dir="rtl">سُورَةُ ${esc(s.name)}</h2><h3>${esc(s.transliteration)}</h3><p class="mushaf-name-meaning">${esc(s.translation)}</p><div class="mushaf-metadata">${values.map((value,index)=>`<div${index===1||index===3?' class="mushaf-supplementary-fact"':''}><strong>${esc(value)}</strong><span>${labels[index]}</span></div>`).join('')}</div><div class="mushaf-leaf-details"><p class="mushaf-overview">${esc(s.overview||'')}</p><div class="mushaf-themes">${(s.themes||[]).map(theme=>`<span>${esc(theme)}</span>`).join('')}</div></div><p class="mushaf-detail-hint">${tr('Open for full details and reading','تفصیلات اور مطالعے کے لیے کھولیں')}</p><button class="mushaf-page-read" data-read-surah="${s.id}" aria-label="${tr('Open Surah','سورت کھولیں')} ${esc(s.transliteration)}, ${tr('full details and reading','تفصیلات اور مطالعہ')}">${tr('Open Surah','سورت کھولیں')} ${icon('arrow')}</button><span class="mushaf-page-number">${arabicNumbers(s.id)}</span></div>`;
  }
  function pageClick(event,side){
    if(!state.opened||state.busy||drag||suppressClick)return;
    const button=event.target.closest?.('[data-read-surah]');
    if(button){const id=Number(button.dataset.readSurah);if(Number.isInteger(id)&&id>=1&&id<=114){event.stopPropagation();state.focusedSurah=id;globalThis.CompassApp?.navigate('reader',{surahId:id,ayah:1});}return;}
    if(event.target.closest?.('a,select,details,summary,input')||typeof globalThis.getSelection==='function'&&globalThis.getSelection()?.toString())return;
    turn(side==='left'?1:-1);
  }
  function renderPage(){
    if(!mounted)return;
    const ids={left:leftId(),right:rightId()};
    for(const [side,id] of Object.entries(ids)){
      const leaf=$('mushaf-'+side+'-page');leaf.innerHTML=id?surahPage(chapters[id-1]):openingPage(side);leaf.dataset.surah=String(id);leaf.setAttribute('dir',ur()?'rtl':'ltr');leaf.setAttribute('aria-hidden',!state.opened);leaf.tabIndex=state.opened?0:-1;leaf.classList.toggle('is-jump-target',id>0&&id===state.focusedSurah);
      const action=side==='left'?tr('Click for next pages.','اگلے صفحات کے لیے کلک کریں۔'):tr('Click for previous pages.','پچھلے صفحات کے لیے کلک کریں۔');
      const boundary=side==='left'&&state.spread===57?tr('This is the final spread.','یہ آخری صفحات ہیں۔'):side==='right'&&state.spread===0?tr('This is the first spread.','یہ پہلے صفحات ہیں۔'):'';
      leaf.setAttribute('aria-label',`${id?tr(`Surah ${id}, ${chapters[id-1].transliteration}.`,`${chapters[id-1].name}۔`):tr('Opening page.','افتتاحی صفحہ۔')} ${action} ${boundary} ${id?tr('Use Open Surah to read.','مطالعے کے لیے سورت کھولیں۔'):''}`.trim());
    }
    $('mushaf-jump').value=String(state.focusedSurah);updateControls();renderBookmark();scheduleFit();
  }
  function updateControls(){
    if(!mounted)return;
    const openingChanged=$('mushaf-book').classList.contains('is-open')!==state.opened;
    $('mushaf-book').classList.toggle('is-open',state.opened);$('mushaf-stage').classList.toggle('is-open',state.opened);$('mushaf-scene').classList.toggle('is-open',state.opened);
    $('mushaf-open').tabIndex=state.opened?-1:0;$('mushaf-open').setAttribute('aria-hidden',state.opened);$('mushaf-open-caption').hidden=state.opened;$('mushaf-close').hidden=!state.opened;
    $('mushaf-previous').disabled=!state.opened||state.spread===0||state.busy;$('mushaf-next').disabled=state.opened&&state.spread===57||state.busy;
    $('mushaf-next').querySelector('span').textContent=state.opened?tr('Next pages','اگلے صفحات'):tr('Open the book','کتاب کھولیں');
    $('mushaf-page-position').textContent=state.opened?(state.spread?`${rightId()} / ${leftId()} · 114`:tr('Bismillah','بسم اللہ')):tr('114 Surahs','۱۱۴ سورتیں');
    $('mushaf-page-kind').textContent=state.opened?tr('Pages turn left to right','صفحات بائیں سے دائیں پلٹتے ہیں'):tr('Click the cover to open','کھولنے کے لیے جلد پر کلک کریں');
    for(const side of ['left','right'])$('mushaf-'+side+'-page').style.pointerEvents=state.opened&&!state.busy?'auto':'none';
    $('mushaf-save-left').disabled=!state.opened||!state.spread||state.busy;$('mushaf-save-right').disabled=!state.opened||!state.spread||state.busy;
    if(openingChanged)state.opened?trackRibbon(1000):stopRibbonTracking();
  }
  function refresh(){
    mount();if(!mounted)return;
    $('mushaf-eyebrow').textContent=tr('THE HOLY QURAN','قرآن کریم');$('mushaf-title').textContent=tr('The Surah book','سورتوں کی کتاب');
    $('mushaf-description').textContent=tr('Left page: next · Right page: previous','بایاں صفحہ: اگلا · دایاں صفحہ: پچھلا');
    $('mushaf-list').querySelector('span').textContent=tr('Search','تلاش');$('mushaf-jump-label').textContent=tr('Surah','سورت');
    $('mushaf-jump').innerHTML=`<option value="0">${tr('Bismillah · opening','بسم اللہ · افتتاح')}</option>`+chapters.map(s=>`<option value="${s.id}">${String(s.id).padStart(3,'0')} · ${ur()?esc(s.name):esc(s.transliteration)}</option>`).join('');
    $('mushaf-close').querySelector('span').textContent=tr('Close','بند کریں');$('mushaf-cover-action').textContent=tr('OPEN','کھولیں');$('mushaf-open-caption').textContent=tr('Click the cover to open','کھولنے کے لیے جلد پر کلک کریں');
    $('mushaf-previous').querySelector('span').textContent=tr('Previous pages','پچھلے صفحات');$('mushaf-catalogue-note').textContent=tr('Chapter introductions are study aids. Open Surah for the Quran text, translations and audio.','یہ صفحات سورتوں کے تعارف ہیں۔ قرآن، ترجمے اور تلاوت کے لیے سورت کھولیں۔');
    $('mushaf-save-left').textContent=tr('Save left page','بایاں صفحہ محفوظ کریں');$('mushaf-save-right').textContent=tr('Save right page','دایاں صفحہ محفوظ کریں');$('mushaf-bookmark-jump').textContent=tr('Go to saved page','محفوظ صفحہ کھولیں');$('mushaf-bookmark-park').textContent=tr('Park ribbon','ربن پیچھے رکھیں');renderPage();
  }
  function open(){mount();refresh();return getState();}
  function openCover(){mount();if(state.opened)return;state.opened=true;state.spread=0;state.focusedSurah=0;refresh();announce(tr('Book opened. Bismillah.','کتاب کھل گئی۔ بسم اللہ۔'));}
  function stopFlip(){generation++;clearTimeout(flipTimer);globalThis.CompassBookAudio?.stop?.();const turning=state.busy;state.busy=false;if(mounted){$('mushaf-turn-leaf').classList.remove('is-turning');$('mushaf-turn-leaf').innerHTML='';if(turning)renderPage();}}
  function close(){cancelDrag();stopFlip();state.opened=false;state.spread=0;state.focusedSurah=0;resetTilt();if(mounted){refresh();announce(tr('Book closed.','کتاب بند ہو گئی۔'));}}
  function showSpread(spread,animate=true,focused=0){
    if(!Number.isInteger(spread)||spread<0||spread>57||state.busy&&animate)return false;
    if(state.busy&&!animate)stopFlip();
    const old=state.spread,previous={left:$('mushaf-left-page')?.innerHTML||'',right:$('mushaf-right-page')?.innerHTML||''};
    if(old===0&&spread>0&&!state.bookmark&&!state.ribbonParked){state.ribbonParked=true;persistBookmark();}
    state.spread=spread;state.focusedSurah=focused||(spread?(spread-1)*2+1:0);renderPage();
    if(old!==spread&&animate&&state.opened)globalThis.CompassBookAudio?.turn?.();
    if(old!==spread&&animate&&!reduced()&&state.opened){
      const forward=spread>old,leaf=$('mushaf-turn-leaf'),fromSide=forward?'left':'right',toSide=forward?'right':'left',destination=$('mushaf-'+toSide+'-page').innerHTML;
      state.busy=true;const token=++generation,page=$('mushaf-'+fromSide+'-page'),width=page.offsetWidth||page.getBoundingClientRect().width,height=page.offsetHeight||page.getBoundingClientRect().height,stripWidth=width/CURL_STRIPS;
      const inactive=html=>html.replace(/<button\b/g,'<button tabindex="-1"');
      leaf.innerHTML=Array.from({length:CURL_STRIPS},(_,i)=>`<div class="mushaf-curl-strip" id="mushaf-curl-strip-${i}" style="width:${stripWidth+.35}px;left:${forward?-stripWidth:0}px;transform-origin:${forward?'right':'left'} center"><div class="mushaf-curl-face"><div class="mushaf-curl-print" style="width:${width}px;left:${-(forward?width-(i+1)*stripWidth:i*stripWidth)}px" dir="${ur()?'rtl':'ltr'}">${inactive(previous[fromSide])}</div><i class="mushaf-curl-shade" id="mushaf-curl-shade-${i}"></i></div><div class="mushaf-curl-face mushaf-curl-back"><div class="mushaf-curl-print" style="width:${width}px;left:${-(forward?i*stripWidth:width-(i+1)*stripWidth)}px" dir="${ur()?'rtl':'ltr'}">${inactive(destination)}</div><i class="mushaf-curl-shade"></i></div></div>`).join('');
      leaf.style.height=height+'px';leaf.dataset.direction=forward?'left-to-right':'right-to-left';leaf.classList.toggle('is-reverse',!forward);leaf.classList.add('is-turning');$('mushaf-'+toSide+'-page').innerHTML=previous[toSide];updateControls();renderBookmark();
      let frame=0;
      const animateCurl=()=>{if(token!==generation)return;drawCurl(frame/CURL_FRAMES,forward,stripWidth);if(frame++<CURL_FRAMES){flipTimer=setTimeout(animateCurl,CURL_DURATION/CURL_FRAMES);}else{state.busy=false;leaf.classList.remove('is-turning');leaf.innerHTML='';renderPage();}};
      animateCurl();
    }
    announce(spread?`${tr('Surahs','سورتیں')} ${rightId()}, ${leftId()}`:tr('Bismillah. Opening spread.','بسم اللہ۔ افتتاحی صفحات۔'));return true;
  }
  /* Different strip tangents form a continuous curved sheet around the gutter. */
  function drawCurl(progress,forward,width){
    const eased=progress*progress*(3-2*progress),theta=eased*Math.PI,bend=.78*Math.sin(theta);let x=0,z=30;
    for(let i=0;i<CURL_STRIPS;i++){const angle=theta+bend*Math.sin(Math.PI*(i+.5)/CURL_STRIPS),strip=$('mushaf-curl-strip-'+i);strip.style.transform=`translate3d(${x.toFixed(3)}px,0,${z.toFixed(3)}px) rotateY(${((forward?1:-1)*angle*180/Math.PI).toFixed(3)}deg)`;strip.dataset.angle=String(angle);$('mushaf-curl-shade-'+i).style.opacity=String(Math.abs(Math.sin(angle-theta))*.19);x+=(forward?-1:1)*width*Math.cos(angle);z+=width*Math.sin(angle);}
    $('mushaf-turn-leaf').dataset.progress=String(progress);
  }
  function scheduleFit(){if(typeof requestAnimationFrame==='function')requestAnimationFrame(fitPages);else fitPages();}
  function fitPages(){
    if(!mounted||state.busy)return;const stage=$('mushaf-stage'),styles=typeof getComputedStyle==='function'?getComputedStyle(stage):null,minimum=parseFloat(styles?.getPropertyValue('--book-min-height'))||520,maximum=Math.max(minimum,parseFloat(styles?.getPropertyValue('--book-max-height'))||560);
    stage.classList.remove('is-compact-spread');
    stage.style.setProperty('--book-height',minimum+'px');
    const natural=Math.max($('mushaf-left-page').scrollHeight||0,$('mushaf-right-page').scrollHeight||0);
    if(natural>maximum-8)stage.classList.add('is-compact-spread');
    const fitted=Math.max($('mushaf-left-page').scrollHeight||0,$('mushaf-right-page').scrollHeight||0);
    stage.style.setProperty('--book-height',clamp(Math.ceil(fitted+12),minimum,maximum)+'px');positionRibbon();
  }
  function turn(direction){if(!state.opened){openCover();return;}if(drag)return;showSpread(state.spread+direction);}
  function goToSurah(id){const number=Number(id);if(!Number.isInteger(number)||number<1||number>114)return false;mount();cancelDrag();stopFlip();state.opened=true;return showSpread(Math.ceil(number/2),false,number);}
  function announce(message){if(mounted)$('mushaf-announcement').textContent=message;}
  function tilt(event){if(!mounted||drag||reduced()||event.pointerType==='touch')return;const r=$('mushaf-stage').getBoundingClientRect();if(!r.width||!r.height)return;const x=clamp((event.clientX-r.left)/r.width*2-1,-1,1),y=clamp((event.clientY-r.top)/r.height*2-1,-1,1);$('mushaf-scene').style.setProperty('--tilt-x',(-y*2).toFixed(2)+'deg');$('mushaf-scene').style.setProperty('--tilt-y',(x*3).toFixed(2)+'deg');trackRibbon(230);}
  function resetTilt(){if(mounted){$('mushaf-scene').style.setProperty('--tilt-x','0deg');$('mushaf-scene').style.setProperty('--tilt-y','0deg');trackRibbon(230);}}
  function setBookmark(surahId,x=.5,y=.03){const id=Number(surahId);if(!Number.isInteger(id)||id<1||id>114||!Number.isFinite(x)||!Number.isFinite(y))return false;state.bookmark={surahId:id,x:clamp(x,.05,.95),y:clamp(y,.03,.8)};state.ribbonParked=false;persistBookmark();renderBookmark();announce(tr(`Saved page: ${chapters[id-1].transliteration}.`,`محفوظ صفحہ: ${chapters[id-1].name}`));return true;}
  function removeBookmark(){state.bookmark=null;state.ribbonParked=true;persistBookmark();renderBookmark();announce(tr('Ribbon parked behind the book.','ربن کتاب کے پیچھے رکھ دیا گیا۔'));}
  function jumpToBookmark(){return state.bookmark?goToSurah(state.bookmark.surahId):false;}
  function renderBookmark(){
    if(!mounted||drag)return;
    const ribbon=$('mushaf-ribbon'),saved=state.bookmark,visible=state.opened&&saved&&(saved.surahId===leftId()||saved.surahId===rightId());
    ribbon.hidden=!state.opened;ribbon.classList.toggle('is-parked',!visible&&(state.ribbonParked||!!saved||state.spread>0));ribbon.classList.remove('is-dragging');
    $('mushaf-left-page').classList.toggle('has-bookmark',!!visible&&saved.surahId===leftId());$('mushaf-right-page').classList.toggle('has-bookmark',!!visible&&saved.surahId===rightId());
    $('mushaf-bookmark-status').textContent=saved?tr(`Saved: ${chapters[saved.surahId-1].transliteration}`,`محفوظ: ${chapters[saved.surahId-1].name}`):tr('Drag the red ribbon onto a page','سرخ ربن صفحے پر رکھیں');$('mushaf-bookmark-jump').hidden=!saved;$('mushaf-bookmark-park').hidden=state.ribbonParked&&!saved;
    ribbon.setAttribute('aria-label',saved?tr(`Bookmark for ${chapters[saved.surahId-1].transliteration}. Drag to another page; Delete parks the ribbon.`,`${chapters[saved.surahId-1].name} کا نشان۔ دوسرے صفحے پر رکھیں یا ڈیلیٹ سے پیچھے رکھیں۔`):tr('Drag red ribbon to a page. Enter saves the right page; Delete parks it.','سرخ ربن صفحے پر رکھیں۔ انٹر دایاں صفحہ محفوظ کرے گا اور ڈیلیٹ ربن پیچھے رکھے گا۔'));positionRibbon();
  }
  /* The ribbon lives in a flat overlay, outside all CSS3D stacking contexts. */
  function positionRibbon(){
    if(!mounted||drag||!state.opened)return;const stage=$('mushaf-stage').getBoundingClientRect(),book=$('mushaf-book').getBoundingClientRect(),ribbon=$('mushaf-ribbon'),saved=state.bookmark;
    if(!book.width||!book.height)return;let x=book.left+book.width/2,y=book.top+4,length=book.height*.7,angle=0;
    if(saved&&(saved.surahId===leftId()||saved.surahId===rightId())){const r=$('mushaf-'+(saved.surahId===leftId()?'left':'right')+'-page').getBoundingClientRect();x=r.left+r.width*saved.x;y=r.top+r.height*saved.y;length=Math.min(length,Math.max(45,r.bottom-y-4));}
    else if(ribbon.classList.contains('is-parked')){x=book.left+book.width*.32;y=book.top-32;length=Math.min(length,book.width*.36);angle=-84;}
    ribbonPosition={x:x-stage.left,y:y-stage.top,length,angle};paintRibbon(ribbonPosition);drawRibbon(1);
  }
  function paintRibbon(position){const ribbon=$('mushaf-ribbon');ribbon.style.left=position.x+'px';ribbon.style.top=position.y+'px';ribbon.style.height=position.length+'px';ribbon.style.setProperty('--ribbon-angle',position.angle+'deg');}
  function stopRibbonTracking(){ribbonGeneration++;if(ribbonFrame!==null){if(typeof cancelAnimationFrame==='function')cancelAnimationFrame(ribbonFrame);else clearTimeout(ribbonFrame);}ribbonFrame=null;if(mounted)$('mushaf-stage').classList.remove('is-ribbon-tracking');}
  function trackRibbon(duration){
    stopRibbonTracking();if(!mounted||!state.opened||drag)return;if(reduced()){positionRibbon();return;}const token=ribbonGeneration,useFrames=typeof requestAnimationFrame==='function',now=()=>typeof performance==='object'&&typeof performance.now==='function'?performance.now():Date.now(),started=now();let frames=Math.ceil(duration/16);$('mushaf-stage').classList.add('is-ribbon-tracking');
    const follow=()=>{if(token!==ribbonGeneration||!state.opened||drag)return;positionRibbon();if(useFrames?now()-started<duration:frames-->0)ribbonFrame=useFrames?requestAnimationFrame(follow):setTimeout(follow,16);else{ribbonFrame=null;$('mushaf-stage').classList.remove('is-ribbon-tracking');}};follow();
  }
  function drawRibbon(bend){const b=clamp(bend,-4,4);$('mushaf-ribbon-cloth').setAttribute('d',`M7 0H21Q${21+b} 95 ${21-b/2} 190L22 300 14 290 6 300Q${7-b} 190 ${7+b/2} 0Z`);$('mushaf-ribbon-stitch').setAttribute('d',`M10 2Q${10+b} 150 10 282M18 2Q${18+b} 150 18 282`);}
  function startDrag(event){
    if(!state.opened||state.busy||drag||event.button!==undefined&&event.button!==0)return;event.preventDefault();event.stopPropagation();touchStart=null;$('mushaf-stage').classList.add('is-ribbon-dragging');resetTilt();stopRibbonTracking();positionRibbon();
    drag={pointerId:event.pointerId,bookmark:state.bookmark?{...state.bookmark}:null,parked:state.ribbonParked,origin:{...ribbonPosition},startX:event.clientX,startY:event.clientY,lastX:event.clientX,moved:false};suppressClick=true;$('mushaf-ribbon').classList.add('is-dragging');$('mushaf-ribbon').classList.remove('is-settling');try{$('mushaf-ribbon').setPointerCapture?.(event.pointerId);}catch{}
  }
  function moveDrag(event){
    if(!drag||event.pointerId!==drag.pointerId||drag.lastEvent===event)return;drag.lastEvent=event;event.preventDefault();event.stopPropagation();drag.moved=drag.moved||Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>=5;if(!drag.moved)return;const velocity=event.clientX-drag.lastX;drag.lastX=event.clientX;
    paintRibbon({x:drag.origin.x+event.clientX-drag.startX,y:drag.origin.y+event.clientY-drag.startY,length:drag.origin.length,angle:clamp(velocity*.4,-12,12)});drawRibbon(-velocity*.12);
  }
  function finishDrag(event){
    if(!drag||event.pointerId!==drag.pointerId)return;event.preventDefault();event.stopPropagation();const held=drag;drag=null;$('mushaf-stage').classList.remove('is-ribbon-dragging');try{$('mushaf-ribbon').releasePointerCapture?.(held.pointerId);}catch{}if(!held.moved&&Math.hypot(event.clientX-held.startX,event.clientY-held.startY)<5){renderBookmark();suppressClick=false;return;}let target=null;
    for(const side of ['right','left']){const page=$('mushaf-'+side+'-page'),r=page.getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom){const id=Number(page.dataset.surah);if(id>0)target={id,x:(event.clientX-r.left)/r.width,y:(event.clientY-r.top)/r.height};break;}}
    target?setBookmark(target.id,target.x,target.y):removeBookmark();renderBookmark();if(!reduced())$('mushaf-ribbon').classList.add('is-settling');setTimeout(()=>{suppressClick=false;$('mushaf-ribbon').classList.remove('is-settling');},480);
  }
  function cancelDrag(event){if(!drag)return;if(event&&event.pointerId!==undefined&&event.pointerId!==drag.pointerId)return;globalThis.CompassBookAudio?.stop?.();const held=drag;drag=null;state.bookmark=held.bookmark;state.ribbonParked=held.parked;$('mushaf-stage').classList.remove('is-ribbon-dragging');try{$('mushaf-ribbon').releasePointerCapture?.(held.pointerId);}catch{}renderBookmark();suppressClick=false;}
  function getState(){return {opened:state.opened,page:state.focusedSurah,surahId:state.focusedSurah||null,leftSurah:leftId()||null,rightSurah:rightId()||null,spread:state.spread,busy:state.busy,bookmark:state.bookmark?{...state.bookmark}:null,ribbonParked:state.ribbonParked};}
  function getPreferences(){return {[KEY]:JSON.stringify(state.bookmark?{version:1,...state.bookmark}:{version:1,parked:state.ribbonParked})};}
  function applyPreferences(values){let saved;try{saved=JSON.parse(values?.[KEY]);}catch{return false;}if(saved?.version!==1)return false;const valid=typeof saved.parked==='boolean'&&!Object.hasOwn(saved,'surahId')||Number.isInteger(saved.surahId)&&saved.surahId>=1&&saved.surahId<=114&&Number.isFinite(saved.x)&&saved.x>=.05&&saved.x<=.95&&Number.isFinite(saved.y)&&saved.y>=.03&&saved.y<=.8;if(!valid)return false;cancelDrag();state.bookmark=Object.hasOwn(saved,'surahId')?{surahId:saved.surahId,x:saved.x,y:saved.y}:null;state.ribbonParked=!state.bookmark&&saved.parked===true;renderBookmark();return true;}
  globalThis.CompassMushaf={open,refresh,close,goToSurah,getState,setBookmark,removeBookmark,jumpToBookmark,getPreferences,applyPreferences};
  if(typeof globalThis.addEventListener==='function'){
    globalThis.addEventListener('compass:state',()=>{if(mounted&&!state.busy)refresh();});globalThis.addEventListener('compass:navigation',event=>{if(event.detail?.view!=='mushaf'){cancelDrag();stopFlip();resetTilt();}});
    globalThis.addEventListener('pointermove',moveDrag);globalThis.addEventListener('pointerup',finishDrag);globalThis.addEventListener('pointercancel',cancelDrag);globalThis.addEventListener('blur',()=>{cancelDrag();resetTilt();});globalThis.addEventListener('resize',()=>{cancelDrag();scheduleFit();});
    globalThis.addEventListener('storage',event=>{if(event.key===KEY&&!drag){state.bookmark=null;state.ribbonParked=false;readBookmark();renderBookmark();}});
  }
  document.fonts?.ready.then(scheduleFit);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
