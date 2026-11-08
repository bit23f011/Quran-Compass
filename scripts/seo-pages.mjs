import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const APP_NAME = 'Surah Compass';
const SOCIAL_IMAGE = '/assets/social-preview.png';
const APP_DESCRIPTION = 'Explore all 114 Quran Surahs with a repeat-free discovery wheel, chapter guides and a reader for separately loaded, attributed Quran editions.';
const SOURCES = [
  { name: 'Quran.com chapter catalogue, Arabic text and translations', url: 'https://quran.com/' },
  { name: 'Tanzil Quran metadata reference', url: 'https://tanzil.net/docs/quran_metadata' },
  { name: 'Risan Quran JSON source project', url: 'https://github.com/risan/quran-json' }
];
const FAQS = [
  ['How many Surahs are in the Quran?', 'The Quran has 114 Surahs, or chapters. Surah Compass lists all 114 in the conventional chapter order.'],
  ['How many numbered ayahs does this catalogue contain?', 'The catalogue totals 6,236 numbered ayahs using the common Hafs/Kufan numbering convention. Other verse-numbering traditions can use different totals.'],
  ['What is the difference between a Surah and an ayah?', 'A Surah is a chapter of the Quran. An ayah is a numbered verse within a chapter.'],
  ['Which Surahs are first and last?', 'Al-Fatihah is chapter 1, the first Surah in the conventional order. An-Nas is chapter 114, the last Surah in that order.'],
  ['What does Juz mean in the chapter directory?', 'The Quran is divided into 30 juz for reading. A chapter can cover one or several of these divisions. The directory gives the range of juz covered by each Surah.'],
  ['Are revelation classifications and revelation order undisputed?', 'No. The Meccan/Medinan labels and revelation order shown here follow a conventional catalogue. Some chapter classifications and ordering differ between scholarly traditions; they are not historical dates.'],
  ['Can the wheel select the same Surah twice in one cycle?', 'Each of the 114 Surahs is selected at most once in a discovery cycle. After all 114 have been selected, a new cycle can begin. Reset starts the cycle again. Filters narrow the eligible remaining chapters without restarting a partly finished cycle.'],
  ['Does a random spin provide a religious ruling or prescribed recitation?', 'The wheel is a navigation and discovery tool. Its random selection does not establish a religious ruling, a spiritual sign or a prescribed recitation.'],
  ['Are the chapter introductions Quran translations or tafsir?', 'No. Overviews, themes, reading guides and reflection prompts are locally compiled editorial reading aids. They are not Quranic text, verse translations, comprehensive tafsir or statements of special spiritual benefits.'],
  ['Can I use Surah Compass offline?', 'The app shell, chapter catalogue and saved device progress can work offline after caching. Arabic text, translations, commentary and audio require the actual relevant content to be saved on the device. External source links require an internet connection.'],
  ['Can I install the site as an app?', 'The site provides a web app manifest and service worker. Supported browsers can offer installation on HTTPS or localhost. Installation options vary by browser and device.'],
  ['Why might a translation, reciter or tafsir reference be unavailable?', 'A configured reference is not evidence that its source has been checked or its content downloaded. Use the reader source controls to load an available attributed edition. Translations render meanings; they are not the Arabic Quran itself.'],
  ['Are reader pages identical to a printed Mushaf edition?', 'No. Pages mode groups authentic loaded ayahs into pages calculated for this reader. Those divisions do not reproduce the layout of a particular printed Mushaf. The Surahs book is a chapter directory; Quran verses belong in the reader.'],
  ['Does opening or listening to a Surah mark it as read?', 'No. Discovery, reading and memorization are separate records. Opening or listening to a chapter does not count it as read; use the explicit reading controls.'],
  ['Where are my personal notes and progress stored?', 'By default, personal notes and progress are stored in the browser on your device. Local backup and restore controls are available. Manual cloud backup is optional and requires a configured account connection; it is separate from visit analytics.']
].map(([question, answer], index) => ({ question, answer, id: `faq-${index + 1}` }));

