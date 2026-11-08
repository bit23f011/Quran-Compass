import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const port=Number(process.env.PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const allowed=/^(index\.html|(?:styles|system|reader|learning|visual|mushaf|brand|layout)\.css|(?:core|app|store|reader|learning|sync|config|sw|mushaf|content|logo-loader|spin-audio|layout)\.js|manifest\.webmanifest|assets\/(icon(?:\.svg|-192\.png|-512\.png)|brand-logo\.png|favicon\.png|home-islamic-bg\.png|book-page-edges\.svg)|data\/(surahs\.js|quran\.js|study\.js|editions\.js|quran-pack\.json|SOURCES\.md))$/;
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Method not allowed');return;}
  try{
    const url=new URL(req.url,'http://localhost');
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    if(!allowed.test(relative)){res.writeHead(404);res.end('Not found');return;}
    const target=path.resolve(root,relative);
    if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    const data=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(relative)]||'text/plain; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Try setting PORT=3001.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Surah Compass is ready: http://localhost:${port}\nWorks without an internet connection. Press Ctrl+C to stop.`));
