'use strict';
// Tests generated editorial pages. No Quran-text fixtures are written to app data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const temporaryRoots = [];
let generateSeoPages, catalogue, study, production;
const decode = text => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const graph = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];

async function tempRoot() {
  const directory = await fs.mkdtemp(path.join(__dirname, '.seo-test-'));
  temporaryRoots.push(directory);
  return directory;
}
async function generate(options = {}) {
  const output = path.join(await tempRoot(), 'output');
  const result = await generateSeoPages({ root, output, ...options });
  const documents = new Map(await Promise.all(result.files.map(async file => [file, await fs.readFile(path.join(output, file), 'utf8')])));
  return { output, result, documents };
}
async function fixtureRoot(change) {
  const sourceRoot = await tempRoot();
  const chapters = JSON.parse(JSON.stringify(catalogue)), guides = JSON.parse(JSON.stringify(study));
  change(chapters, guides);
  await fs.mkdir(path.join(sourceRoot, 'data'));
  await fs.writeFile(path.join(sourceRoot, 'data/surahs.js'), `globalThis.SURAHS=${JSON.stringify(chapters)};`);
  await fs.writeFile(path.join(sourceRoot, 'data/study.js'), `globalThis.STUDY=${JSON.stringify(guides)};`);
  return sourceRoot;
}

test.before(async () => {
  ({ generateSeoPages } = await import(pathToFileURL(path.join(root, 'scripts/seo-pages.mjs')).href));
  const context = vm.createContext({});
  vm.runInContext(await fs.readFile(path.join(root, 'data/surahs.js'), 'utf8'), context);
  vm.runInContext(await fs.readFile(path.join(root, 'data/study.js'), 'utf8'), context);
  catalogue = JSON.parse(JSON.stringify(context.SURAHS));
  study = JSON.parse(JSON.stringify(context.STUDY));
  production = await generate({ siteUrl: 'https://surah.example', analyticsEnabled: true });
});
test.after(async () => {
  const allowedParent = path.resolve(__dirname) + path.sep;
  for (const directory of temporaryRoots) {
    const absolute = path.resolve(directory);
    // Verify the recursive cleanup target stays within the test workspace.
    assert.ok(absolute.startsWith(allowedParent) && /^\.seo-test-/.test(path.basename(absolute)));
    const stat = await fs.lstat(absolute);
    assert.equal(stat.isSymbolicLink(), false);
    await fs.rm(absolute, { recursive: true, force: true });
  }
});

test('generates114 stable unique chapter routes plus directory/about/FAQ and factual llms resource', async () => {
  const { result, documents } = production;
  assert.equal(result.chapterCount, 114);assert.equal(result.ayahCount, 6236);
  assert.equal(result.files.length, 118);assert.equal(result.routes.length, 117);assert.equal(result.chapterRoutes.length, 114);
  assert.equal(new Set(result.files).size, 118);assert.equal(new Set(result.routes).size, 117);
  assert.deepEqual(result.resourceRoutes, ['/llms.txt']);
  assert.ok(documents.has('surahs/index.html'));assert.ok(documents.has('about/index.html'));assert.ok(documents.has('faq/index.html'));
  assert.equal(result.chapterRoutes[0], '/surahs/1-al-fatihah/');assert.equal(result.chapterRoutes[113], '/surahs/114-an-nas/');
  for (const [index, route] of result.chapterRoutes.entries()) {
    assert.match(route, new RegExp(`^/surahs/${index + 1}-[a-z0-9]+(?:-[a-z0-9]+)*/$`));
    assert.ok(documents.has(route.slice(1) + 'index.html'));
  }
  const llms = documents.get('llms.txt');assert.match(llms, /114 chapter records and 6,236 numbered ayahs/);assert.match(llms, /not the chapter verses or authoritative tafsir/);
  assert.equal((llms.match(/\]\(https:\/\/surah\.example\/surahs\/\d+-/g) || []).length, 114);
  assert.doesNotMatch(llms, /guarantee|ranking|rich results/i);
});

