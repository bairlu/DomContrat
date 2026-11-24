# DomContrat — GitHub Pages

الموقع المنشور: https://bairlu.github.io/DomContrat/

المستودع: https://github.com/bairlu/DomContrat

التحديثات المدفوعة إلى main تُبنى وتُختبر ثم تُنشر تلقائياً عبر GitHub Actions.

منصة ثابتة لتحرير عقود العمل المنزلي بالعربية والفرنسية، عبر سبع مراحل، مع معاينة وتحميل **Word قابل للتعديل وPDF**. جميع عمليات الإدخال والتحقق والتوليد والمعاينة داخل المتصفح؛ لا Backend ولا قاعدة بيانات ولا تسجيل دخول.

## مكونات التسليم

- **حزمة الموقع الجاهز:** محتويات `dist`، للنشر من فرع GitHub دون تثبيت أدوات تطوير.
- **حزمة المصدر:** ملفات HTML وCSS وJavaScript، والتبعيات المقفلة في `package-lock.json`، والاختبارات، وملف `.github/workflows/pages.yml` للبناء والنشر باستخدام GitHub Actions.
- `ACCEPTANCE.md`: الاختبارات المنفذة وحدود الفحص المرئي.

يمكن فتح `index.html` بعد استخراج حزمة الموقع كاملة. في حزمة المصدر، ملف HTML في الجذر يستعمل ملفات dist المرفقة. عند النشر، ضع محتويات الحزمة أو المشروع في **جذر المستودع**، دون مجلد تغليف إضافي ودون رفع ZIP نفسه.

## النشر المجاني من الملفات الجاهزة