const CSS = `
:root{color-scheme:light dark;--bg:#e9e1d0;--paper:#f7f1e4;--ink:#27382e;--muted:#5e675c;--line:#c6b996;--green:#224d3b;--gold:#9e7e3f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.75 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--green);text-underline-offset:3px}a:focus-visible{outline:3px solid var(--gold);outline-offset:5px}img{max-width:100%}.header{position:sticky;top:0;z-index:2;background:var(--paper);border-bottom:1px solid var(--line)}.header-inner{max-width:1120px;margin:auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{display:flex;align-items:center;gap:10px;font:25px/1.2 Georgia,serif;color:var(--ink);text-decoration:none}.brand img{width:39px;height:39px}.nav{display:flex;gap:22px;flex-wrap:wrap}.nav a{font-size:15px;text-decoration:none}.nav a:hover{text-decoration:underline}main{max-width:1050px;margin:auto;padding:24px 24px 44px}.breadcrumbs ol{display:flex;gap:9px;flex-wrap:wrap;list-style:none;margin:0 0 28px;padding:0;font-size:14px;color:var(--muted)}.breadcrumbs li+li:before{content:'/';margin-right:9px;color:var(--gold)}.eyebrow{text-transform:uppercase;letter-spacing:1.7px;font-size:12px;color:var(--muted);margin:0 0 6px}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;font-weight:400;line-height:1.3}h1{font-size:clamp(33px,5vw,49px);margin:0 0 16px}h2{font-size:28px;margin:0 0 13px}h3{font-size:22px;margin:0 0 12px}p{margin:0 0 17px}.lead{font-size:19px;max-width:820px}.arabic{font-family:"Amiri","Noto Naskh Arabic","Traditional Arabic",serif;font-size:44px;line-height:1.9;margin:5px 0 14px;text-align:start;color:var(--green)}.card{background:var(--paper);border:1px solid var(--line);border-radius:7px;padding:25px;margin:25px 0}.source-note{font-size:15px;color:var(--muted)}.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:19px;margin:25px 0}.facts div{border-top:1px solid var(--line);padding-top:11px}.facts dt{font-size:14px;color:var(--muted)}.facts dd{margin:5px 0 0;font:23px/1.4 Georgia,serif}.actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:24px 0}.button{display:inline-block;background:var(--green);color:var(--paper);border:1px solid var(--green);border-radius:4px;padding:10px 18px;text-decoration:none}.button.secondary{background:var(--paper);color:var(--green)}ul,ol{padding-left:25px}li{margin-bottom:7px}.themes{display:flex;gap:10px;flex-wrap:wrap;padding:0;list-style:none}.themes li{border:1px solid var(--line);border-radius:3px;padding:5px 10px;font-size:15px}.chapter-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;list-style:none;padding:0}.chapter-grid>li{margin:0}.chapter-link{display:block;height:100%;padding:18px;background:var(--paper);border:1px solid var(--line);border-radius:5px;text-decoration:none}.chapter-link:hover{border-color:var(--gold)}.chapter-link strong{display:block;font:22px/1.4 Georgia,serif;font-weight:400}.chapter-link .arabic{font-size:29px;margin:9px 0;line-height:1.6}.chapter-link small{display:block;color:var(--muted);font-size:14px}.chapter-pager{display:grid;grid-template-columns:1fr 1fr;gap:18px;border-block:1px solid var(--line);padding:20px 0;margin-top:28px}.chapter-pager a{display:block;text-decoration:none}.chapter-pager small{display:block;color:var(--muted);font-size:14px}.chapter-pager .next{text-align:right}.faq-item{border-top:1px solid var(--line);padding:23px 0}.faq-item h2{font-size:25px}.footer{border-top:1px solid var(--line);padding:17px 24px;font-size:14px;color:var(--muted);text-align:center}.footer a{white-space:nowrap}.reference-list a{overflow-wrap:anywhere}.no-script{font-size:15px;color:var(--muted)}
@media(max-width:760px){.chapter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.facts{grid-template-columns:repeat(2,minmax(0,1fr))}.header-inner{flex-wrap:wrap}.nav{gap:17px}.brand{font-size:23px}}
@media(max-width:460px){body{font-size:16px}.header-inner{padding:12px 17px}.nav{width:100%;justify-content:space-between;gap:10px}.nav a{font-size:14px}main{padding:21px 17px 34px}.card{padding:20px 17px}.lead{font-size:18px}.chapter-grid{grid-template-columns:1fr}.arabic{font-size:39px}.facts{gap:15px}.facts dd{font-size:21px}h2{font-size:25px}.chapter-pager{gap:14px}.footer{font-size:12px;padding:15px 10px}}
@media(prefers-color-scheme:dark){:root{--bg:#182723;--paper:#21362e;--ink:#eee5ce;--muted:#c0c6b7;--line:#56624d;--green:#d3e0bc;--gold:#c9ad6d}.button{background:#d3e0bc;color:#182723}}
`;

