import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const fonts=Object.fromEntries([['regular','Regular'],['bold','Bold']].map(([key,style])=>[key,fs.readFileSync(path.join(root,`public/fonts/Amiri-${style}.ttf`)).toString('base64')]));
// Fonts are embedded so PDF generation needs no network, even from file://.
fs.writeFileSync(path.join(root,'src/pdf-fonts.js'),'export default '+JSON.stringify(fonts)+';\n');
// The exact owned build directory is checked before removing stale build files.
if(path.dirname(output)!==root||path.basename(output)!=='dist')throw Error('Invalid build output');
if(fs.existsSync(output)){
 if(fs.lstatSync(output).isSymbolicLink())throw Error('Build output cannot be a link');
 fs.rmSync(output,{recursive:true,force:true});
}
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'.nojekyll'),'');
if(fs.existsSync(path.join(root,'public/CNAME')))fs.copyFileSync(path.join(root,'public/CNAME'),path.join(output,'CNAME'));
fs.cpSync(path.join(root,'public/brand'),path.join(output,'brand'),{recursive:true});
fs.copyFileSync(path.join(root,'public/_headers'),path.join(output,'_headers'));
fs.copyFileSync(path.join(root,'public/fonts/OFL-Amiri.txt'),path.join(output,'OFL-Amiri.txt'));
fs.writeFileSync(path.join(output,'index.html'),fs.readFileSync(path.join(root,'index.html'),'utf8').replaceAll('./dist/','./'));
await build({entryPoints:[path.join(root,'src/main.js')],bundle:true,format:'iife',target:'es2022',minify:true,outfile:path.join(output,'app.js'),loader:{'.ttf':'file'},assetNames:'fonts/[name]-[hash]',logLevel:'info'});
// GitHub Pages can cache assets between deployments. Published HTML references
// content fingerprints; the stable aliases keep the source-root file:// entry usable.
let html=fs.readFileSync(path.join(output,'index.html'),'utf8');
for(const extension of ['js','css']){
 const source=path.join(output,`app.${extension}`),hash=createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0,12),name=`app-${hash}.${extension}`;
 fs.copyFileSync(source,path.join(output,name));html=html.replace(`./app.${extension}`,`./${name}`);
}
fs.writeFileSync(path.join(output,'index.html'),html);
for(const file of ['THIRD_PARTY_NOTICES.json','THIRD_PARTY_LICENSES'])if(fs.existsSync(path.join(root,file)))fs.cpSync(path.join(root,file),path.join(output,file),{recursive:true});
