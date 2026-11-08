'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const core=()=>import('../scripts/seo-core.mjs');

test('public canonical origin is normalized and malformed/private origins are rejected',async()=>{
  const {normalizeSiteUrl}=await core();
  assert.equal(normalizeSiteUrl('https://tilawat-e-quran.vercel.app/'),'https://tilawat-e-quran.vercel.app');
  assert.equal(normalizeSiteUrl(''),'');
  for(const value of ['javascript:alert(1)','http://example.com','https://user:pass@example.com/','https://example.com/sub/','https://example.com/?token=a','https://example.com/#reader','https://localhost','https://127.0.0.1','https://192.168.1.2','https://[::1]','https://intranet'])assert.throws(()=>normalizeSiteUrl(value),/SITE_URL/);
});

test('configured production origin and Vercel preview controls use explicit precedence',async()=>{
  const {readSiteSettings}=await core(),root=await fs.mkdtemp(path.join(os.tmpdir(),'compass-site-test-'));
  try{
    await fs.writeFile(path.join(root,'site-config.json'),JSON.stringify({siteUrl:'https://tilawat-e-quran.vercel.app',analyticsEnabled:true}));
    assert.deepEqual(await readSiteSettings(root,{}),{siteUrl:'https://tilawat-e-quran.vercel.app',preview:false,analyticsEnabled:true});
    assert.deepEqual(await readSiteSettings(root,{SITE_URL:'https://quran.example.com/',VERCEL_ENV:'preview'}),{siteUrl:'https://quran.example.com',preview:true,analyticsEnabled:false});
    assert.equal((await readSiteSettings(root,{ANALYTICS_ENABLED:'false'})).analyticsEnabled,false);
    await fs.writeFile(path.join(root,'site-config.json'),'{}');
    assert.equal((await readSiteSettings(root,{VERCEL_PROJECT_PRODUCTION_URL:'project.vercel.app'})).siteUrl,'https://project.vercel.app');
    assert.equal((await readSiteSettings(root,{VERCEL_ENV:'preview',VERCEL_URL:'random-preview.vercel.app'})).siteUrl,'');
    assert.equal((await readSiteSettings(root,{VERCEL_ENV:'production',VERCEL_URL:'production.vercel.app'})).siteUrl,'https://production.vercel.app');
  }finally{assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(),'compass-site-test-')));await fs.rm(root,{recursive:true,force:true});}
});

test('homepage schema describes actual app features and preview metadata cannot invite indexing',async()=>{
  const {homeMeta}=await core(),meta=homeMeta({siteUrl:'https://tilawat-e-quran.vercel.app'});
  assert.match(meta,/rel="canonical" href="https:\/\/tilawat-e-quran\.vercel\.app\/"/);
  assert.match(meta,/summary_large_image/);assert.match(meta,/social-preview\.png/);
  const schema=JSON.parse(meta.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@graph'][1]['@type'],'WebApplication');
  assert.match(schema['@graph'][1].description,/downloaded separately/);
  assert.doesNotMatch(JSON.stringify(schema),/aggregateRating|reviewCount/);
  assert.match(homeMeta({preview:true}),/noindex,follow/);
  assert.doesNotMatch(homeMeta({}),/rel="canonical"/);
});

test('analytics disabling and SEO rendering preserve the runtime outside the head markers',async()=>{
  const {renderHome}=await core(),source=await fs.readFile(path.join(__dirname,'../index.html'),'utf8');
  const page=renderHome(source,{siteUrl:'https://tilawat-e-quran.vercel.app',preview:false,analyticsEnabled:false});
  assert.doesNotMatch(page,/<script src="analytics\.js" defer>/);
  assert.match(page,/<script src="book-audio\.js" defer>/);
  assert.match(page,/id="spin-button"/);assert.match(page,/id="skip-to-main"/);
  assert.match(page,/href="\/surahs\/"/);assert.match(page,/id="main-content" tabindex="-1"/);
});

test('robots and sitemap include only canonical public pages and omit invented dates or fragments',async()=>{
  const {renderRobots,renderSitemap}=await core(),siteUrl='https://tilawat-e-quran.vercel.app';
  assert.match(renderRobots({siteUrl}),/Sitemap: https:\/\/tilawat-e-quran\.vercel\.app\/sitemap\.xml/);
  assert.equal(renderRobots({siteUrl,preview:true}),'User-agent: *\nDisallow: /\n');
  const sitemap=renderSitemap(['/surahs/','/faq/','/about/','/surahs/1-al-fatihah/','/faq/'],siteUrl);
  assert.equal((sitemap.match(/<loc>/g)||[]).length,5);
  assert.doesNotMatch(sitemap,/lastmod|changefreq|priority|#/);
  assert.equal(renderSitemap([],''),null);
  assert.throws(()=>renderSitemap(['/#reader/1/1'],siteUrl),/public page paths/);
});