const text = value => String(value).replace(/\u2014/g, ', ');
const escape = value => text(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const json = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
const slug = name => text(name).normalize('NFKD').replace(/[\u0300-\u036f'’`]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function siteOrigin(siteUrl) {
  if (typeof siteUrl !== 'string' || !siteUrl.trim()) return '';
  try {
    const url = new URL(siteUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') return '';
    return url.origin;
  } catch { return ''; }
}

async function loadCatalogue(root) {
  const filenames = ['data/surahs.js', 'data/study.js'];
  const scripts = await Promise.all(filenames.map(file => readFile(path.join(root, file), 'utf8')));
  const context = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } });
  scripts.forEach((source, index) => new vm.Script(source, { filename: filenames[index] }).runInContext(context, { timeout: 1000 }));
  const chapters = JSON.parse(JSON.stringify(context.SURAHS || null));
  const study = JSON.parse(JSON.stringify(context.STUDY || null));
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  if (!Array.isArray(chapters) || chapters.length !== 114 || chapters.reduce((sum, chapter) => sum + chapter.total_verses, 0) !== 6236) throw new Error('SEO pages require the complete 114-Surah, 6236-ayah catalogue.');
  for (let index = 0; index < chapters.length; index++) {
    const chapter = chapters[index], guide = study?.[chapter.id];
    if (chapter.id !== index + 1 || !['name', 'transliteration', 'translation', 'overview'].every(key => nonempty(chapter[key])) || !Number.isInteger(chapter.total_verses) || chapter.total_verses < 1 || !['meccan', 'medinan'].includes(chapter.type) || !Number.isInteger(chapter.revelation_order) || chapter.revelation_order < 1 || chapter.revelation_order > 114 || !Array.isArray(chapter.juz) || chapter.juz.length !== 2 || !chapter.juz.every(juz => Number.isInteger(juz) && juz >= 1 && juz <= 30) || chapter.juz[0] > chapter.juz[1] || !Array.isArray(chapter.themes) || !chapter.themes.length || !chapter.themes.every(nonempty)) throw new Error(`Invalid metadata for Surah ${index + 1}.`);
    if (!guide || guide.id !== chapter.id || !nonempty(guide.introduction) || !Array.isArray(guide.readingGuide) || !guide.readingGuide.length || !guide.readingGuide.every(nonempty) || !Array.isArray(guide.reflectionPrompts) || !guide.reflectionPrompts.length || !guide.reflectionPrompts.every(nonempty) || !Array.isArray(guide.references)) throw new Error(`Missing editorial study guide for Surah ${chapter.id}.`);
    chapter.slug = slug(chapter.transliteration);
    if (!chapter.slug) throw new Error(`Missing route slug for Surah ${chapter.id}.`);
    chapter.route = `/surahs/${chapter.id}-${chapter.slug}/`;
    chapter.file = chapter.route.slice(1) + 'index.html';
  }
  return { chapters, study };
}

