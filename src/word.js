import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import templates from './word-templates.js';
import {validate} from './legal.js';
import {contractBlocks} from './pdf.js';

export function generateWordDocument(data){
 if(Object.keys(validate(data)).length)throw Error('VALIDATION');
 const source=contractBlocks(data),blocks=[];
 for(let i=0;i<source.length;i++){
  const item=source[i];
  if(item.pageBefore)blocks.push({pageBreak:true});
  if(item.kind==='signature'){
   if(source[i+1]?.kind!=='signature')throw Error('INVALID_SIGNATURE_GROUP');
   blocks.push({signatures:true,firstSignature:item.text,secondSignature:source[++i].text});continue;
  }
  const kind=item.kind==='body'&&(source[i+1]?.kind==='signature'||source[i+2]?.kind==='signature')?'tail':item.kind;
  blocks.push({[kind]:true,text:(item.checked===undefined?'':item.checked?'☒ ':'☐ ')+item.text,runs:[...(item.checked===undefined?[]:[{text:item.checked?'☒ ':'☐ ',bold:false}]),...item.runs]});
 }
 const lang=data.language==='fr'?'fr':'ar',template=Uint8Array.from(atob(templates[lang]),c=>c.charCodeAt(0));
 const document=new Docxtemplater(new PizZip(template),{paragraphLoop:true,linebreaks:true,nullGetter(){throw Error('MISSING_WORD_FIELD');}});
 document.render({blocks:blocks.map(block=>({title:false,subtitle:false,heading:false,party:false,body:false,tail:false,pageBreak:false,signatures:false,...block}))});
 const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
 const rich=blocks.filter(block=>(block.body||block.tail)&&block.runs.some(run=>run.bold));
 const xml=document.getZip().file('word/document.xml').asText().replace(/<w:p[ >][\s\S]*?<\/w:p>/g,paragraph=>{
  const item=rich.find(block=>paragraph.includes(`<w:t xml:space="preserve">${escape(block.text)}</w:t>`));
  if(!item)return paragraph;
  return paragraph.replace(/<w:r>[\s\S]*?<\/w:r>/,run=>{
   const properties=run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1]??'';
   return item.runs.map(part=>`<w:r><w:rPr>${properties}${part.bold?'<w:b/><w:bCs/>':''}</w:rPr><w:t xml:space="preserve">${escape(part.text)}</w:t></w:r>`).join('');
  });
 });
 document.getZip().file('word/document.xml',xml);
 return document.getZip().generate({type:'uint8array',compression:'DEFLATE'});
}
