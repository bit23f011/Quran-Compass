/* A startup indicator and supplied-logo marks only while source operations are busy. */
(() => {
  'use strict';
  const root=document.documentElement;
  function dismiss(){root.classList.remove('app-starting');const loader=document.getElementById('app-loader');if(loader)loader.hidden=true;}
  function updateBusy(){
    const checks=[
      ['reader-load-selection',()=>document.getElementById('reader-cancel-selection')?.hidden===false],
      ['reader-load-tafsir',()=>document.getElementById('reader-cancel-tafsir')?.hidden===false],
      ['reader-refresh-catalog',()=>document.getElementById('reader-refresh-catalog')?.disabled===true],
      ['download-pack',()=>document.getElementById('download-pack')?.disabled===true]
    ];
    for(const [id,isBusy] of checks){const button=document.getElementById(id);if(!button)continue;const busy=Boolean(isBusy());button.setAttribute('data-brand-loading',String(busy));button.setAttribute('aria-busy',String(busy));}
  }
  function ready(){
    dismiss();updateBusy();
    if(typeof MutationObserver==='function'&&document.body)new MutationObserver(updateBusy).observe(document.body,{subtree:true,attributes:true,attributeFilter:['disabled','hidden'],childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  addEventListener('pageshow',dismiss);
})();