function referenceUrl(reference, chapterId) {
  try {
    const url = new URL(reference.url);
    return url.protocol === 'https:' && url.hostname === 'quran.com' && !url.username && !url.password && !url.search && !url.hash && (url.pathname === `/${chapterId}` || url.pathname.startsWith(`/${chapterId}/`)) ? url.href : '';
  } catch { return ''; }
}

function breadcrumb(items, absolute) {
  return {
    visible: `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map(item => `<li>${item.href ? `<a href="${escape(item.href)}">${escape(item.name)}</a>` : escape(item.name)}</li>`).join('')}</ol></nav>`,
    schema: { '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: text(item.name), ...(item.href ? { item: absolute(item.href) } : {}) })) }
  };
}

function document({ title, description, route, body, graph, origin, preview, analyticsEnabled }) {
  const canonical = origin ? origin + route : '';
  const image = origin + SOCIAL_IMAGE;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title><meta name="description" content="${escape(description)}">
<meta name="robots" content="${preview ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
${canonical ? `<link rel="canonical" href="${escape(canonical)}">` : ''}
<meta property="og:type" content="website"><meta property="og:site_name" content="${APP_NAME}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
${canonical ? `<meta property="og:url" content="${escape(canonical)}">` : ''}
<meta property="og:image" content="${escape(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Surah Compass Quran discovery and reading app">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(image)}"><meta name="twitter:image:alt" content="Surah Compass Quran discovery and reading app">
<meta name="theme-color" content="#224d3b"><link rel="icon" href="/assets/favicon.png"><link rel="manifest" href="/manifest.webmanifest">
<style>${CSS}</style>
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>
${analyticsEnabled ? '<script src="/analytics.js" defer></script>' : ''}
</head><body>
<header class="header"><div class="header-inner"><a class="brand" href="/"><img src="/assets/icon-192.png" width="39" height="39" alt="">Surah Compass</a><nav class="nav" aria-label="Main navigation"><a href="/#mushaf">Surah book</a><a href="/surahs/">All Surahs</a><a href="/faq/">FAQ</a><a href="/about/">About &amp; sources</a></nav></div></header>
<main>${body}</main>
<footer class="footer">Made with VibeCoding · <a href="/about/#offline">Offline ready</a> · <a href="/about/">About &amp; sources</a></footer>
</body></html>\n`;
}

function chapterPage(chapter, guide, chapters, options) {
  const absolute = route => options.origin + route;
  const crumbs = breadcrumb([{ name: APP_NAME, href: '/' }, { name: 'All Surahs', href: '/surahs/' }, { name: chapter.transliteration }], absolute);
  const classification = chapter.type === 'medinan' ? 'Medinan' : 'Meccan';
  const juz = chapter.juz[0] === chapter.juz[1] ? String(chapter.juz[0]) : `${chapter.juz[0]} to ${chapter.juz[1]}`;
  const description = `${chapter.transliteration} is Surah ${chapter.id} of the Quran with ${chapter.total_verses} numbered ayahs. Explore its name meaning, Juz, conventional classification and editorial overview.`;
  const primarySource = `https://quran.com/${chapter.id}`;
  const references = guide.references.map(reference => ({ ...reference, url: referenceUrl(reference, chapter.id) })).filter(reference => reference.url && reference.url !== primarySource);
  const previous = chapters[chapter.id - 2], next = chapters[chapter.id];
  const body = `${crumbs.visible}
<p class="eyebrow">Chapter ${chapter.id} of 114</p><h1>Surah ${escape(chapter.transliteration)}</h1>
<p class="arabic" lang="ar" dir="rtl">${escape(chapter.name)}</p><p class="lead"><strong>English name meaning:</strong> ${escape(chapter.translation)}</p>
<dl class="facts"><div><dt>Chapter number</dt><dd>${chapter.id}</dd></div><div><dt>Numbered ayahs</dt><dd>${chapter.total_verses}</dd></div><div><dt>Conventional classification</dt><dd>${classification}</dd></div><div><dt>Juz range</dt><dd>${juz}</dd></div><div><dt>Conventional revelation order</dt><dd>${chapter.revelation_order}</dd></div><div><dt>Numbering convention</dt><dd>Hafs/Kufan</dd></div></dl>
<p class="source-note">Metadata source: the locally compiled Surah catalogue. Classification and revelation order can vary between scholarly traditions. <a href="/about/#catalogue">See catalogue sources and limitations</a>.</p>
<div class="actions"><a class="button" href="/#reader/${chapter.id}/1">Open Surah ${escape(chapter.transliteration)} in the reader</a><a class="button secondary" href="/#mushaf">Explore the Surah book</a></div>
<section class="card" aria-labelledby="overview"><h2 id="overview">Editorial overview</h2><p class="source-note">Source: the local chapter catalogue and study guide. This introduction is a reading aid, not Quranic text, a verse translation or tafsir.</p><p>${escape(chapter.overview)}</p><h3>Key themes</h3><ul class="themes">${chapter.themes.map(theme => `<li>${escape(theme)}</li>`).join('')}</ul></section>
<section class="card" aria-labelledby="reading-guide"><h2 id="reading-guide">Editorial reading guide</h2><ol>${guide.readingGuide.map(item => `<li>${escape(item)}</li>`).join('')}</ol><h3>Personal reflection prompts</h3><ul>${guide.reflectionPrompts.map(prompt => `<li>${escape(prompt)}</li>`).join('')}</ul><p class="source-note">These prompts support personal reflection. Consult the actual chapter and a qualified commentary for interpretation; no special spiritual benefit is asserted here.</p></section>
<section class="card" aria-labelledby="sources"><h2 id="sources">Read the chapter and consult sources</h2><ul class="reference-list"><li><a href="${primarySource}" rel="noopener noreferrer">Quran.com: Surah ${escape(chapter.transliteration)}, Arabic text and translations</a></li>${references.map(reference => `<li><a href="${escape(reference.url)}" rel="noopener noreferrer">${escape(reference.label)}</a> <span class="source-note">(configured online ${reference.kind === 'tafsir' ? 'commentary' : 'source'} reference)</span></li>`).join('')}<li><a href="https://tanzil.net/docs/quran_metadata" rel="noopener noreferrer">Tanzil Quran metadata reference</a></li></ul><p class="source-note">External references require an internet connection. A configured link is not a downloaded or independently verified commentary pack. The reader displays verses, translations and audio only when their attributed source content has been loaded; this profile does not reproduce the chapter verses.</p></section>
<nav class="chapter-pager" aria-label="Previous and next Surahs"><div>${previous ? `<a href="${previous.route}"><small>Previous Surah · ${previous.id}</small>${escape(previous.transliteration)}</a>` : '<span class="source-note">First Surah in chapter order</span>'}</div><div class="next">${next ? `<a href="${next.route}"><small>Next Surah · ${next.id}</small>${escape(next.transliteration)}</a>` : '<span class="source-note">Last Surah in chapter order</span>'}</div></nav><p class="actions"><a href="/surahs/">View all 114 Surahs</a><a href="/faq/">Reading and app questions</a></p>`;
  const schema = { '@type': 'CreativeWork', name: `${chapter.transliteration}: editorial chapter profile`, url: absolute(chapter.route), description: text(description), inLanguage: ['en', 'ar'], about: { '@type': 'CreativeWork', name: `Surah ${text(chapter.transliteration)}`, alternateName: text(chapter.name), url: primarySource, isPartOf: { '@type': 'CreativeWork', name: 'The Quran', url: 'https://quran.com/' } }, citation: [primarySource, ...references.map(reference => reference.url), 'https://tanzil.net/docs/quran_metadata'] };
  return { route: chapter.route, file: chapter.file, html: document({ ...options, title: `Surah ${chapter.transliteration}: ${chapter.total_verses} Ayahs, Meaning and Overview | ${APP_NAME}`, description, route: chapter.route, body, graph: [schema, crumbs.schema] }) };
}

