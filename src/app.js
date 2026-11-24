import {generateWordDocument} from './word.js';
import {blank,validate,wage,ageOn,duration,stepFields,currentRate} from './legal.js';
import {generatePdfDocument} from './pdf.js';
import {copy,choices,identityAr,identityFr} from './i18n.js';

const icons={doc:'<path d="M7 3h8l4 4v14H7zM14 3v5h5M10 12h6M10 16h6"/>',shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6zM8 12l3 3 5-6"/>',check:'<path d="m5 12 4 4L19 6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',edit:'<path d="m15 4 5 5-11 11H4v-5zM13 6l5 5"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]??icons.doc}</svg>`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selects={employerIdType:'id',workerIdType:'id',gender:'gender',marital:'marital',contractType:'contractType',rest:'rest',benefits:'benefits',probationDays:'probationDays'};
const dates=new Set(['employerIssueDate','workerIssueDate','birth','start','end']);
const required=new Set(Object.values(stepFields).flat());
const flag=lang=>lang==='ar'?'<svg class="country-flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#c1272d"/><path d="m15 4-3.53 10.85 9.24-6.7H9.29l9.24 6.7Z" fill="none" stroke="#006233" stroke-width="1.2"/></svg>':'<svg class="country-flag" viewBox="0 0 30 20" aria-hidden="true"><path fill="#002395" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ed2939" d="M20 0h10v20H20z"/></svg>';
const logoSrc=document.querySelector('link[rel="icon"]')?.getAttribute('href')??'./brand/domcontrat.png';

export function mountApp(root,services={}){
 let data=blank(),step=1,furthest=1,attempted=false,touched=new Set(),revision=0,busy=false,destroyed=false;
 let pdf=null,pdfUrl='',page=1,zoom=90,status='',wordBytes=null,wordUrl='',wordReady=false,wordRendering=false,wordGeneration=0;
 const generate=services.generatePdf??generatePdfDocument;
 const generateWord=services.generateWord??generateWordDocument;
 const renderWord=services.renderWord??(async(bytes,body,styles)=>{const {renderAsync}=await import('docx-preview');await renderAsync(bytes.slice().buffer,body,styles,{className:'contract-word',inWrapper:true,breakPages:true,renderFootnotes:true,useBase64URL:true});});
 const $=s=>root.querySelector(s),t=()=>copy[data.language],c=()=>choices[data.language];
 const calculation=()=>{const r=currentRate();return data.language==='ar'?`الساعات الأسبوعية × 52 ÷ 12 × (${r?.hourly??'—'} × ${Number(r?.share??0)*100}%)، مع التقريب إلى السنتيم الأعلى.`:`Heures hebdomadaires × 52 ÷ 12 × (${r?.hourly??'—'} × ${Number(r?.share??0)*100} %), arrondi au centime supérieur.`;};
 const rateNotice=()=>{const r=currentRate();return data.language==='ar'?`المرجع الساري: المرسوم رقم ${r?.decree??'—'}، ابتداءً من ${r?.from??'—'}. آخر تحقق: ${r?.verified??'—'}. تعتمد المنصة الحد الأدنى الجاري، ويُحيّن الإعداد عند صدور مرسوم جديد.`:`Référence en vigueur : décret n° ${r?.decree??'—'}, depuis le ${r?.from??'—'}. Vérifié le ${r?.verified??'—'}. Le barème doit être actualisé lors de tout nouveau décret.`;};
 const errorsFor=n=>validate(data,n);
 const allErrors=()=>validate(data);
 const clearPdf=()=>{pdf=null;if(pdfUrl)URL.revokeObjectURL(pdfUrl);if(wordUrl)URL.revokeObjectURL(wordUrl);pdfUrl='';wordUrl='';wordBytes=null;wordReady=false;wordRendering=false;wordGeneration++;};
 function field(key){
  const optional=key==='benefits',req=required.has(key)||['end','otherTask','probationDays'].includes(key);
  const attrs=`id="${key}" name="${key}" aria-describedby="${key}-error" ${req?'required':''}`;
  let input;
  if(selects[key])input=`<select ${attrs}><option value="">${optional?t().optional:t().select}</option>${c()[selects[key]].map(([v,label])=>`<option value="${v}" ${data[key]===v?'selected':''}>${escape(label)}</option>`).join('')}</select>`;
  else if(key==='otherTask')input=`<textarea ${attrs} rows="4" maxlength="3000">${escape(data[key])}</textarea>`;
  else if(key==='employerAddress')input=`<textarea ${attrs} rows="3" maxlength="500">${escape(data[key])}</textarea>`;
  else input=`<input ${attrs} type="${dates.has(key)?'date':['hours','salary'].includes(key)?'number':'text'}" value="${escape(data[key])}" ${['hours','salary'].includes(key)?`inputmode="decimal" min="0.01" step="0.01" ${key==='hours'?'max="48"':''}`:'maxlength="500"'} ${dates.has(key)||['hours','salary','employerId','workerId'].includes(key)?'dir="ltr"':''}>`;
  return `<div class="field ${key==='employerAddress'?'wide':''}" data-field="${key}"><label for="${key}">${t().labels[key]} ${req?'<span class="required">*</span>':`<small>${t().optional}</small>`}</label><div class="control-wrap">${input}<span class="valid-mark" aria-hidden="true">${icon('check')}</span></div><span class="field-error" id="${key}-error" aria-live="polite"></span></div>`;
 }
 const fields=keys=>`<div class="fields">${keys.map(field).join('')}</div>`;
 function content(){
  if(step===1)return `<div class="language-cards" role="group" aria-label="${t().language}">${[['ar','','العربية','من اليمين إلى اليسار'],['fr','','Français','De gauche à droite']].map(([lang,letter,label,hint])=>`<button class="language-card ${data.language===lang?'selected':''}" type="button" data-language="${lang}" aria-pressed="${data.language===lang}"><span class="language-letter">${flag(lang)}</span><strong>${label}</strong><span>${hint}</span><i>${data.language===lang?icon('check'):''}</i></button>`).join('')}</div><p class="section-note centered">${t().languageHint}</p><div class="start-note">${icon('shield')}<p>${t().procedure}</p></div>`;
  if(step===2)return fields(stepFields[2]);
  if(step===3)return fields(stepFields[3])+`<div class="notice soft">${icon('shield')}<div>${t().legalNote}<strong id="age-output"></strong></div></div>`;
  if(step===4)return fields(['contractType','start','end','role','probationDays'])+`<p id="contract-help" class="section-note"></p><p id="duration-output" class="duration" hidden></p><div class="task-group"><h3 id="task-label" tabindex="-1">${t().tasksTitle} <span class="required">*</span></h3><div class="tasks" role="group" aria-labelledby="task-label">${c().tasks.map(([key,label])=>`<label class="task"><input type="checkbox" name="task" value="${key}" ${data.tasks.includes(key)?'checked':''}><span>${label}</span></label>`).join('')}</div><p id="tasks-error" class="field-error"></p></div>${fields(['otherTask'])}`;
  if(step===5)return fields(['hours','salary'])+`<div class="wage-panel"><div class="wage-top">${icon('shield')}<strong>${data.language==='ar'?'حساب واضح لأجر منصف':'Un calcul clair pour un salaire juste'}</strong><span>${currentRate()?.from.slice(0,4)??'—'}</span></div><dl><div><dt>${t().weekly}</dt><dd id="weekly-output" dir="ltr"></dd></div><div><dt>${t().monthlyHours}</dt><dd id="monthly-output" dir="ltr"></dd></div><div><dt>${t().hourly}</dt><dd id="hourly-output" dir="ltr"></dd></div><div class="wage-minimum"><dt>${t().minimum}</dt><dd id="minimum-output" dir="ltr"></dd></div><div><dt>${t().entered}</dt><dd id="salary-output" dir="ltr"></dd></div></dl><p>${calculation()}</p></div><p class="section-note">${rateNotice()}</p><div class="notice soft">${icon('lock')}<p>${t().cash}</p></div>`;
  return fields(['rest','benefits'])+`<div class="rights-note">${icon('shield')}<p>${t().restHelp}</p></div><div class="notice soft">${icon('doc')}<p>${t().procedure}</p></div>`;
 }
 function draw(){
  wordGeneration++;wordReady=false;wordRendering=false;
  const ar=data.language==='ar';
  const finished=new Set(Array.from({length:Math.min(furthest-1,6)},(_,i)=>i+1).filter(n=>!Object.keys(errorsFor(n)).length));
  if(pdf&&!Object.keys(allErrors()).length)finished.add(7);
  const complete=finished.size;
  document.documentElement.lang=data.language;document.documentElement.dir=ar?'rtl':'ltr';document.title=t().title;
  root.innerHTML=`<a class="skip" href="#editor">${ar?'انتقل إلى المحتوى':'Aller au contenu'}</a><header><div class="shell header-inner"><div class="brand-mark logo-mark"><img src="${logoSrc}" alt="DomContrat" width="200" height="150"></div><div class="language-switch" role="group" aria-label="${t().language}"><button type="button" data-language="ar" lang="ar" aria-pressed="${ar}">${flag('ar')} العربية</button><button type="button" data-language="fr" lang="fr" aria-pressed="${!ar}">${flag('fr')} Français</button></div></div></header>
   <main class="shell"><section class="intro"><div class="eyebrow"><span></span>${t().noStorage}</div><h1>${ar?'عقد واضح، وحقوق محفوظة':'Un contrat clair, des droits préservés'}</h1><p class="slogan">${t().slogan}</p><p>${t().intro}</p></section>
   <section class="workspace" id="editor" aria-label="${t().subtitle}"><div class="workspace-top"><p>${t().step} <strong>${step}</strong> ${t().of} 7</p><button class="new-contract-button" type="button" id="reset-button"><span aria-hidden="true">＋</span>${t().newContract}</button></div><div class="progress" aria-label="${ar?'تقدم إعداد العقد':'Progression du contrat'}"><div class="progress-track" aria-hidden="true"><i style="width:${(step-1)/6*100}%"></i></div><ol>${t().steps.map((label,i)=>`<li class="${i+1===step?'current':finished.has(i+1)?'complete':''}"><button type="button" data-step="${i+1}" aria-label="${label}" ${i+1>furthest?'disabled':''} ${i+1===step?'aria-current="step"':''}><span class="step-dot">${finished.has(i+1)?icon('check'):i+1}</span><span class="step-label">${label}</span></button></li>`).join('')}</ol></div><div class="progress-caption"><span>${complete} ${t().completed}</span><span>${7-complete} ${t().remaining}</span></div>
   <div class="editor-card"><div class="card-heading"><span class="card-icon">${icon(step===7?'check':step===5?'shield':'doc')}</span><div><h2 id="stage-heading" tabindex="-1">${t().steps[step-1]}</h2><p>${t().stepDescriptions[step-1]}</p></div></div>
   ${step===7?`<section class="review" aria-label="${t().review}"><div class="review-success">${icon('check')}<span>${t().ready}</span></div><p class="section-note">${t().previewHint}</p><div class="preview-switch" role="tablist" aria-label="PDF / Word"><button id="preview-pdf" type="button" role="tab" aria-selected="true" aria-controls="pdf-frame">PDF</button><button id="preview-word" type="button" role="tab" aria-selected="false" aria-controls="word-preview">Word</button></div><div class="preview-toolbar" id="pdf-toolbar"><label>${t().page}<select id="pdf-page" aria-label="${t().page}">${Array.from({length:pdf?.pageCount??0},(_,i)=>`<option value="${i+1}" ${page===i+1?'selected':''}>${i+1} / ${pdf.pageCount}</option>`).join('')}</select></label><label>${t().zoom}<select id="pdf-zoom" aria-label="${t().zoom}">${[60,75,90,100,125,150,200].map(z=>`<option value="${z}" ${z===zoom?'selected':''}>${z}%</option>`).join('')}</select></label><a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">${t().openPdf}</a></div><iframe id="pdf-frame" title="${t().review}" src="${pdfUrl}#page=${page}&zoom=${zoom}&toolbar=1&navpanes=0"></iframe><div id="word-preview" hidden><p class="section-note">${ar?'هذه معاينة ملف Word نفسه الذي سيُحمّل. قد يختلف توزيع الصفحات قليلاً داخل Microsoft Word.':'Cet aperçu utilise le fichier Word qui sera téléchargé. La pagination peut varier dans Microsoft Word.'}</p><label class="word-zoom-label">${t().zoom}<select id="word-zoom"><option value="0.3">30%</option><option value="0.4">40%</option><option value="0.5">50%</option><option value="0.6">60%</option><option value="0.7">70%</option><option value="0.9">90%</option><option value="0.8">80%</option><option value="1" selected>100%</option><option value="1.2">120%</option></select></label><div id="word-preview-styles"></div><div class="word-scroll" tabindex="0"><div id="word-preview-pages"></div></div></div><p class="section-note">${t().printHint}</p><div class="form-actions review-actions"><button class="secondary" type="button" id="edit-button">${icon('edit')}${t().edit}</button><button class="primary green" type="button" id="download-button">${icon('download')}${t().download}</button><button class="primary green" type="button" id="word-download-button" disabled>${icon('download')}${ar?'تحميل العقد بصيغة Word':'Télécharger le contrat Word'}</button></div></section>`:`<form id="contract-form" novalidate autocomplete="off"><p class="form-hint">${t().formHint}</p><div id="error-summary" class="notice danger" role="alert" tabindex="-1" hidden></div>${content()}<div class="form-actions"><button class="secondary" type="button" id="back-button" ${step===1?'disabled':''}>${t().back}</button><button class="primary" type="submit" id="${step===6?'preview-button':'next-button'}">${step===6?icon('doc')+t().preview:t().next}</button></div></form>`}
   <p id="status" role="status" aria-live="polite">${escape(status)}</p></div><div class="privacy-foot">${icon('lock')}<span>${t().privacyShort}</span></div></section>
   <details class="guidance"><summary>${t().help}</summary><p>${t().procedure}</p><p>${t().signNotice}</p><p>${t().privacy}</p><p>${t().reference}</p></details></main><footer><div class="shell"><div class="footer-brand"><img class="footer-logo" src="${logoSrc}" alt="DomContrat" width="240" height="180"></div><p>${t().slogan}</p><p class="footer-credit" lang="ar" dir="rtl">هذه المنصة من إعداد ${identityAr}</p>${ar?'':`<p>Cette plateforme est élaborée par ${identityFr}</p>`}</div></footer>`;
  refresh();
 }
 function refresh(){
  if(destroyed)return;const errors=step===7?allErrors():errorsFor(step),w=wage(data.hours,data.start);
  for(const key of Object.keys(data)){
   const control=$('#'+key),error=$('#'+key+'-error'),show=attempted||touched.has(key)||key==='salary'&&!!data.salary;
   if(error)error.textContent=show?errors[key]??'':'';
   if(control){control.setAttribute('aria-invalid',String(show&&!!errors[key]));control.closest('.field')?.classList.toggle('is-valid',!!data[key]&&!errors[key]);}
  }
  root.querySelectorAll('input,select,textarea,button').forEach(e=>{if(busy)e.disabled=true;});
  for(const [key,visible] of [['end',data.contractType==='CDD'],['otherTask',data.tasks.includes('other')],['probationDays',data.contractType==='CDI']]){const e=$(`[data-field="${key}"]`);if(e){e.hidden=!visible;e.querySelector('input,select,textarea').disabled=!visible||busy;}}
  if($('#tasks-error'))$('#tasks-error').textContent=attempted||touched.has('tasks')?errors.tasks??'':'';
  if($('#contract-help'))$('#contract-help').textContent=data.contractType==='CDD'?t().cddHelp:t().cdiHelp;

  if($('#duration-output')){$('#duration-output').hidden=data.contractType!=='CDD';$('#duration-output').textContent=`${t().duration}: ${duration(data.start,data.end)}`;}
  if($('#age-output')){const age=ageOn(data.birth,data.start);$('#age-output').textContent=age===null?'':`${t().age}: ${age} ${t().years}`;}
  for(const [key,value] of Object.entries({weekly:data.hours?`${data.hours} ${t().hour}`:'—',monthly:w?`${w.monthly} ${t().hour}`:'—',hourly:w?`${w.hourly} ${t().mad}`:'—',minimum:w?`${w.minimum} ${t().mad}`:'—',salary:data.salary?`${data.salary} ${t().mad}`:'—'}))if($('#'+key+'-output'))$('#'+key+'-output').textContent=value;
  if($('#download-button'))$('#download-button').disabled=busy||!pdf||Object.keys(allErrors()).length>0;if($('#word-download-button'))$('#word-download-button').disabled=busy||!wordReady||!wordBytes||Object.keys(allErrors()).length>0;
  showErrors(errors);
 }
 function showErrors(errors){
  const summary=$('#error-summary');if(!summary)return;summary.hidden=!attempted||!Object.keys(errors).length;summary.replaceChildren();if(summary.hidden)return;
  const title=document.createElement('strong');title.textContent=t().errorTitle;summary.append(title);const list=document.createElement('ul');
  for(const [key,message] of Object.entries(errors)){const li=document.createElement('li'),link=document.createElement('a');const target=key==='tasks'?'task-label':key==='reviewCDD'?'contractType':key;link.href='#'+target;link.textContent=`${t().labels[key]??t().tasksTitle}: ${message}`;link.addEventListener('click',()=>$('#'+target)?.focus());li.append(link);list.append(li);}summary.append(list);
 }
 function go(target){
  if(busy||target<1||target>7)return;
  if(target===7){if(pdf&&!Object.keys(allErrors()).length){step=7;draw();}return;}
  if(target>step){for(let n=step;n<target;n++){const errors=errorsFor(n);if(Object.keys(errors).length){step=n;attempted=true;draw();$('#error-summary')?.focus();return;}}}
  step=target;furthest=Math.max(furthest,step);attempted=false;status='';draw();$('#stage-heading').focus();$('#editor').scrollIntoView?.({behavior:'smooth',block:'start'});
 }
 async function makePdf(){
  const errors=allErrors();
  if(Object.keys(errors).length){const first=Object.keys(errors)[0];step=Object.entries(stepFields).find(([,fields])=>fields.includes(first))?.[0]*1||4;attempted=true;draw();$('#error-summary')?.focus();return;}
  clearPdf();busy=true;status=t().busy;const version=revision;draw();
  try{const snapshot={...data,tasks:[...data.tasks]};const generated=await generate(snapshot);const generatedWord=await generateWord(snapshot);if(destroyed||revision!==version)return;wordBytes=generatedWord;wordUrl=URL.createObjectURL(new Blob([wordBytes.slice().buffer],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
   pdf=generated;pdfUrl=URL.createObjectURL(new Blob([pdf.bytes.slice().buffer],{type:'application/pdf'}));page=1;zoom=90;step=7;furthest=7;status='';
  }catch(error){status=error.message==='UNSUPPORTED_CHARACTERS'?t().unsupported:t().blocked;
  }finally{busy=false;if(!destroyed){draw();$('#stage-heading').focus();}}
 }
 async function showWord(){
  if(!wordBytes||wordRendering)return;
  $('#pdf-frame').hidden=true;$('#pdf-toolbar').hidden=true;$('#word-preview').hidden=false;
  $('#preview-word').setAttribute('aria-selected','true');$('#preview-pdf').setAttribute('aria-selected','false');
  if(wordReady)return;
  const token=wordGeneration;wordRendering=true;$('#preview-word').disabled=true;
  $('#status').textContent=data.language==='ar'?'جارٍ عرض ملف Word…':'Affichage du document Word…';
  try{await renderWord(wordBytes,$('#word-preview-pages'),$('#word-preview-styles'));if(destroyed||token!==wordGeneration)return;const first=$('#word-preview-pages section.contract-word'),room=$('.word-scroll').clientWidth-30,natural=first?.getBoundingClientRect().width??0;if(room>0&&natural>room){const scale=Math.max(.3,Math.floor(room/natural*10)/10);$('#word-preview-pages').style.zoom=String(scale);$('#word-zoom').value=String(scale);}wordReady=true;$('#status').textContent=data.language==='ar'?'ملف Word جاهز للمراجعة والتحميل.':'Le document Word est prêt à être vérifié et téléchargé.';}
  catch{if(!destroyed&&token===wordGeneration&&$('#status'))$('#status').textContent=data.language==='ar'?'تعذرت معاينة Word. أعد المحاولة أو راجع نسخة PDF.':'Impossible d’afficher Word. Réessayez ou consultez le PDF.';}
  finally{if(!destroyed&&token===wordGeneration){wordRendering=false;if($('#preview-word'))$('#preview-word').disabled=false;refresh();}}
 }
 const onInput=event=>{
  if(busy)return;const control=event.target;
  if(control.name==='task'){data.tasks=Array.from(root.querySelectorAll('input[name="task"]:checked'),e=>e.value);touched.add('tasks');}
  else if(control.name in data){data[control.name]=control.value;touched.add(control.name);}else return;
  revision++;clearPdf();status='';refresh();
 };
 const onChange=event=>{if(event.target.id==='word-zoom'){$('#word-preview-pages').style.zoom=event.target.value;return;}if(event.target.id==='pdf-page'||event.target.id==='pdf-zoom'){page=+$('#pdf-page').value;zoom=+$('#pdf-zoom').value;$('#pdf-frame').src=`${pdfUrl}#page=${page}&zoom=${zoom}&toolbar=1&navpanes=0`;return;}if(event.target.matches('select,input[type="checkbox"]'))onInput(event);};
 const onSubmit=event=>{event.preventDefault();if(busy)return;if(step===6)void makePdf();else go(step+1);};
 const onClick=event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.dataset.language){const lang=button.dataset.language;if(lang!==data.language){data.language=lang;revision++;clearPdf();if(step===7)step=6;status='';draw();}return;}
  if(button.dataset.step){go(+button.dataset.step);return;}
  if(button.id==='preview-word'){void showWord();return;}
  if(button.id==='preview-pdf'){$('#pdf-frame').hidden=false;$('#pdf-toolbar').hidden=false;$('#word-preview').hidden=true;$('#preview-pdf').setAttribute('aria-selected','true');$('#preview-word').setAttribute('aria-selected','false');return;}
  if(button.id==='word-download-button'){
   if(!wordBytes||!wordReady||Object.keys(allErrors()).length)return;
   const a=document.createElement('a');a.href=wordUrl;a.download=data.language==='ar'?`عقد_العمل_المنزلي_${data.start.slice(0,4)}.docx`:`Contrat_Travail_Domestique_${data.start.slice(0,4)}.docx`;a.click();$('#status').textContent=data.language==='ar'?'تم تجهيز ملف Word وبدء تحميله.':'Le téléchargement du fichier Word a commencé.';return;
  }
  if(button.id==='back-button')go(step-1);
  if(button.id==='edit-button')go(2);
  if(button.id==='reset-button'&&window.confirm(t().resetConfirm)){clearPdf();data={...blank(),language:data.language};step=1;furthest=1;attempted=false;touched.clear();revision=0;status='';draw();}
  if(button.id==='download-button'){
   if(!pdf||Object.keys(allErrors()).length)return;
   const a=document.createElement('a');a.href=pdfUrl;a.download=data.language==='ar'?`عقد_العمل_المنزلي_${data.start.slice(0,4)}.pdf`:`Contrat_Travail_Domestique_${data.start.slice(0,4)}.pdf`;a.click();status=t().downloaded;$('#status').textContent=status;
  }
 };
 const beforeUnload=event=>{if(revision>0){event.preventDefault();event.returnValue='';}};
 root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('submit',onSubmit);root.addEventListener('click',onClick);window.addEventListener('beforeunload',beforeUnload);
 draw();
 return {destroy(){destroyed=true;revision++;clearPdf();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('submit',onSubmit);root.removeEventListener('click',onClick);window.removeEventListener('beforeunload',beforeUnload);root.replaceChildren();data=blank();}};
}
