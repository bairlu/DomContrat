import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createLocalServer} from '../scripts/serve-local.mjs';
const root=path.resolve('dist');
test('GitHub project Pages: all declared assets resolve under a repository prefix',async()=>{
 const staticServer=createLocalServer(root);
 const server=http.createServer((req,res)=>{
  if(!req.url.startsWith('/DomContrat/')){res.writeHead(404);res.end();return;}
  req.url=req.url.slice('/DomContrat'.length);staticServer.emit('request',req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/DomContrat/`;
 try{
  const html=await(await fetch(base)).text();const resources=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(x=>x[1]);assert.ok(resources.length>=3);
  assert.match(html,/app-[a-f0-9]{12}\.js/);assert.match(html,/app-[a-f0-9]{12}\.css/);
  for(const resource of resources){const url=new URL(resource,base);assert.ok(url.pathname.startsWith('/DomContrat/'),url.href);assert.equal((await fetch(url)).status,200,url.href);}
  assert.equal((await fetch(base+'.nojekyll')).status,200);assert.ok(fs.existsSync('.github/workflows/pages.yml'));
  const script=await(await fetch(new URL('./app.js',base))).text();assert.ok(!script.includes('http://localhost:'));assert.ok(!/<script[^>]+src="https?:/.test(html));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