function directoryPage(chapters, options) {
  const route = '/surahs/', absolute = route => options.origin + route;
  const crumbs = breadcrumb([{ name: APP_NAME, href: '/' }, { name: 'All Surahs' }], absolute);
  const description = 'Browse all 114 Quran Surahs in chapter order, with Arabic names, English name meanings, ayah counts, Juz ranges and source-labelled editorial chapter guides.';
  const body = `${crumbs.visible}<p class="eyebrow">The Quran chapter directory</p><h1>All 114 Surahs of the Quran</h1><p class="lead">Browse every chapter in conventional Quran order. Each profile gives its Arabic name, English name meaning, numbered ayah count, Juz range and a clearly labelled editorial introduction.</p><p>The catalogue totals <strong>6,236 numbered ayahs</strong> in the common Hafs/Kufan convention. Revelation classifications and order follow a conventional catalogue and can differ between scholarly traditions. <a href="/about/#catalogue">Read the source notes</a>.</p><div class="actions"><a class="button" href="/#mushaf">Open the Surah book</a><a class="button secondary" href="/#reader/1/1">Open the reader</a></div><ol class="chapter-grid">${chapters.map(chapter => `<li><a class="chapter-link" href="${chapter.route}"><strong>${chapter.id}. ${escape(chapter.transliteration)}</strong><span class="arabic" lang="ar" dir="rtl">${escape(chapter.name)}</span><small>${escape(chapter.translation)}</small><small>${chapter.total_verses} ayahs · ${chapter.type === 'medinan' ? 'Medinan' : 'Meccan'} · Juz ${chapter.juz[0] === chapter.juz[1] ? chapter.juz[0] : `${chapter.juz[0]} to ${chapter.juz[1]}`}</small></a></li>`).join('')}</ol><p class="source-note">These are chapter profiles and reading aids. They do not substitute for the Quran text, translations of its meanings or qualified commentary. <a href="/faq/">See common questions</a>.</p>`;
  const schema = { '@type': 'CollectionPage', name: 'All 114 Surahs of the Quran', url: absolute(route), description, mainEntity: { '@type': 'ItemList', numberOfItems: 114, itemListOrder: 'https://schema.org/ItemListOrderAscending', itemListElement: chapters.map(chapter => ({ '@type': 'ListItem', position: chapter.id, name: text(chapter.transliteration), url: absolute(chapter.route) })) } };
  return { route, file: 'surahs/index.html', html: document({ ...options, title: `All 114 Quran Surahs: Names, Ayah Counts and Chapter Guides | ${APP_NAME}`, description, route, body, graph: [schema, crumbs.schema] }) };
}

