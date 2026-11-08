/* Vercel's generic HTML integration, limited to public online visits.
 * Enable Web Analytics in the Vercel project dashboard before deployment.
 * https://vercel.com/docs/analytics/quickstart
 * This loader never reads or emits notes, bookmarks, learning state or custom events. */
(() => {
  'use strict';
  const root=globalThis;
  const STATE='__surahCompassAnalytics';
  const SCRIPT_ID='surah-compass-vercel-analytics';
  const SCRIPT_SRC='/_vercel/insights/script.js';
  if(root[STATE])return;
  const status={started:false,blocked:false,failed:false,waitingForSafeUrl:false};
  root[STATE]=status;
  const host=(root.location?.hostname||'').toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');
  const localHost=!host||host==='localhost'||host.endsWith('.localhost')||host==='0.0.0.0'||host==='::'||host==='::1'||/^127\./.test(host)||host.startsWith('::ffff:127.')||/^::ffff:7f[0-9a-f]{2}:/.test(host)||/^10\./.test(host)||/^192\.168\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host)||host.endsWith('.local');
  if(!['https:','http:'].includes(root.location?.protocol)||localHost){status.blocked=true;return;}
  const credentialKeys=new Set(['access_token','refresh_token','token_hash','id_token','token','code','auth_code','authorization_code','error_description','password','passwd','api_key','apikey','client_secret','session_token','credential','authorization']);
  function hasCredentials(value){
    // Decode parameter names so encoded callback keys receive the same guard.
    // Only known credential keys are excluded; campaign/search values are not
    // inspected, logged or turned into custom analytics events by this loader.
    return String(value||'').replace(/^[?#]/,'').split('?').some(part=>[...new URLSearchParams(part).keys()].some(key=>credentialKeys.has(key.toLowerCase())));
  }
  function safeVisit(){
    // Let the app complete authentication before starting the standard embed.
    // Benign query strings and anchors keep normal visitor/pageview metrics.
    if(root.location.username||root.location.password||hasCredentials(root.location.search)||hasCredentials(root.location.hash))return false;
    if(root.document?.referrer){
      try{const referrer=new URL(root.document.referrer);if(referrer.username||referrer.password||hasCredentials(referrer.search)||hasCredentials(referrer.hash))return false;}catch{return false;}
    }
    return true;
  }
  function load(){
    if(status.started||status.blocked||root.navigator?.onLine===false)return;
    if(!safeVisit()){status.waitingForSafeUrl=true;return;}
    status.waitingForSafeUrl=false;
    const document=root.document;
    if(!document?.head)return;
    if(document.getElementById(SCRIPT_ID)||document.querySelector(`script[src="${SCRIPT_SRC}"]`)){status.started=true;removeStartupListeners();return;}
    // Official generic queue. It is used only by Vercel's embed, with no custom
    // logging of the app's private data or undocumented SDK commands.
    root.va=root.va||function(...args){(root.vaq=root.vaq||[]).push(args);};
    const script=document.createElement('script');
    script.id=SCRIPT_ID;script.src=SCRIPT_SRC;script.async=true;script.defer=true;
    script.addEventListener('error',()=>{status.failed=true;});
    status.started=true;
    try{document.head.appendChild(script);}catch{status.failed=true;}
    removeStartupListeners();
  }
  // Navigation is only a chance to retry startup after the app sanitizes its
  // URL. Its payload is never recorded. The app replaces history after dispatch.
  const retryAfterNavigation=()=>Promise.resolve().then(load);
  function removeStartupListeners(){root.removeEventListener?.('online',load);root.removeEventListener?.('compass:navigation',retryAfterNavigation);}
  root.addEventListener?.('online',load);
  root.addEventListener?.('compass:navigation',retryAfterNavigation);
  if(!root.document?.head)root.document?.addEventListener?.('DOMContentLoaded',load,{once:true});
  load();
})();
