// Update this single register after verifying any new decree, then rebuild.
// An entry remains effective until replaced; there is no invented year-end expiry.
export const law={citationAr:'القانون رقم 19.12 بتحديد شروط الشغل والتشغيل المتعلقة بالعاملات والعمال المنزليين',citationFr:'loi n° 19.12 fixant les conditions de travail et d’emploi des travailleuses et travailleurs domestiques'};
export const officialSources=[
 {id:'law',url:'https://www.sgg.gov.ma/BO/bo_ar/2016/BO_6493_Ar.PDF',ar:`${law.citationAr} — الجريدة الرسمية عدد 6493 (22 أغسطس 2016)`,fr:`${law.citationFr} — Bulletin officiel n° 6493 (22 août 2016)`},
 {id:'model',url:'https://www.sgg.gov.ma/BO/bo_ar/2017/BO_6609_Ar.pdf',ar:'نموذج عقد العمل — المرسوم رقم 2.17.355، الجريدة الرسمية عدد 6609 (2 أكتوبر 2017)',fr:'Modèle du contrat — décret n° 2.17.355, Bulletin officiel n° 6609 (2 octobre 2017)'},
 {id:'wage',url:'https://www.sgg.gov.ma/BO/AR/3111/2025/BO_7469_Ar.pdf',ar:'الحد الأدنى القانوني للأجر — المرسوم رقم 2.25.983، الجريدة الرسمية عدد 7469 (29 ديسمبر 2025)',fr:'Salaire minimum légal — décret n° 2.25.983, Bulletin officiel n° 7469 (29 décembre 2025)'}
];
export const legal={minimumAge:18,weeklyMaximum:48,probationMaximum:15,minimumRest:24,rates:[{
 from:'2026-01-01',through:null,hourly:'17.92',share:'0.60',decree:'2.25.983',verified:'2026-11-24',
 source:'https://www.sgg.gov.ma/BO/AR/3111/2025/BO_7469_Ar.pdf'
}]};