function aboutPage(options) {
  const route = '/about/', absolute = route => options.origin + route;
  const crumbs = breadcrumb([{ name: APP_NAME, href: '/' }, { name: 'About and sources' }], absolute);
  const description = 'Learn what Surah Compass provides, where its Quran metadata and content references come from, and how editorial guides, offline content and visit analytics are handled.';
  const body = `${crumbs.visible}<p class="eyebrow">About &amp; sources</p><h1>About Surah Compass</h1><p class="lead">${APP_DESCRIPTION}</p><p>The app helps you navigate, read and keep personal study records. It does not claim religious authority, prescribe particular recitations or provide personalized religious rulings.</p>
<section class="card" aria-labelledby="catalogue"><h2 id="catalogue">Chapter catalogue and numbering</h2><p>The locally compiled catalogue contains all <strong>114 Surahs</strong> and totals <strong>6,236 numbered ayahs</strong> using the common Hafs/Kufan numbering convention. Each record includes the Arabic name, conventional English transliteration and name meaning, ayah count, Juz range, conventional Meccan/Medinan classification and revelation order.</p><p>Structural checks confirm chapter IDs, counts and the catalogue total. They do not independently authenticate every source text or establish historical revelation dates. Some classifications and revelation orders differ between scholarly traditions.</p><h3>Reference sources</h3><ul class="reference-list">${SOURCES.map(source => `<li><a href="${source.url}" rel="noopener noreferrer">${source.name}</a></li>`).join('')}<li><a href="/data/SOURCES.md">Local data provenance and content attribution notes</a></li></ul></section>
<section class="card" aria-labelledby="editorial"><h2 id="editorial">Editorial introductions and study aids</h2><p>Chapter overviews, themes, general reading guides and reflection prompts come from the local catalogue and study files. They are editorial navigation aids, not Quranic text, verse translations, comprehensive tafsir, hadith or claims of special spiritual benefits.</p><p>Chapter pages distinguish these introductions from their external source references. Consult the actual chapter and qualified commentary before drawing a detailed interpretation.</p></section>
<section class="card" aria-labelledby="content"><h2 id="content">Arabic text, translations, recitation and commentary</h2><p>The reader uses separately loaded, attributed source editions. The Quran JSON project is a configured text-import source; EveryAyah, AlQuran.Cloud and Quran.com provide configured recitation, translation or commentary references. Availability and terms depend on the source. A configured reference is not evidence that a provider has been checked or its content downloaded.</p><p>Arabic Quran text must be preserved from the source. Translations render meanings and are not the Arabic Quran itself. No Quran, tafsir, narration occasion or word-by-word content is generated to fill missing source material. Each loaded edition should retain its source and author attribution.</p><ul class="reference-list"><li><a href="https://everyayah.com/" rel="noopener noreferrer">EveryAyah recitation source</a></li><li><a href="https://alquran.cloud/" rel="noopener noreferrer">AlQuran.Cloud edition source</a></li><li><a href="https://quran.com/" rel="noopener noreferrer">Quran.com text and commentary references</a></li></ul></section>
<section class="card" aria-labelledby="offline"><h2 id="offline">Offline use and installation</h2><p>The app shell, catalogue and device progress can work offline once cached. Arabic text, translations, commentary and audio require their actual relevant packs to be available on the device. Saving a reference URL does not download an audio file. External source pages need an internet connection.</p><p>Supported browsers can install the web app on HTTPS or localhost. Installation, cache storage and available space vary by browser and device. Reader Pages mode calculates its own page divisions; it does not reproduce a particular printed Mushaf layout.</p></section>
<section class="card" aria-labelledby="privacy"><h2 id="privacy">Personal records and visit analytics</h2><p>Personal notes, bookmarks, reading progress and memorization records are stored in browser storage on your device by default. Use local backup controls to preserve them. Optional manual cloud backup requires a configured account connection and an explicit user action.</p><p>${options.analyticsEnabled ? 'Hosted visits use Vercel Web Analytics for visitor and pageview metrics. Personal notes and progress are not sent as custom analytics events.' : 'Visit analytics is disabled in this build. Hosted deployments can optionally enable Vercel Web Analytics for visitor and pageview metrics. Personal notes and progress are not sent as custom analytics events.'}</p></section>
<div class="actions"><a class="button" href="/surahs/">Browse all Surahs</a><a class="button secondary" href="/faq/">Read common questions</a></div>`;
  const app = { '@type': 'WebApplication', name: APP_NAME, url: absolute('/'), description: APP_DESCRIPTION, applicationCategory: 'EducationalApplication', operatingSystem: 'Web browser', browserRequirements: 'JavaScript for the interactive app; supported HTTPS or localhost browsers for installation and offline caching.', featureList: ['A discovery cycle covering all 114 Surahs without repeats', 'Source-labelled chapter introductions and study references', 'Reader support for separately loaded attributed Quran editions', 'Local bookmarks, notes, reading and memorization records'] };
  return { route, file: 'about/index.html', html: document({ ...options, title: `About, Quran Sources and Offline Content | ${APP_NAME}`, description, route, body, graph: [{ '@type': 'AboutPage', name: `About ${APP_NAME}`, url: absolute(route), description, mainEntity: app }, crumbs.schema] }) };
}

