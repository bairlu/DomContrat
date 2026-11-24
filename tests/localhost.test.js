import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createLocalServer} from '../scripts/serve-local.mjs';
test('static deployment resources work on localhost; no submissions, query strings or external scripts',async()=>{
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
 const server=createLocalServer(root);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const response=await fetch(base+'/');assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/connect-src 'none'/);const html=await response.text();assert.ok(html.includes('./app.js'));assert.ok(html.includes('./app.css'));assert.ok(!html.includes('./dist/'));assert.ok(!/<(?:script|link)[^>]+(?:src|href)="https?:/.test(html));
  for(const resource of ['/app.js','/app.css','/OFL-Amiri.txt'])assert.equal((await fetch(base+resource)).status,200,resource);
  assert.equal((await fetch(base+'/?contract=synthetic')).status,400);assert.equal((await fetch(base+'/',{method:'POST',body:'synthetic'})).status,405);
  const entry=fs.readFileSync(path.join(root,'../index.html'),'utf8');assert.ok(entry.includes('./dist/app.js'));
 }finally{await new Promise(r=>server.close(r));}
});
