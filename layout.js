/* Keep sticky tools below the header, including wrapped and translated navbars. */
(() => {
  'use strict';
  const header=document.querySelector('.site-header');
  if(!header)return;
  const update=()=>document.documentElement.style.setProperty('--header-offset',Math.ceil(header.getBoundingClientRect().height)+'px');
  update();
  if(typeof ResizeObserver==='function')new ResizeObserver(update).observe(header);
  else addEventListener('resize',update,{passive:true});
})();
