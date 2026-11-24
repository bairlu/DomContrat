// Dependency-free static server. No contract data are sent here or persisted.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
export function createLocalServer(directory){
 const root=path.resolve(directory);
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.pdf':'application/pdf','.ttf':'font/ttf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
 return http.createServer((req,res)=>{
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data: blob:; connect-src 'none'; object-src 'none'; frame-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||'')){res.writeHead(403);res.end();return;}
  try{
   const raw=req.url||'/';if(raw.includes('?')||raw.includes('..')){res.writeHead(400);res.end();return;}
   const pathname=decodeURIComponent(new URL(raw,'http://localhost').pathname);
   if(pathname.includes('\\')||pathname.includes('\0')){res.writeHead(400);res.end();return;}
   const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end();}
 });
}
const entry=typeof process!=='undefined'&&process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(entry){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
 if(!fs.existsSync(path.join(root,'index.html'))){console.error('Built site is missing. Run npm run build first.');process.exit(1);}
 const port=Number(process.argv.find(a=>/^--port=/.test(a))?.split('=')[1]||5173);
 if(!Number.isInteger(port)||port<1024||port>65535){console.error('Choose a port between 1024 and 65535.');process.exit(1);}
 const server=createLocalServer(root);
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is occupied. Close the previous server or use --port=5174.`:'Unable to start localhost server.');process.exit(1);});
 server.listen(port,'127.0.0.1',()=>{
  const url=`http://localhost:${port}/`;console.log(`\nLocal contract platform: ${url}\nKeep this window open. Press Ctrl+C to stop.\n`);
  if(process.argv.includes('--open')){
   const app=process.platform==='win32'?'explorer.exe':process.platform==='darwin'?'open':'xdg-open';
   const child=spawn(app,[url],{stdio:'ignore',windowsHide:true});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();
  }
 });
 process.on('SIGINT',()=>server.close(()=>process.exit(0)));
}
