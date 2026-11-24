export function professionalRole(data){
 if(!['male','female'].includes(data.gender))return '';
 return data.language==='fr'?(data.gender==='female'?'Travailleuse domestique':'Travailleur domestique'):(data.gender==='female'?'عاملة منزلية':'عامل منزلي');
}
export function contractFilename(data){
 const name=`${data.workerFirst??''} ${data.workerLast??''}`.replace(/[<>:"/\\|?*\u0000-\u001f\u200e\u200f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,180);
 if(!name)throw Error('MISSING_WORKER_NAME');
 return `عقد العمل المنزلي - (${name}).pdf`;
}