function faqPage(options) {
  const route = '/faq/', absolute = route => options.origin + route;
  const crumbs = breadcrumb([{ name: APP_NAME, href: '/' }, { name: 'Common questions' }], absolute);
  const description = 'Answers about the 114 Quran Surahs, 6,236-ayah numbering convention, discovery cycles, chapter guides, source editions, offline reading and installation.';
  const body = `${crumbs.visible}<p class="eyebrow">Common questions</p><h1>Quran directory and app questions</h1><p class="lead">Concise answers about the chapter catalogue and how Surah Compass works. <a href="/about/">Read the sources and limitations</a> or <a href="/surahs/">browse every Surah</a>.</p>${FAQS.map(faq => `<section class="faq-item" aria-labelledby="${faq.id}"><h2 id="${faq.id}">${escape(faq.question)}</h2><p>${escape(faq.answer)}</p></section>`).join('')}<p class="source-note">Catalogue reference: <a href="https://tanzil.net/docs/quran_metadata" rel="noopener noreferrer">Tanzil Quran metadata</a> and <a href="https://quran.com/" rel="noopener noreferrer">Quran.com</a>. The app's local provenance notes are available from <a href="/about/#catalogue">About and sources</a>.</p>`;
  const schema = { '@type': 'FAQPage', name: 'Quran directory and app questions', url: absolute(route), mainEntity: FAQS.map(faq => ({ '@type': 'Question', name: text(faq.question), acceptedAnswer: { '@type': 'Answer', text: text(faq.answer) } })) };
  return { route, file: 'faq/index.html', html: document({ ...options, title: `Quran Surah and Offline App FAQ | ${APP_NAME}`, description, route, body, graph: [schema, crumbs.schema] }) };
}

