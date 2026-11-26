import {createContractPdf,getPdfFonts,contractBlocks} from './pdf.js';
import {depositOffice} from './directorates.js';
import {contractFilename} from './contract-data.js';
import emblem from './receipt-logo.js';

export function receiptFilename(data){return contractFilename(data).replace('عقد العمل المنزلي -','وصل إيداع عقد العمل المنزلي -');}
export function receiptBlocks(data){
 const ar=data.language!=='fr',office=depositOffice(data.depositRegion,data.depositOffice,ar?'ar':'fr');
 if(!office)throw Error('INVALID_DEPOSIT_OFFICE');
 const b=(text,kind='body')=>({text,kind,runs:[{text,bold:false}]});
 const source=contractBlocks(data),first=source.findIndex(row=>row.kind==='party'),last=source.findIndex(row=>row.kind==='heading');
 return [
  b(ar?'المملكة المغربية':'Royaume du Maroc','letterhead'),
  b(ar?'وزارة التشغيل والحوار الاجتماعي':'Ministère de l’Emploi et du Dialogue social','letterhead'),
  b(office.regional,'letterhead'),
  b(office.provincial,'letterhead'),
  b(ar?'وصل إيداع عقد العمل المنزلي':'Récépissé de dépôt du contrat de travail domestique','title'),
  b(ar?'يقدّم للإدارة المختصة التي تستكمل رقم وتاريخ الإيداع وتوقعه وتختمه بعد الإيداع الفعلي.':'À présenter à l’administration compétente : numéro et date de dépôt, signature et cachet à compléter après le dépôt effectif.','subtitle'),
  b(ar?'رقم الإيداع: __________________    تاريخ الإيداع: __________________':'N° de dépôt : __________________    Date de dépôt : __________________'),
  b(ar?'يتعلق الإيداع بنظير عقد العمل المنزلي المبرم بين الطرفين التاليين:':'Le dépôt concerne un exemplaire du contrat de travail domestique conclu entre les parties suivantes :'),
  ...source.slice(first,last-1),
  b(ar?`نوع العقد: ${data.contractType} — تاريخ بداية العمل: ${data.start.split('-').reverse().join('/')}`:`Type de contrat : ${data.contractType} — Début du travail : ${data.start.split('-').reverse().join('/')}`),
  b(ar?'توقيع وخاتم الإدارة':'Signature et cachet de l’administration','administration'),
 ];
}
export async function generateReceiptPdf(data){
 return createContractPdf(data,getPdfFonts(),{blocks:receiptBlocks(data),emblem,receipt:true,title:data.language==='fr'?'Récépissé de dépôt du contrat de travail domestique':'وصل إيداع عقد العمل المنزلي'});
}
