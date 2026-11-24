import fs from 'node:fs';
import path from 'node:path';
import PizZip from 'pizzip';

// A4 templates for the current seven-article model. Only blank placeholders
// enter the build; user data is filled by Docxtemplater in the browser.
export function prepareWordTemplates(root){
 const result={};
 for(const lang of ['ar','fr']){
  const ar=lang==='ar',dir=ar?'<w:bidi/>':'',rtl=ar?'<w:rtl/>':'',size=ar?28:25;
  const p=(text,kind='body')=>`<w:p><w:pPr>${dir}<w:widowControl/>${['title','subtitle','heading','party','tail'].includes(kind)?'<w:keepNext/>':''}${kind==='title'||kind==='subtitle'?'<w:jc w:val="center"/>':''}<w:spacing w:after="100" w:line="420" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${rtl}${['title','heading','party','signature'].includes(kind)?'<w:b/><w:bCs/>':''}<w:sz w:val="${kind==='title'?38:kind==='subtitle'?23:kind==='heading'?29:size}"/><w:szCs w:val="${kind==='title'?38:kind==='subtitle'?23:kind==='heading'?29:size}"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  const loop=(key,body)=>p(`{#${key}}`)+body+p(`{/${key}}`);
  let body=p('{#blocks}');
  for(const kind of ['title','subtitle','heading','party','body','tail'])body+=loop(kind,p('{text}',kind));
  body+=loop('pageBreak','<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  body+=loop('signatures',`<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>${ar?'<w:bidiVisual/>':''}<w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(side=>`<w:${side} w:val="nil"/>`).join('')}</w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="4873"/><w:gridCol w:w="4873"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="1600" w:hRule="atLeast"/></w:trPr>${['firstSignature','secondSignature'].map(key=>`<w:tc><w:tcPr><w:tcW w:w="4873" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>${p(`{${key}}`,'signature')}</w:tc>`).join('')}</w:tr></w:tbl>`);
  body+=p('{/blocks}')+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>';
  const zip=new PizZip();
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`);
  const bytes=zip.generate({type:'uint8array',compression:'DEFLATE'});
  fs.writeFileSync(path.join(root,`public/templates/domcontrat-${lang}.docx`),bytes);
  result[lang]=Buffer.from(bytes).toString('base64');
 }
 fs.writeFileSync(path.join(root,'src/word-templates.js'),'export default '+JSON.stringify(result)+';\n');
}
