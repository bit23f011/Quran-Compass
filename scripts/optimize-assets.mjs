/* Rebuild the derived assets without changing the supplied source images.
 * Authoring only: use installed sharp, or set COMPASS_SHARP_PATH to its module.
 * The browser app and normal build require no sharp dependency. */
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {stat} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
let sharp;
try{sharp=require('sharp');}
catch{sharp=require(process.env.COMPASS_SHARP_PATH||'C:/Users/PMYLS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');}
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const asset=name=>path.join(root,'assets',name);

await sharp(asset('brand-logo.png')).resize(128,128,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png({compressionLevel:9,palette:true,colours:256}).toFile(asset('brand-mark.png'));
await sharp(asset('home-islamic-bg.png')).webp({quality:88,effort:6,smartSubsample:true}).toFile(asset('home-islamic-bg.webp'));

// All decoration and typography are native SVG shapes. Arabic calligraphy
// comes exclusively from the unchanged user-supplied transparent logo.
const card=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#e9e0cc"/>
  <rect x="800" width="400" height="630" fill="#204e57"/>
  <path d="M38 34h725M38 34v562M38 596h725" fill="none" stroke="#baad92" stroke-width="1"/>
  <path d="M816 25h360v580H816" fill="none" stroke="#987031" stroke-width="1.5"/>
  <path d="m80 75 8 8-8 8-8-8Z" fill="#987031"/>
  <text x="109" y="90" fill="#526066" font-family="Segoe UI,Arial,sans-serif" font-size="17" letter-spacing="2.4">A MOMENT WITH THE QURAN</text>
  <text x="75" y="269" fill="#204e57" font-family="Palatino Linotype,Book Antiqua,Georgia,serif" font-size="72">Surah Compass</text>
  <path d="M77 303h70" stroke="#987031" stroke-width="3"/>
  <text x="77" y="363" fill="#1c343b" font-family="Segoe UI,Arial,sans-serif" font-size="29">Explore all 114 Surahs of the Quran</text>
  <path d="M77 424h650" stroke="#baad92" stroke-width="1"/>
  <text x="77" y="474" fill="#526066" font-family="Segoe UI,Arial,sans-serif" font-size="22">Random Surah wheel · Reading · Reflection</text>
  <text x="77" y="558" fill="#987031" font-family="Segoe UI,Arial,sans-serif" font-size="16" letter-spacing="2.8">114 CHAPTERS. ENDLESS REFLECTION.</text>
  <circle cx="999" cy="276" r="166" fill="#e9e0cc"/>
  <path d="m999 488 7 13 15-3-3 15 13 7-13 7 3 15-15-3-7 13-7-13-15 3 3-15-13-7 13-7-3-15 15 3Z" fill="none" stroke="#c8ac72" stroke-width="1.5"/>
  <path d="m999 508 12 12-12 12-12-12Z" fill="none" stroke="#c8ac72" stroke-width="1.5"/>
</svg>`);
const logo=await sharp(asset('brand-logo.png')).resize(320,320,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
await sharp(card).composite([{input:logo,left:839,top:116}]).png({compressionLevel:9,palette:true,colours:256}).toFile(asset('social-preview.png'));

for(const name of ['brand-mark.png','home-islamic-bg.webp','social-preview.png']){
  const file=asset(name),metadata=await sharp(file).metadata();
  console.log(`${name}: ${metadata.width}×${metadata.height}, ${(await stat(file)).size} bytes`);
}
