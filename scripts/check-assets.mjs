/* Check the emitted offline app against its actual HTML, CSS and service-worker references. */
import {readFile,stat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const references=new Set(['index.html','manifest.webmanifest']);
const htmlFiles=(await readdir(root,{recursive:true})).filter(file=>file.endsWith('.html'));
function addReference(value,from){
  if(value.startsWith('#')||/^(?:data:|mailto:|tel:)/.test(value))return;
  const url=new URL(value,'https://build.invalid/'+from.replaceAll('\\','/'));
  if(url.origin!=='https://build.invalid')return;
  let file=decodeURIComponent(url.pathname).slice(1)||'index.html';
  if(file.endsWith('/'))file+='index.html';
  references.add(file);
}
for(const file of htmlFiles){
  const html=await readFile(path.join(root,file),'utf8');
  for(const match of html.matchAll(/<(?:script|link|img|a)\b[^>]*\b(?:src|href)="([^"]+)"/g))addReference(match[1],file);
}
const worker=vm.createContext({self:{addEventListener(){}}});
vm.runInContext(await readFile(path.join(root,'sw.js'),'utf8')+';globalThis.files=FILES;',worker,{timeout:500});
for(const file of worker.files)addReference(file,'sw.js');
if(worker.files.some(file=>file.includes('/_vercel/')))throw new Error('Analytics endpoints must never enter the offline cache.');
for(const file of [...references].filter(file=>file.endsWith('.css'))){
  for(const match of (await readFile(path.join(root,file),'utf8')).matchAll(/url\(['"]?([^)'"\s]+)/g))references.add(path.join(path.dirname(file),match[1]));
}
const missing=[];
for(const file of references){
  if(/^(?:https?:|data:)/.test(file))continue;
  try{if(!(await stat(path.join(root,file))).isFile())missing.push(file);}catch{missing.push(file);}
}
if(missing.length)throw new Error('Missing emitted assets: '+missing.join(', '));
console.log(`Verified ${references.size} emitted references and ${worker.files.length} offline cache entries.`);
