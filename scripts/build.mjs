import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const output=path.join(root,'dist');
const files=['index.html','styles.css','system.css','reader.css','learning.css','visual.css','mushaf.css','core.js','store.js','app.js','reader.js','learning.js','mushaf.js','content.js','sync.js','config.js','sw.js','manifest.webmanifest','assets/icon.svg','assets/icon-192.png','assets/icon-512.png','assets/home-islamic-bg.png','assets/book-cover-photo.jpg','assets/rehal-photo.png','data/surahs.js','data/quran.js','data/study.js','data/editions.js','data/SOURCES.md'];
files.splice(files.indexOf('assets/book-cover-photo.jpg'),2);
files.push('assets/book-page-edges.svg','brand.css','layout.css','layout.js','logo-loader.js','spin-audio.js','assets/brand-logo.png','assets/favicon.png');
try{await readFile(path.join(root,'data/upstream-attribution.json'));files.push('data/upstream-attribution.json');}catch{}
const ctx=vm.createContext({});
vm.runInContext(await readFile(path.join(root,'data/surahs.js'),'utf8'),ctx);
vm.runInContext(await readFile(path.join(root,'data/quran.js'),'utf8'),ctx);
if(ctx.SURAHS?.length!==114||ctx.SURAHS.reduce((sum,s)=>sum+s.total_verses,0)!==6236)throw new Error('Invalid Surah catalogue');
for(const file of files.filter(file=>file.endsWith('.js')))new vm.Script(await readFile(path.join(root,file),'utf8'),{filename:file});
const contents=await Promise.all(files.map(file=>readFile(path.join(root,file))));
const publicUrl=process.env.PUBLIC_SUPABASE_URL||'',publicKey=process.env.PUBLIC_SUPABASE_ANON_KEY||'';
const configContext=vm.createContext({});vm.runInContext(contents[files.indexOf('config.js')].toString(),configContext,{timeout:500});
const cloud=publicUrl||publicKey?{supabaseUrl:publicUrl,supabaseAnonKey:publicKey}:configContext.COMPASS_CONFIG||{};
if(cloud.supabaseUrl||cloud.supabaseAnonKey){
  const url=new URL(cloud.supabaseUrl),key=cloud.supabaseAnonKey;
  if(url.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)||url.username||url.password||url.pathname!=='/'||url.search||url.hash||typeof key!=='string'||!key)throw new Error('Set a valid Supabase project URL and public anon/publishable key');
  if(!key.startsWith('sb_publishable_')){let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role;}catch{}if(role!=='anon')throw new Error('Only a PUBLIC anon/publishable key may be included in the static app. Never use a service-role secret.');}
}
contents[files.indexOf('config.js')]=Buffer.from('globalThis.COMPASS_CONFIG = '+JSON.stringify({supabaseUrl:cloud.supabaseUrl||'',supabaseAnonKey:cloud.supabaseAnonKey||''})+';\n');
const revision=createHash('sha256').update(Buffer.concat(contents)).digest('hex').slice(0,12);
for(let i=0;i<files.length;i++){
  const target=path.join(output,files[i]);await mkdir(path.dirname(target),{recursive:true});
  if(files[i]==='sw.js')await writeFile(target,contents[i].toString().replace('surah-compass-v1',`surah-compass-${revision}`));
  else if(files[i]==='config.js')await writeFile(target,contents[i]);
  else await copyFile(path.join(root,files[i]),target);
}
console.log(`Built ${files.length} static assets in dist/ (cache ${revision}).`);
console.log(Object.keys(ctx.QURAN||{}).length===114?'Full offline Quran reading pack bundled.':'Surah catalogue bundled. Full Quran text can be downloaded once in the app or installed with npm run download-quran.');