function llmsText(chapters, origin) {
  const link = route => origin + route;
  return `# Surah Compass

Surah Compass is a Quran discovery and reading web app. The directory has 114 chapter records and 6,236 numbered ayahs in the common Hafs/Kufan convention. Chapter profiles contain metadata and explicitly labelled editorial reading aids, not the chapter verses or authoritative tafsir. The interactive reader uses separately loaded, attributed source editions. Offline use depends on actual cached app and content files.

## Site pages
- [Interactive app](${link('/')})
- [All 114 Surahs](${link('/surahs/')})
- [About, sources and limitations](${link('/about/')})
- [Visible product and Quran directory FAQ](${link('/faq/')})

## Source references
${SOURCES.map(source => `- [${source.name}](${source.url})`).join('\n')}

Revelation classifications and order follow a conventional catalogue and can vary between scholarly traditions. Editorial overviews, themes and prompts are local reading aids. Configured external references do not imply verified availability or offline downloads.

## Chapter profiles in conventional order
${chapters.map(chapter => `- [${chapter.id}. ${text(chapter.transliteration)}: ${text(chapter.translation)}](${link(chapter.route)})`).join('\n')}
`;
}

/** Generate source-labelled static HTML pages. No network access or Quran verse synthesis. */
export async function generateSeoPages({ root, output, siteUrl = '', preview = false, analyticsEnabled = false } = {}) {
  if (typeof root !== 'string' || !root.trim() || typeof output !== 'string' || !output.trim()) throw new TypeError('generateSeoPages requires root and output directories.');
  const sourceRoot = path.resolve(root), destination = path.resolve(output);
  const { chapters, study } = await loadCatalogue(sourceRoot);
  const options = { origin: siteOrigin(siteUrl), preview: preview === true, analyticsEnabled: analyticsEnabled === true };
  const pages = [directoryPage(chapters, options), ...chapters.map(chapter => chapterPage(chapter, study[chapter.id], chapters, options)), aboutPage(options), faqPage(options)];
  await Promise.all(pages.map(async page => {
    const target = path.join(destination, page.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, page.html, 'utf8');
  }));
  await writeFile(path.join(destination, 'llms.txt'), llmsText(chapters, options.origin), 'utf8');
  return { files: [...pages.map(page => page.file), 'llms.txt'], routes: pages.map(page => page.route), chapterRoutes: chapters.map(chapter => chapter.route), resourceRoutes: ['/llms.txt'], chapterCount: 114, ayahCount: 6236 };
}
