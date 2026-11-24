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
  blocks.push({[kind]:true,text:(item.checked===undefined?'':item.checked?'☒ ':'☐ ')+item.text});
 }
 const lang=data.language==='fr'?'fr':'ar',template=Uint8Array.from(atob(templates[lang]),c=>c.charCodeAt(0));
 const document=new Docxtemplater(new PizZip(template),{paragraphLoop:true,linebreaks:true,nullGetter(){throw Error('MISSING_WORD_FIELD');}});
 document.render({blocks:blocks.map(block=>({title:false,subtitle:false,heading:false,party:false,body:false,tail:false,pageBreak:false,signatures:false,...block}))});
 return document.getZip().generate({type:'uint8array',compression:'DEFLATE'});
}
