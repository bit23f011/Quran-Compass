/* User-run optional text installer. Downloads data only, never executes upstream code. */
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const args={};
for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i];
  if(key==='--help'){console.log('Install all 114 Surahs:\n  npm run download-quran\n\nInstall previously downloaded Quran JSON editions without network:\n  node scripts/download-quran.mjs --english quran_en.json --urdu quran_ur.json\n\nLabel local editions with --en-source "Edition name" and --ur-source "Edition name".');process.exit(0);}
  if(!['--english','--urdu','--en-source','--ur-source'].includes(key)||!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw new Error(`Unknown or incomplete option: ${key}. Use --help.`);
  args[key]=process.argv[++i];
}
async function fetchData(url){const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error(`Download failed: ${response.status} ${url}`);if(Number(response.headers.get('content-length'))>128*1024*1024)throw new Error('The source package exceeds the size limit');return response;}
function entries(tar){const result=new Map();for(let offset=0;offset+512<=tar.length;){const header=tar.subarray(offset,offset+512);if(header.every(byte=>byte===0))break;const name=header.subarray(0,100).toString().replace(/\0.*$/s,'');const prefix=header.subarray(345,500).toString().replace(/\0.*$/s,'');const size=parseInt(header.subarray(124,136).toString().replace(/\0/g,'').trim(),8)||0;if(!Number.isSafeInteger(size)||size<0||offset+512+size>tar.length)throw new Error('Invalid package archive');const full=prefix?prefix+'/'+name:name;if(header[156]===0||header[156]===48)result.set(full,tar.subarray(offset+512,offset+512+size));offset+=512+Math.ceil(size/512)*512;}return result;}
try{
  if(Boolean(args['--english'])!==Boolean(args['--urdu']))throw new Error('Provide both --english and --urdu, or omit both for the official package download.');
  let meta={version:'local'},archive=new Map(),en,ur,localHashes={};
  const local=Boolean(args['--english']);
  if(local){
    console.log('Reading local Quran JSON editions. No network access is used.');
    const english=await readFile(path.resolve(args['--english'])),urdu=await readFile(path.resolve(args['--urdu']));
    if(english.length+urdu.length>25*1024*1024)throw new Error('The text editions exceed the 25 MB reading-pack limit.');
    en=JSON.parse(english.toString());ur=JSON.parse(urdu.toString());
    localHashes={englishSha256:createHash('sha256').update(english).digest('hex'),urduSha256:createHash('sha256').update(urdu).digest('hex')};
  }else{
  console.log('Downloading the official quran-json data package from npm…');
  meta=await(await fetchData('https://registry.npmjs.org/quran-json/latest')).json();
  if(meta.name!=='quran-json'||!meta.dist?.tarball)throw new Error('Unexpected source metadata');
  const tarURL=new URL(meta.dist.tarball);
  if(tarURL.protocol!=='https:'||tarURL.hostname!=='registry.npmjs.org'||!tarURL.pathname.startsWith('/quran-json/-/'))throw new Error('Unexpected package source');
  const compressed=Buffer.from(await(await fetchData(tarURL.href)).arrayBuffer());
  if(compressed.length>128*1024*1024)throw new Error('The compressed package exceeds the size limit');
  if(!meta.dist.integrity?.startsWith('sha512-'))throw new Error('Missing package integrity metadata');
  if('sha512-'+createHash('sha512').update(compressed).digest('base64')!==meta.dist.integrity)throw new Error('Package integrity check failed');
  archive=entries(gunzipSync(compressed,{maxOutputLength:256*1024*1024}));
  const english=archive.get('package/dist/quran_en.json'),urdu=archive.get('package/dist/quran_ur.json');
  if(!english||!urdu)throw new Error('The source package does not contain the expected English and Urdu editions');
  en=JSON.parse(english.toString());ur=JSON.parse(urdu.toString());
  }
  const context=vm.createContext({});vm.runInContext(await readFile(path.join(root,'data/surahs.js'),'utf8'),context);
  if(!Array.isArray(en)||!Array.isArray(ur)||en.length!==114||ur.length!==114)throw new Error('Expected 114 chapters in both editions');
  if(new Set(en.map(s=>s?.id)).size!==114||new Set(ur.map(s=>s?.id)).size!==114)throw new Error('Duplicate chapter IDs in the source editions');
  const chapters={};let count=0;
  for(const s of context.SURAHS){const e=en.find(c=>c?.id===s.id),u=ur.find(c=>c?.id===s.id);if(e?.verses?.length!==s.total_verses||u?.verses?.length!==s.total_verses)throw new Error(`Incomplete chapter ${s.id}`);chapters[s.id]=e.verses.map((v,i)=>{const uv=u.verses[i];if(!v||!uv||v.id!==i+1||uv.id!==v.id||typeof v.text!=='string'||!/[\u0621-\u064a]/.test(v.text)||v.text!==uv.text||typeof v.translation!=='string'||!v.translation.trim()||typeof uv.translation!=='string'||!uv.translation.trim()||[v.text,v.translation,uv.translation].some(text=>text.length>20000))throw new Error(`Verse/source mismatch: ${s.id}:${i+1}`);count++;return{id:v.id,text:v.text,translation_en:v.translation,translation_ur:uv.translation};});}
  if(count!==6236)throw new Error('Expected 6,236 numbered ayahs');
  const sources=local?{arabic:'User-provided Arabic Quran text',en:args['--en-source']||'User-provided English translation (edition unspecified)',ur:args['--ur-source']||'User-provided Urdu translation (edition unspecified)'}:{arabic:`Quran JSON ${meta.version} · Arabic text`,en:'Sahih International · English translation',ur:'Fateh Muhammad Jalandhry · Urdu translation',url:'https://github.com/risan/quran-json',package:meta.version};
  const pack={format:'surah-compass-quran-v1',sources,chapters};
  await writeFile(path.join(root,'data/quran.js'),`/* Arabic Quran and translations, preserved verbatim. See SOURCES.md and upstream-attribution.json. */\nglobalThis.QURAN_SOURCES = ${JSON.stringify(sources)};\nglobalThis.QURAN = ${JSON.stringify(chapters)};\n`);
  await writeFile(path.join(root,'data/quran-pack.json'),JSON.stringify(pack));
  const attribution=local?{source:'Local Quran JSON editions supplied by the user',...localHashes,note:'The importer verifies structural completeness and identical Arabic across editions. It does not authenticate the supplied translation authors or their content license.'}:{name:meta.name,version:meta.version,license:meta.license,repository:meta.repository,integrity:meta.dist.integrity,source:sources.url,note:'Retain upstream content attribution and license terms; package-code license does not necessarily cover translations.'};
  attribution.chapterCount=114;attribution.ayahCount=count;
  for(const [name,buffer] of archive)if(/^package\/(LICENSE[^/]*|README\.md)$/i.test(name))attribution[name.slice(8)]=buffer.toString();
  await writeFile(path.join(root,'data/upstream-attribution.json'),JSON.stringify(attribution,null,2));
  console.log(`Ready: all 114 Surahs, ${count} Arabic ayahs, and complete English/Urdu translations.\nRestart the app and run npm run build before deploying.\nYou can also import data/quran-pack.json into an already installed app.`);
}catch(error){const cause=error.cause?.code||error.cause?.message;console.error(`The Quran text pack was not installed: ${error.message}${cause?` (${cause})`:''}\nThe existing offline catalogue/text pack remains available.\nIf your network blocks the source, download quran_en.json and quran_ur.json from the official Quran JSON distribution on an allowed connection, then use --english and --urdu to install them locally. Use --help for details.`);process.exitCode=1;}
