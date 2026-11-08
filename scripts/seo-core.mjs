import {readFile} from 'node:fs/promises';
import path from 'node:path';

export const HOME_TITLE='Surah Compass | Explore All 114 Quran Surahs';
export const HOME_DESCRIPTION='Explore all 114 Quran Surahs with a repeat-free random Surah wheel, chapter introductions, bookmarks and a reader with sourced text and audio options.';
const html=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const xml=html;
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');

export function normalizeSiteUrl(value){
  if(!value)return '';
  let url;try{url=new URL(value);}catch{throw new Error('Set SITE_URL to the full HTTPS production URL, for example https://your-project.vercel.app.');}
  const host=url.hostname.toLowerCase();
  const local=host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||/^(?:0\.|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)||host==='[::1]'||host==='[::]'||/^\[(?:fc|fd|fe80)/.test(host)||!host.includes('.');
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||local)throw new Error('SITE_URL must be a public HTTPS origin without credentials, a path, query or fragment.');
  return url.origin;
}

export async function readSiteSettings(root,env=process.env){
  let config={};try{config=JSON.parse(await readFile(path.join(root,'site-config.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(typeof config!=='object'||config===null||Array.isArray(config)||config.siteUrl!==undefined&&typeof config.siteUrl!=='string'||config.analyticsEnabled!==undefined&&typeof config.analyticsEnabled!=='boolean')throw new Error('Invalid site-config.json settings.');
  const preview=env.VERCEL_ENV==='preview';
  const inferred=env.VERCEL_PROJECT_PRODUCTION_URL||(env.VERCEL_ENV==='production'?env.VERCEL_URL:'')||'';
  const siteUrl=normalizeSiteUrl(env.SITE_URL||config.siteUrl||(inferred?'https://'+inferred:''));
  return {siteUrl,preview,analyticsEnabled:config.analyticsEnabled!==false&&env.ANALYTICS_ENABLED!=='false'&&!preview};
}

export function homeMeta({siteUrl='',preview=false}={}){
  siteUrl=normalizeSiteUrl(siteUrl);
  const image=siteUrl+'/assets/social-preview.png';
  const graph=[{'@type':'WebSite',...(siteUrl?{'@id':siteUrl+'/#website',url:siteUrl+'/'}:{}),name:'Surah Compass',inLanguage:['en','ur']},{'@type':'WebApplication',...(siteUrl?{'@id':siteUrl+'/#app',url:siteUrl+'/'}:{}),name:'Surah Compass',applicationCategory:'EducationalApplication',operatingSystem:'Any',isAccessibleForFree:true,description:'Explore all 114 Quran chapters with a repeat-free discovery wheel and sourced study introductions. Quran text and audio packs can be downloaded separately for offline reading and listening.'}];
  return [
    `<title>${html(HOME_TITLE)}</title>`,
    `<meta name="description" content="${html(HOME_DESCRIPTION)}">`,
    `<meta name="robots" content="${preview?'noindex,follow':'index,follow,max-image-preview:large'}">`,
    ...(siteUrl?[`<link rel="canonical" href="${html(siteUrl)}/">`,`<meta property="og:url" content="${html(siteUrl)}/">`]:[]),
    '<meta property="og:type" content="website">','<meta property="og:site_name" content="Surah Compass">','<meta property="og:locale" content="en_US">',
    `<meta property="og:title" content="${html(HOME_TITLE)}">`,`<meta property="og:description" content="${html(HOME_DESCRIPTION)}">`,`<meta property="og:image" content="${html(image)}">`,
    '<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">','<meta property="og:image:alt" content="Surah Compass: explore all 114 Surahs of the Quran">',
    '<meta name="twitter:card" content="summary_large_image">',`<meta name="twitter:title" content="${html(HOME_TITLE)}">`,`<meta name="twitter:description" content="${html(HOME_DESCRIPTION)}">`,`<meta name="twitter:image" content="${html(image)}">`,
    `<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script>`
  ].join('\n  ');
}

export function renderHome(source,settings){
  if(!source.includes('<!-- site-meta:start -->')||!source.includes('<!-- site-meta:end -->'))throw new Error('The homepage SEO markers are missing.');
  let page=source.replace(/<!-- site-meta:start -->[\s\S]*?<!-- site-meta:end -->/,'<!-- site-meta:start -->\n  '+homeMeta(settings)+'\n  <!-- site-meta:end -->');
  if(!settings.analyticsEnabled)page=page.replace(/\s*<script src="analytics\.js" defer><\/script>/,'');
  return page;
}

export function renderRobots({siteUrl='',preview=false}={}){
  siteUrl=normalizeSiteUrl(siteUrl);
  if(preview)return 'User-agent: *\nDisallow: /\n';
  return 'User-agent: *\nAllow: /\nDisallow: /_vercel/\n'+(siteUrl?'\nSitemap: '+siteUrl+'/sitemap.xml\n':'');
}

export function renderSitemap(routes,siteUrl){
  siteUrl=normalizeSiteUrl(siteUrl);if(!siteUrl)return null;
  const paths=[...new Set(['/',...routes])];
  for(const route of paths)if(typeof route!=='string'||!/^\/(?:[a-z0-9-]+\/)*$/.test(route))throw new Error('Sitemap routes must be clean public page paths.');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+paths.map(route=>'  <url><loc>'+xml(siteUrl+route)+'</loc></url>').join('\n')+'\n</urlset>\n';
}