test('every chapter page preserves real metadata/editorial study aids and links to its actual sources and reader', () => {
  for (const chapter of catalogue) {
    const route = production.result.chapterRoutes[chapter.id - 1], html = production.documents.get(route.slice(1) + 'index.html'), visible = decode(html);
    assert.ok(visible.includes(`<h1>Surah ${chapter.transliteration}</h1>`));
    assert.ok(visible.includes(`<p class="arabic" lang="ar" dir="rtl">${chapter.name}</p>`));
    for (const text of [chapter.translation, chapter.overview, ...chapter.themes, ...study[chapter.id].readingGuide, ...study[chapter.id].reflectionPrompts]) assert.ok(visible.includes(text), `Surah ${chapter.id} should preserve its sourced editorial field: ${text}`);
    assert.ok(html.includes(`<dt>Numbered ayahs</dt><dd>${chapter.total_verses}</dd>`));
    assert.ok(html.includes(`<dt>Conventional revelation order</dt><dd>${chapter.revelation_order}</dd>`));
    assert.ok(html.includes(`href="/#reader/${chapter.id}/1"`));assert.ok(html.includes('href="/#mushaf"'));assert.ok(html.includes('href="/surahs/"'));
    assert.ok(html.includes(`href="https://quran.com/${chapter.id}"`));assert.match(html, /Tanzil Quran metadata reference/);
    assert.match(html, /Source: the local chapter catalogue and study guide/);assert.match(html, /not Quranic text, a verse translation or tafsir/);
    assert.match(html, /this profile does not reproduce the chapter verses/);
    assert.doesNotMatch(html, /data-ayah=|class="ayah-|بِسْمِ|datePublished|dateModified|aggregateRating|reviewRating|author_name|authorCredentials/);
    const schema = graph(html), profile = schema.find(item => item['@type'] === 'CreativeWork');
    assert.equal(profile.url, 'https://surah.example' + route);assert.equal(profile.about.url, `https://quran.com/${chapter.id}`);
    assert.ok(profile.citation.includes(`https://quran.com/${chapter.id}`));assert.equal(profile.about.alternateName, chapter.name);
    assert.equal(schema.find(item => item['@type'] === 'BreadcrumbList').itemListElement.length, 3);
  }
});

test('directory has114 crawlable chapter links and every chapter has correct previous/next links without wraparound', () => {
  const directory = production.documents.get('surahs/index.html');
  const links = [...directory.matchAll(/href="(\/surahs\/\d+-[a-z0-9-]+\/)"/g)].map(match => match[1]);
  assert.deepEqual(links, production.result.chapterRoutes);
  const list = graph(directory).find(item => item['@type'] === 'CollectionPage').mainEntity;
  assert.equal(list.numberOfItems, 114);assert.equal(list.itemListElement.length, 114);
  for (const [index, route] of production.result.chapterRoutes.entries()) {
    const html = production.documents.get(route.slice(1) + 'index.html'), pager = html.match(/<nav class="chapter-pager"[^>]*>([\s\S]*?)<\/nav>/)[1];
    if (index > 0) assert.ok(pager.includes(`href="${production.result.chapterRoutes[index - 1]}"`));
    else { assert.match(pager, /First Surah in chapter order/);assert.doesNotMatch(pager, /114-an-nas/); }
    if (index < 113) assert.ok(pager.includes(`href="${production.result.chapterRoutes[index + 1]}"`));
    else { assert.match(pager, /Last Surah in chapter order/);assert.doesNotMatch(pager, /1-al-fatihah/); }
  }
});

test('production metadata uses explicit canonical origin and consistent social preview without fabricated publisher/date/reviews', () => {
  for (const route of production.result.routes) {
    const html = production.documents.get(route.slice(1) + 'index.html');
    assert.ok(html.includes(`<link rel="canonical" href="https://surah.example${route}">`));
    assert.ok(html.includes(`<meta property="og:url" content="https://surah.example${route}">`));
    assert.match(html, /property="og:image" content="https:\/\/surah\.example\/assets\/social-preview\.png"/);
    assert.match(html, /property="og:image:width" content="1200"/);assert.match(html, /property="og:image:height" content="630"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /content="index, follow, max-image-preview:large"/);assert.match(html, /<script src="\/analytics\.js" defer><\/script>/);
    assert.doesNotMatch(html, /name="keywords"|\u2014|gradient\s*\(|datePublished|dateModified|aggregateRating|"publisher"|"author"/);
  }
});

test('FAQ structured questions and answers exactly match visible factual content', () => {
  const html = production.documents.get('faq/index.html');
  const entries = [...html.matchAll(/<section class="faq-item"[^>]*><h2 id="faq-\d+">([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/section>/g)].map(match => ({ question: decode(match[1]), answer: decode(match[2]) }));
  const faq = graph(html).find(item => item['@type'] === 'FAQPage');
  assert.ok(entries.length >= 10);assert.equal(faq.mainEntity.length, entries.length);
  assert.deepEqual(faq.mainEntity.map(item => ({ question: item.name, answer: item.acceptedAnswer.text })), entries);
  assert.match(html, /common Hafs\/Kufan numbering convention/);assert.match(html, /classified|classifications/);
  assert.doesNotMatch(html, /Google.*rich|rich results|ranking guarantee|guaranteed rankings/i);
});

test('About page states real source/availability limits and separates visit metrics from personal records', () => {
  const html = production.documents.get('about/index.html');
  for (const text of ['114 Surahs', '6,236 numbered ayahs', 'locally compiled', 'not Quranic text', 'not evidence that a provider has been checked', 'actual relevant packs', 'Vercel Web Analytics for visitor and pageview metrics', 'Personal notes and progress are not sent as custom analytics events.']) assert.ok(html.includes(text));
  assert.ok(html.includes('href="/data/SOURCES.md"'));assert.match(html, /does not claim religious authority/);
  const app = graph(html).find(item => item['@type'] === 'AboutPage').mainEntity;
  assert.equal(app['@type'], 'WebApplication');assert.equal(app.name, 'Surah Compass');assert.equal(app.applicationCategory, 'EducationalApplication');
  assert.doesNotMatch(html, /complete Quran.*bundled|verified offline tafsir|certified scholar|credentials|request_user_input|automatic approval|content-blocked/i);
});

test('preview without known canonical uses noindex,follow and relative assets without inventing a host', async () => {
  const preview = await generate({ siteUrl: '', preview: true });
  for (const route of preview.result.routes) {
    const html = preview.documents.get(route.slice(1) + 'index.html');
    assert.match(html, /name="robots" content="noindex, follow"/);assert.doesNotMatch(html, /rel="canonical"|property="og:url"/);
    assert.match(html, /property="og:image" content="\/assets\/social-preview\.png"/);assert.doesNotMatch(html, /<script src="\/analytics\.js"/);
    assert.doesNotMatch(html, /https?:\/\/localhost|example\.com|your-domain|SITE_URL/);
  }
  assert.match(preview.documents.get('about/index.html'), /Visit analytics is disabled in this build/);
  assert.match(preview.documents.get('llms.txt'), /\[All 114 Surahs\]\(\/surahs\/\)/);
});

test('invalid canonical URL never leaks credentials/query/basepath into generated metadata', async () => {
  const invalid = await generate({ siteUrl: 'https://private:secret@example.invalid/subpath/?key=hidden#private' });
  for (const route of invalid.result.routes) {
    const html = invalid.documents.get(route.slice(1) + 'index.html');
    assert.doesNotMatch(html, /rel="canonical"|property="og:url"|private:secret|example\.invalid|key=hidden|subpath/);
  }
});

test('HTML and JSON-LD escape editorial fixture content and discard unsafe configured reference URLs', async () => {
  const fixture = await fixtureRoot((chapters, guides) => {
    chapters[0].transliteration = 'Test </script><img src=x onerror=alert(1)>';
    chapters[0].overview = 'Editorial fixture <script>alert(1)</script> with a quoted "name".';
    guides[1].readingGuide[0] = 'Editorial fixture <img src=x onerror=alert(2)>.';
    guides[1].references.push({ label: 'Unsafe fixture', url: 'javascript:alert(1)', kind: 'quran' }, { label: 'Unrelated fixture', url: 'https://evil.invalid/1', kind: 'tafsir' });
  });
  const output = path.join(await tempRoot(), 'output'), result = await generateSeoPages({ root: fixture, output });
  const html = await fs.readFile(path.join(output, result.chapterRoutes[0].slice(1), 'index.html'), 'utf8');
  assert.match(html, /&lt;\/script&gt;&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /\\u003c\/script\\u003e\\u003cimg/);
  assert.match(html, /Editorial fixture &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<img src=x|<script>alert|javascript:|evil\.invalid|Unsafe fixture|Unrelated fixture/);
  assert.ok(graph(html).some(item => item['@type'] === 'CreativeWork'));
});

test('malformed catalogue or missing study guide fails before any output files are generated', async () => {
  const invalidCount = await fixtureRoot(chapters => { chapters[0].total_verses += 1; });
  const missingGuide = await fixtureRoot((chapters, guides) => { delete guides[114]; });
  for (const source of [invalidCount, missingGuide]) {
    const output = path.join(source, 'output');
    await assert.rejects(generateSeoPages({ root: source, output }), /6236|Missing editorial study guide/);
    await assert.rejects(fs.access(output), { code: 'ENOENT' });
  }
  await assert.rejects(generateSeoPages(), /requires root and output/);
});