1. أنشئ مستودعاً **Public** باسم مثل `DomContrat` في حسابك على GitHub. GitHub Pages متاح للمستودعات العامة ضمن GitHub Free. [توثيق GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
2. استخرج حزمة الموقع الجاهز وارفع محتوياتها إلى جذر المستودع، بما فيها `index.html` و`app.js` و`app.css` ومجلد `brand` وملفات التراخيص و`.nojekyll`. يمكن رفع الملفات على دفعات إذا تطلبت واجهة GitHub ذلك.
3. افتح **Settings → Pages → Build and deployment**، ثم اختر **Deploy from a branch**.
4. اختر الفرع **main** والمجلد **/(root)**، ثم **Save**.
5. بعد نجاح النشر يظهر الرابط، عادةً `https://YOUR-USER.github.io/DomContrat/`. لا تستبدل اسم المستخدم أو المستودع إلا بقيم حسابك الفعلية. [إعداد مصدر النشر](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

هذه الطريقة لا تحتاج Node.js على جهاز المرتفق أو على استضافة تعمل باستمرار. جميع المسارات نسبية؛ لا يلزم تعديل الكود ليناسب اسم المستودع.

## النشر من المصدر باستخدام GitHub Actions

للمطور: استعمل Node.js 24 وnpm. ارفع محتويات حزمة المصدر إلى جذر مستودع عام. ثم اختر **Settings → Pages → Source: GitHub Actions**. لا تختَر نشر جذر فرع المصدر؛ فالنسخة المنشورة تُبنى في dist.

ملف workflow المرفق ينفذ:

```text
npm ci
npm run licenses
npm run build
npm test
```

ثم يرفع **dist فقط** وينشره. Node.js موجود في مهمة البناء المؤقتة فقط؛ لا يعمل Backend بعد النشر. يبدأ workflow عند الدفع إلى main أو من **Actions → Build and deploy DomContrat → Run workflow**. لا يحتاج إلى رموز وصول شخصية أو مفاتيح API إضافية. يجب أن تسمح إعدادات المستودع بتشغيل GitHub Actions وبيئة github-pages. [مسار النشر الرسمي](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

مثال رفع المصدر بواسطة Git، بعد استبدال رابط المستودع:

```bash
git init
git add .
git commit -m "Prepare DomContrat for GitHub Pages"
git branch -M main
git remote add origin https://github.com/YOUR-USER/DomContrat.git
git push -u origin main
```

لا يوجد مستودع GitHub منشأ أو موقع منشور تلقائياً ضمن هذا التسليم؛ الملفات جاهزة لرفعها إلى حسابك.

## التحديث والتشغيل المحلي

بعد تعديل المصدر:

```bash
npm ci
npm run licenses
npm run build
npm test
npm start
```

افتح `http://localhost:5173/`. لمنفذ آخر: `npm start -- --port=5174`.

- عند استخدام Actions: ادفع التعديل إلى main؛ يعيد workflow البناء والاختبار والنشر.
- عند استخدام الملفات الجاهزة: ارفع محتويات dist الجديدة مكان الملفات المنشورة، مع الاحتفاظ بإعداد النطاق إن كان موجوداً.
- اختبار المسارات يحاكي موقعاً داخل `/DomContrat/`، ويختبر HTML وJavaScript وCSS والشعار و`.nojekyll` تحت هذا المسار.

## ربط نطاق خاص

يلزم نطاق تملكه؛ الاستضافة المجانية لا تتضمن شراء اسم نطاق.

1. أضف اسم النطاق في **Settings → Pages → Custom domain** واحفظه **قبل** إعداد DNS لدى المزوّد.
2. لعنوان مثل `www.example.com`، أضف سجل **CNAME** باسم `www` يشير إلى `YOUR-USER.github.io`؛ لا تضع رابط HTTPS ولا اسم المستودع في قيمة DNS.
3. للنطاق الرئيسي `example.com`، استخدم ALIAS/ANAME إن كان المزوّد يدعمه، أو سجلات A المبينة في [تعليمات GitHub للنطاقات](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
4. بعد نجاح فحص DNS وإتاحة الشهادة، فعّل **Enforce HTTPS** من إعدادات Pages.
5. عند النشر من فرع، احتفظ بملف `CNAME` الذي ينشئه GitHub. إذا كنت تعيد البناء محلياً، يمكنك حفظ هذا الملف باسم `public/CNAME` لنسخه إلى dist. عند استخدام GitHub Actions، إعداد **Custom domain** في GitHub هو المعتمد، وملف CNAME غير مطلوب. [مرجع النطاق وHTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## الخصوصية والمكتبات المحلية

بيانات الاستمارة وملفات العقود في ذاكرة الصفحة فقط. لا LocalStorage ولا SessionStorage ولا IndexedDB ولا Cookies في كود التطبيق. لا تحليلات ولا API ولا CDN ولا خدمات AI أو توليد مستندات خارجية. تحديث الصفحة أو إغلاقها يفقد البيانات، مع تحذير عند المغادرة وتأكيد قبل بدء عقد جديد.

Docxtemplater وPizZip ومكتبة معاينة DOCX والخطان المستخدمان في PDF مضمّنة محلياً في الحزمة. القالبان المضمّنان فارغان؛ تُملآن داخل المتصفح بعد التحقق. لا تُرفع العقود إلى GitHub أو إلى مهمة البناء. تنزيل ملفات الموقع يمر بالاستضافة كأي زيارة ويب؛ أما حقول المستخدم ومحتوى العقود فلا تُرسل إليها.

سياسة CSP داخل HTML تمنع اتصالات JavaScript الشبكية بـ`connect-src 'none'`. لا يعتمد التطبيق على `_headers`، لأن GitHub Pages لا يطبق ملف إعدادات Netlify/Cloudflare هذا. لا تستخدم القوالب روابط خارجية. التراخيص مرفقة؛ لا تُستخدم إضافات Docxtemplater التجارية.

## ملفات الصيانة

- `src/app.js`: المراحل والمعاينة والتحرير والتحميل.
- `src/word.js`: ملء قوالب DOCX بواسطة Docxtemplater وPizZip.
- `scripts/word-templates.mjs`: إعداد قوالب Word A4 للنص الحالي؛ لا يعالج بيانات مستخدمين.
- `src/word-templates.js`: قالبان فارغان مولّدان ومضمّنان؛ لا تعدّلهما يدوياً.
- `src/pdf.js`: نص العقد الحالي وتقسيم PDF. يستخدمه Word أيضاً لمنع اختلاف المواد والبيانات بين الصيغتين.
- `src/legal.js` و`src/legal-config.js`: التحقق وحساب الأجر والمعايير المركزية.
- `src/i18n.js`: العربية والفرنسية.

تُحفظ المواد السبع وصياغة الجنس المختار والمهام الحرة. تُختار فترة اختبار CDI من 1 إلى 15 يوماً، ولا يُضاف اختبار تلقائي إلى CDD. يظل مرجع الأجر الساري بحاجة إلى تحديث إداري موثق عند صدور مرسوم جديد؛ لا يوجد اكتشاف آلي للتشريع عبر الإنترنت.

## التحقق وحدود الاعتماد

تُختبر بنية DOCX القابلة للتحرير ومطابقة النص الكامل للقالب الحالي، والمعاينة الفعلية عبر docx-preview في اختبارات DOM، والتحرير والتحميل دون شبكة أو تخزين. كما تُختبر PDF والتحققات القانونية ومسارات الاستضافة الفرعية.

قد تختلف صفحات Word بين المتصفح وMicrosoft Word بحسب الخطوط ومحرك الطباعة. تعذر الفحص البصري الأصلي لـWord هنا لغياب LibreOffice؛ اختُبرت النسخة المنشورة في المتصفح، دون ادعاء اختبار هواتف فعلية. راجع تقرير القبول، وافحص العرض والطباعة على الأجهزة المستهدفة قبل الاعتماد المؤسساتي النهائي.


## تنسيق العقود والمزايا الاختيارية

Word يحدد Arial للخط العربي واللاتيني دون توزيع ملف الخط التجاري. بيانات الاستمارة المعبأة غليظة وعناوين المواد بحجم 16 نقطة. PDF يضمّن Amiri المرخّص وفق OFL مع البيانات الغليظة والعناوين الأكبر؛ لا يُعاد توزيع Arial المرفق مع Windows ضمن ملفات الموقع. لتضمين Arial في تطبيق التوليد العام يلزم ملف خط مع ترخيص يسمح بتوزيعه واستخدامه داخل التطبيق.

عند اختيار الغذاء أو المأوى أو كليهما، أو إدخال مزايا أخرى في الخانة الحرة الاختيارية، تظهر المادة 8 داخل العقد وقبل توقيعي الطرفين، دون ملحق أو صفحة منفصلة مفروضة. تبقى المواد السبع كما هي، ولا تُخصم المزايا من الأجر النقدي ولا تقلص الحقوق. إذا لم تُدخل مزايا لا تظهر المادة 8.
