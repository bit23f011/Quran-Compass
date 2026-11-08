/* Check the emitted offline app against its actual HTML, CSS and service-worker references. */
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const references=new Set(['index.html','manifest.webmanifest']);
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g))references.add(match[1]);
const worker=vm.createContext({self:{addEventListener(){}}});
vm.runInContext(await readFile(path.join(root,'sw.js'),'utf8')+';globalThis.files=FILES;',worker,{timeout:500});
for(const file of worker.files)references.add(file==='./'?'index.html':file.replace(/^\.\//,''));
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
