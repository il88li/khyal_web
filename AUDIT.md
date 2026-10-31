# تقرير تشخيصي — مشروع «خيال» (khyal_web)

**تاريخ التقرير:** 2026-10-31
**النطاق:** مراجعة قراءة فقط (تحليل ساكن) لكل `app/`, `components/`, `lib/`, `app/globals.css`, `app/clean.css`, `tailwind.config.ts`, `design.md`, `AGENTS.md`, `DESIGN_SYSTEM.md`, `PROGRESS.md`, `middleware.ts`.
**لم يُعدَّل أي ملف مصدري.** الملف الوحيد المُنشأ هو هذا التقرير.

### المنهج والتحفّظات
- التحليل **ساكن**: لا خادم تطوير، لا قاعدة بيانات حيّة، لا متصفح في هذه البيئة.
- نسب التباين محسوبة يدويًا من قيم التوكنز في CSS، وليست نتائج قياس على جهاز.
- لم تُشغَّل `tsc` ولا `lint` ولا `build` ولا `scripts/preflight.mjs`؛ أخطاء النوعية/البناء خارج نطاق التقرير.
- أرقام الأسطر تحقّقت بـ`grep -n`. حيث لا يفيد سطر واحد (قاعدة موزّعة أو مكوّن طويل) أشير إلى الملف + المحدِّد (selector) بدل رقم مضلّل.
- الوسم: **P0** يكسر تجربة/ثقة، **P1** يضرّ الجودة بوضوح، **P2** تلميع.

---

## 1) جرد الشاشات والمكوّنات الحالية

### 1.1 المسارات (الصفحات)

| المسار | الملف | النوع | الدور | الحجم |
|---|---|---|---|---|
| `/` | `app/page.tsx` (363) | Client | الفيد: 4 تبويبات، لا نهائي، PTR، Realtime، حفظ موضع، إدراج بطاقات مبدعين وإعلانات | كبير |
| `/search` | `app/search/page.tsx` (89) | Client | بحث برومبتات + أشخاص، debounce 320ms | متوسط |
| `/community` | `app/community/page.tsx` (92) | Client | الأكثر إعجابًا/تأثيرًا هذا الأسبوع + دعوة نشر | متوسط |
| `/enhance` | `app/enhance/page.tsx` (170) | Client | ورشة التحسين: بث SSE، diff، حفظ/نشر، سجل محلي، نبرة/لغة | كبير |
| `/new` | `app/new/page.tsx` (140) | Client | نشر: صور + نص + معاينة حيّة + «جاهزية النشر» | كبير |
| `/library` | `app/library/page.tsx` (85) | Client | مكتبتي: بحث/فلترة/نسخ/نشر/حذف | متوسط |
| `/stats` | `app/stats/page.tsx` (60) | Client | إحصاءات + شارات + أفضل المنشورات | متوسط |
| `/notifications` | `app/notifications/page.tsx` (37) | Client | إشعارات حيّة + قراءة الكل | صغير |
| `/requests` | `app/requests/page.tsx` (37) | Client | طلبات متابعة معلّقة | صغير |
| `/settings` | `app/settings/page.tsx` (205) | Client | مركز إعدادات بـ7 واجهات فرعية عبر `#hash` | كبير |
| `/profile/[id]` | `app/profile/[id]/page.tsx` (376) | Client | غلاف/أفاتار/إحصاءات/أزرار/تبويبات/شبكة + تعديل وحذف | كبير |
| `/profile/[id]/network` | `app/profile/[id]/network/page.tsx` | Client | صفحة شبكة بجانب `NetworkSheet` | صغير |
| `/p/[id]` | `app/p/[id]/page.tsx` (94) | **Server** | صفحة برومبت عامة + OG + تعليقات | متوسط |
| `/verification` | `app/verification/page.tsx` (430) | Client | توثيق ثلاث مراحل + طلب | كبير |
| `/welcome` | `app/welcome/page.tsx` (81) | Client | شاشة الزائر: elastic-reel + vapor-type | متوسط |
| `/auth`, `/auth/reset` | — | Client | دخول/تسجيل/استعادة | متوسط |
| `/login` | `app/login/page.tsx` | Server | إعادة توجيه إلى `/auth` فقط | صغير |
| `/setup` | `app/setup/page.tsx` (115) | Client | إعداد أولي بعد التسجيل | متوسط |
| `/pricing` | `app/pricing/page.tsx` (64) | Client | مقارنة وترقية | صغير |
| `/safety`, `/privacy`, `/terms`, `/advertise`, `/offline` | — | مختلط | صفحات ثابتة/خدمية | صغير |
| `/admin` | `app/admin/page.tsx` + `ui.tsx` (194) + `actions.ts` | Server Actions | 7 أقسام إدارية | كبير |
| `app/error.tsx`, `app/loading.tsx`, `app/template.tsx` | — | — | حدّ خطأ، هيكل تحميل، انتقال صفحات | صغير |

مسارات API: `account, ad, bootstrap, classify, cron/daily, enhance, payment/webhook, plan, push`.

### 1.2 المكوّنات المشتركة

| المكوّن | الملف | الدور |
|---|---|---|
| Shell / Sidebar / TopBar / BottomNav / MoreSheet / Providers / OfflineBar | `components/chrome.tsx` (494) | الإطار والتنقّل وحاجز قاعدة البيانات |
| BottomSheet / Modal / Toaster / Lightbox / Gallery / Comments / Splash / VarsSheet / Chips / CopyButton | `components/ui.tsx` (775) | كل النوافذ والطبقات |
| SafeImg / Skeleton / EmptyState / ErrorState | `components/states.tsx` (155) | الحالات الثلاث (مستخدمة في 14 ملفًا) |
| PromptCard | `components/PromptCard.tsx` (418) | بطاقة البرومبت (18 `useState`) |
| PromptPeekLayer | `components/PromptPeekLayer.tsx` (299) | طبقة النص فوق الصورة |
| PromptCover / ImagePreview / NetworkSheet / AdSlot / badges / auth / icons / CardStudio / ButtonFx | — | أغلفة، معاينة، شبكة، إعلان، شارات، جلسة، أيقونات |
| CreatorCard + `components/fx/*` (8 ملفات، ~3.9k سطر) | — | تأثيرات «React Bits» لبطاقة المبدع |
| **كود ميت** | `components/kit.tsx` (132)، `components/UpgradeNote.tsx`، `lib/theme.ts` | لا يستوردها أي ملف |

### 1.3 الطبقات والقواعد
- `app/globals.css`: **1349 سطرًا، 18 `!important`** — `app/clean.css`: **454 سطرًا، 72 `!important`**.
- `tailwind.config.ts`: اللون/الخط/الزوايا/الظلال + توكنز `ios-*` إضافية.
- ثلاث مراجع تصميم متعارضة: `design.md` (أحمر `#CC1728`، IBM Plex)، `DESIGN_SYSTEM.md` (**بنفسجي `#6750A4`، Gilroy**)، و`PROGRESS.md` («برتقالي خيال»).

---

## 2) المشاكل البصرية

### 2.1 تناقض الألوان `P0`

| # | المشكلة | الدليل |
|---|---|---|
| 1 | **الهوية نفسها متعارضة بين ثلاث وثائق.** `design.md` يحدد الأحمر `#CC1728`، و`DESIGN_SYSTEM.md` يبني نظامًا بنفسجيًا كاملًا (`primary: #6750A4`, `primaryContainer: #EADDFF`)، و`PROGRESS.md` يذكر «برتقالي خيال للأزرار». | `design.md:5-14` · `DESIGN_SYSTEM.md:24-46` · `PROGRESS.md:2` |
| 2 | **توكنز متضاربة داخل نفس الملف:** الأساسي أحمر `204 23 40` لكن `--brand-tint` بنفسجي `234 221 255` (#EADDFF)، و`--brand-hi` بنفسجي `126 102 185`، و`--brand-lo` بنفسجي `79 55 139`. أي أن «خلفية الهوية» ليست مشتقّة من لون الهوية. | `app/globals.css:29-33` مقابل `app/globals.css:85-89` |
| 3 | **إصلاح جزئي في طبقة لاحقة:** `clean.css` يعيد التوكنز حمراء، فتعمل الواجهة حاليًا بالأحمر — لكن أي إعادة ترتيب للاستيراد أو أي استخدام خارج تجاوزات `clean.css` يعيد البنفسجي. | `app/clean.css:7-11` |
| 4 | **قيم سطح/نص مزدوجة:** `--c-fog` = `251 253 255` (#FBFDFF) ثم `247 248 251` (#F7F8FB، وهو ما في `design.md` و`themeColor`) — وكذلك `--c-ink-2/3` و`--c-mist`. | `app/globals.css:16-26,74-83` · `app/clean.css:7-15` · `app/layout.tsx:73-78` |
| 5 | **الحالة النشطة بأربع معالجات:** الشريط السفلي = `brand-ink`، رابط Sidebar = `brand-ink` على `brand-tint`، تبويب الفيد = «حبيبة» بيضاء + `brand-ink`، شريحة الفئة المحددة = خلفية حمراء كاملة، الأزرار الأساسية = `brand`. | `app/clean.css:41` · `app/clean.css:294-309` · `app/clean.css:306` · `app/clean.css:83-95` |
| 6 | **هيكسل مباشر في المكوّنات** خلافًا لقاعدة AGENTS: `#12141c`، `#fff`، `#111`، `#18181b`، `rgb(18 18 16/.9)`، `rgb(14 16 24/.66)`، `rgba(0,0,0,…)`، وألوان شارات/`fx` ثابتة. | `components/chrome.tsx:26-28` · `components/ui.tsx:324,377` · `components/badges.tsx:38-133` · `components/CreatorCard.tsx:50,110` · `app/clean.css:428-446` |
| 7 | **`--secondary` وردي (#7D5260) ما زال يعمل** كلون «إعجاب نشط» ولون نقطة الإشعارات — بقايا لوحة وردية لا علاقة لها بالشعار الأحمر. | `app/globals.css:989` · `app/globals.css:822` |
| 8 | **الشعار النصي لاتيني** `"khyal studio"` في أعلى كل صفحة بدل كلمة «خيال»، مع تأثير glitch. الاسم في `metadata` و`manifest` هو «خيال». | `components/chrome.tsx:23-38,153-157` |

### 2.2 طبقات CSS متضاربة وتكرار `P1`

- **تكرار المحدِّدات (آخر تعريف يفوز بـ`!important`):**
  - `.app-topbar` معرّف **6 مرات** (`app/globals.css:450,798,891` · `app/clean.css:37,247,387`)
  - `.mobile-bottomnav` **8 مرات** (`app/globals.css:843` + كتل الوسائط، `app/clean.css:39,254,396`)
  - `.field` **9 مرات** (`app/globals.css:260,716` + وسائط، `app/clean.css:178`)
  - `.chip` **4 مرات** (`app/globals.css:237,728,1081` · `app/clean.css:192`)
  - `.workspace-shell` **9 مرات** (`app/globals.css:491,512,528,883,892,913,924,951` · `app/clean.css:264`)
- **تعارض صريح مع عقيدة «أسطح مسطحة بلا تدرّجات»** (`AGENTS.md`, `design.md`): `globals.css` يعرّف في نهايته
  - `html.dark .card` بـ`backdrop-filter: blur(18px)` + حدّ أبيض + توهّج داخلي (`:1033`)،
  - `html.dark .field` بـ`conic-gradient` متحرّك `field-spin 6s linear infinite` (`:1042-1052`)،
  - نبض `tab-pulse` للتبويبات النشطة (`:1055`)،
  - `.aurora` بتدرّجين radial (`:676-690`)، بعد نسخة مسطّحة ألغت `::before` (`:189-193`)،
  - `.prompt-cover` بثلاث طبقات تدرّج + شبكة (`:1126-1165`).
  كل ذلك يُعطَّل عمليًا بـ`!important` من `clean.css:27-32,387-396` ⇒ **كود ميت متضارب** يضلّل أي تعديل.
- **`.card` نفسه متضارب:** نسخة بحدّ وظل (`app/clean.css:27-32` تلغي الحدود والظلال) ثم قواعد تُعيد الظل عند التحويم فقط (`app/clean.css:340-344`)، ونسخة `.prompt-card` بزاوية `20px !important` (`app/globals.css:877`).
- **زوايا غير موحّدة:** `design.md` يطلب زر 24px/حقل 16px/بطاقة 20px. المنفَّذ: `.btn` = `9999px` كبسولة (`app/clean.css:83-95`)، `.field` = `14px` (`app/clean.css:178`) و`16px` (`app/globals.css:260`)، `.card` = `20px !important` (`app/clean.css:27-32`).
- **أصناف Tailwind غير معرّفة** (لا تُنتج تنسيقًا):
  - `text-h2` في `app/pricing/page.tsx:33,40,51` (لا يوجد `h2` في `tailwind.config.ts` fontSize)،
  - `p-4.5` في `app/search/page.tsx:76,82` (مقياس Tailwind لا يتضمن 4.5)،
  - `gap-4.5` في `components/badges.tsx:329`.
  الأثر مباشر: عناوين أسعار بحجم خاطئ وبطاقات بحث بلا حشو.

### 2.3 مسافات غير متسقة `P1`

| العنصر | القيم | الدليل |
|---|---|---|
| حشو البطاقة | `12/13/14/16/18/20` px حسب المكوّن والبريكبوينت؛ و`--sp-card:16` مع `--sp-card-lg:20` | `app/globals.css:999-1013,1090-1091,1101-1108,1321` |
| حشو بطاقات أخرى | `p-4` ثابت في المجتمع/الإحصاءات/الإعدادات/الشروط | `app/community/page.tsx` · `app/stats/page.tsx` · `app/settings/page.tsx` (`.card`) |
| عرض العمود | الفيد 720px، الشِل 1380px، البروفايل `max-w-xl` (576)، الإعدادات `max-w-md` (448)، `DESIGN_SYSTEM.md` يقول 1200/720 | `app/globals.css:834` · `app/globals.css:491` · `app/profile/[id]/page.tsx` (`.main`) · `app/settings/page.tsx` (`.main`) |
| عناوين الصفحات | `text-2xl` في `new`/`settings`، `workspace-header-title` 24px على الويب فقط، و`text-h2` غير المعرّف في pricing | `app/new/page.tsx` · `app/globals.css:223` · `app/pricing/page.tsx:33` |
| مقاسات iOS | `--sp-card` و`--gap-card` معرّفتان ولا تُستخدمان (`--gap-card` صفر مراجع) | `app/globals.css:1090-1093` |

### 2.4 RTL مكسور أو ملتبس `P1`

- **الغالبية سليمة:** استخدام منتظم لـ`ms/me/ps/pe/start/end/inset-inline`، و`dir="rtl"` على `<html>` (`app/layout.tsx:81`).
- لكن:
  1. **سهم الرجوع معكوس:** `<Link …>← خيال</Link>` في صفحة البرومبت (الرجوع في RTL = →)، ونفس الشيء «← عودة» في المصادقة.
     `app/p/[id]/page.tsx:49` · `app/auth/page.tsx:234`.
  2. **معرض الصور مفروض LTR** داخل واجهة RTL: `direction: ltr` على المسار + تعويض `Math.abs(scrollLeft)` — الصورة الأولى تظهر يسارًا بينما بقية الواجهة تبدأ من اليمين، والنقاط تنعكس عن ترتيب الشبكة.
     `app/clean.css:224` · `components/PromptCard.tsx:268-272`.
  3. **خصائص فيزيائية متبقّية:** `offline-bar` يستخدم `left:0; right:0` بدل `inset-inline` (`app/clean.css:346-352`)؛ و`components/fx/TiltedCard.tsx:683` يستخدم `left-0 ml-3.5` كاملة.
  4. **مبدّل الاهتزاز** يعتمد `translate-x` داخل `dir="ltr"` (`app/settings/page.tsx:32-35`) — يعمل، لكنه يخالف قاعدة الخصائص المنطقية ويصبح هشًّا إن أُزيل `dir`.
  5. **الشعار اللاتيني** `"khyal studio"` بلا `dir="ltr"` ولا `unicode-bidi`، ومع إدراج رموز glitch يزداد خطر انقلاب ترتيب المحارف في سياق RTL (`components/chrome.tsx:23-38`).
  6. **`@username`** يُعرض `dir="ltr"` مع `text-start` في بعض المواضع، فيظهر محاذيًا لليسار داخل سطر عربي (`app/search/page.tsx:83-85`).

### 2.5 خطوط غير موحّدة `P1`

- **الخط المعتمد في `design.md` هو IBM Plex Sans Arabic**، لكن سلسلة `--font-sans` تبدأ بـ`"Zanjabeel", "Zanjabil", var(--font-tajawal)` ثم IBM Plex في آخر السلسلة ⇒ **الخط الفعلي Tajawal**، والخط الموصى به لا يُستخدم إلا كاحتياط أخير. `app/globals.css:12`
- **يُحمَّل خطّان عربيًّا × 4 أوزان** (Tajawal + IBM Plex) لأداء خط واحد. `app/layout.tsx:24-38`
- **`DESIGN_SYSTEM.md` يضيف خطًّا ثالثًا** (`Gilroy` + `Inter`) لا وجود له في الكود. `DESIGN_SYSTEM.md:96-102`
- **ارتفاعات السطر متضاربة:** `1.43` في `body` (`app/globals.css:127-140`)، ثم `1.7` لاحقًا، ثم `1.7` في `app/clean.css:21`، بينما `fontSize` في Tailwind يفرض 1.5/1.4 على كل صنف نصي — ثلاث قيم داخل الصفحة.
- **أحجام خارج السلّم:** `text-[10px]`, `text-[11px]`, `text-[15px]` في مكوّنات رغم وجود `micro/caption/sm` في `tailwind.config.ts` (قسم `fontSize`).
- **استخدام `font-weight` غير المعرّف:** `fontWeight: 650`, `550` في `app/globals.css` (كتل `.welcome-*`) لا تُطابق أوزان الخط المحمَّلة (400/500/600/700/800).

### 2.6 أيقونات ورموز `P2`
- `AGENTS.md` يفرض أيقونات `components/icons.tsx` فقط، لكن:
  - `♥` و`💬` إيموجي نصي في `app/stats/page.tsx:55`،
  - `🔥 ترند` إيموجي داخل شارة في `components/PromptCard.tsx:313`،
  - `✦` في صورة الإنجاز (`app/profile/[id]/page.tsx`)، `✕` في `app/admin/ui.tsx`.
- سمك الأيقونات غير موحّد: الغلاف 1.5 في `components/icons.tsx`، لكن `components/chrome.tsx` يمرّر `strokeWidth={1.8}` لبعض روابط Sidebar، و`app/clean.css` يرفع السمك إلى 2.1 للرابط النشط (`.sidebar-link[aria-current] svg`).

---

## 3) المشاكل الوظيفية

### 3.1 مصفوفة الحالات الثلاث

| الشاشة | تحميل | فراغ | خطأ | التقييم |
|---|---|---|---|---|
| `/` الفيد | ✅ `Skeleton variant="promptCard"` | ✅ مخصّص | ✅ + إعادة محاولة | جيد شكليًا، معطوب منطقيًا (§3.2-1) |
| `/library` | ✅ | ✅ + «لا نتائج» | ✅ `ErrorState` + retry | **المرجع الأفضل** (`app/library/page.tsx:60-70`) |
| `/stats` | ✅ | ✅ + شارات | ✅ + retry | جيد |
| `/verification` | ✅ | — | ✅ + retry | جيد (`app/verification/page.tsx:85-86`) |
| `/profile/[id]` | ✅ grid | ✅ 3 حالات | ✅ + retry | جيد (`:310-313`) |
| `/notifications` | ✅ | ✅ | ❌ **لا مسار خطأ** | `items` يبقى `null` عند فشل الاستعلام أو غياب الجلسة ⇒ هيكل تحميل أبدي (`app/notifications/page.tsx:13-21,29-30`) |
| `/requests` | ⚠️ 3 صناديق `animate-pulse` بدل `Skeleton` | ⚠️ «لا توجد طلبات» مضلّلة | ❌ **لا يوجد** | فشل الاستعلام = «لا توجد طلبات» كذبًا (`app/requests/page.tsx:25-26`) |
| `/community` | ⚠️ بطاقة واحدة `animate-pulse`، وبطاقة «الأكثر تأثيرًا» بلا هيكل | ⚠️ «لا نشاط كافٍ بعد» تظهر قبل وصول البيانات (`stars` يبدأ `[]`) | ⚠️ خطأ البطاقة الأولى فقط | `app/community/page.tsx:24-42,50-51,70` |
| `/search` | ⚠️ ارتفاعات ثابتة لا تطابق الشبكة | ⚠️ نص بلا أيقونة/إجراء | ⚠️ نص بلا retry | `app/search/page.tsx:76-88` |
| `/settings` | ❌ لا هيكل: الحقول تُرسم فارغة ثم تُملأ | — | ⚠️ `toast` فقط، وبعض التحديثات بلا فحص خطأ | `app/settings/page.tsx:59-60,178` |
| `/enhance` | ⚠️ `Skeleton` داخل منطقة النتيجة فقط | — | ⚠️ نص داخل الصندوق | `app/enhance/page.tsx:134` |
| `/new` | ❌ (زر `aria-busy` فقط) | — | ⚠️ `toast` عام | `app/new/page.tsx:49-66,133` |
| `/auth`, `/pricing`, `/setup` | ❌ | — | ⚠️ `pricing` ينتهي بـ`toast` بلا مسار بديل | `app/pricing/page.tsx:22-31` |

### 3.2 أخطاء منطقية `P0`

1. **الفيد قد يعلق على «فراغ كاذب» عند تبديل التبويبات بسرعة.**
   - `load()` تبدأ بـ`if (busy.current) return;` بلا جدولة (`app/page.tsx:163-166`)،
   - وعند تغيير `key` يُفرَّغ `items` ويُستدعى `load(true)` (`app/page.tsx:195-212`).
   - النتيجة: تبديل سريع بين تبويبين ⇒ الطلب الثاني يُهمل ولا `setLoading(true)` ⇒ تظهر «لا توجد برومبتات بعد. كن الأول!» مع زر نشر، وهو خطأ محتوى لا خطأ اتصال.
2. **صفحة `/p/[id]` تُرسل النص الكامل في مسار الاحتياط.**
   - أولًا `sb.rpc("prompt_gated")` (`app/p/[id]/page.tsx:29`)، وإن فشلت يجري استعلام مباشر يختار `body,enhanced` كاملين (`:32`)،
   - القصّ يحدث لاحقًا في العميل (`components/GatedPrompt.tsx` عبر `previewOf`) ⇒ أي زائر يستطيع قراءة النص من RSC payload/مصدر الصفحة. تعارض مع قاعدة رؤية البرومبت حسب المستوى.
3. **توثيق يناقض التنفيذ:** `lib/access.ts:3-5` يقول إن زر «عرض البرومبت كاملاً» يكشف النص للجميع، بينما الكود الحالي يعرض «باقي البرومبت لمشتركي خيال» ولا يوجد زر كشف (`components/PromptCard.tsx:255,338` · `components/GatedPrompt.tsx:26-32`). أحد الطرفين قديم.
4. **رسالة نجاح تُعرض كفشل:** «نسيت كلمة المرور؟» تضع «أرسلنا رابط الاستعادة إلى بريدك» في نفس متغيّر `err` المرسوم داخل صندوق أحمر `bg-danger-tint` (`app/auth/page.tsx:44-47,196-203`).
5. **رسائل إنجليزية/تقنية خام:** `setErr(ERR[error.message] ?? error.message)` (`app/auth/page.tsx:55`)، و`forgot()` تمرّر `error.message` كما هي (`:45`) — خلاف قاعدة «لا نصوص تقنية للمستخدم».
6. **`/notifications` عند غياب الجلسة:** `uid()` يعيد `null` فتبقى `items` على `null` بلا رسالة ولا تحويل (`app/notifications/page.tsx:13-21`).
7. **`/requests` قد يرسل طلبًا بلا هوية:** `act()` يستخدم `following_id: me!` و`me` قد يكون `undefined` (`app/requests/page.tsx:16-22`).
8. **`/enhance` الحفظ/النشر يفشل بصمت** عند غياب الجلسة: `if (!id || !out) return;` بلا `toast` ولا تحويل (`app/enhance/page.tsx:78-79`).
9. **نشر من `/enhance` لا يولّد عنوانًا/وسومًا/تصنيفًا** بينما `/new` يفعل (`app/new/page.tsx:39,49-66`) ⇒ بطاقات ناقصة لنفس الفعل.
10. **حالة ميتة في بطاقة البرومبت:** `const override = null` بقايا مسار تعديل قديم (`components/PromptCard.tsx:67`).
11. **صفحة `/p/[id]` بلا إجراءات:** لا إعجاب/حفظ/مشاركة/جرّب؛ كل رابط مشاركة ينتهي في صفحة بلا تحويل (`app/p/[id]/page.tsx:52-90`).
12. **`app/error.tsx` يتجاهل رسالة الخطأ** فيعرض نصًا عامًا دائمًا (`app/error.tsx:4-6`).
13. **`/new` لا يحفظ مسودة ولا يحذّر عند المغادرة**، بخلاف `/enhance` (`app/enhance/page.tsx:39`).
14. **«حساب خاص» بلا فحص خطأ:** تحديث مباشر ثم لا شيء؛ إن فشل (RLS/شبكة) يبقى المفتاح مفعولًا كذبًا (`app/settings/page.tsx:178`).
15. **حذف الحساب بتأكيد ضعيف:** `confirm()` واحد بلا إعادة كلمة مرور (`app/settings/page.tsx:92-93`).
16. **وعد تسعيري يخالف الخادم:** «تحسين بلا حدود يومية» (`app/pricing/page.tsx:8`) مقابل حدّ 10/دقيقة للمسجّل و2/ساعة و5/يوم للزائر (`app/api/enhance/route.ts:45-47,53-55`).
17. **`/search` لا يلغي طلبات Supabase** (يعتمد `stale` لمنع الكتابة فقط) ⇒ هدر شبكة واحتمال ترتيب خاطئ (`app/search/page.tsx:50-63`).
18. **`/library` نشر بلا حماية نقر مزدوج** (لا `busy`) ⇒ منشورات مكرّرة (`app/library/page.tsx:32-38`).
19. **مكوّنات بلا `ErrorState` رغم توفّره** في الشاشات الحسّاسة (الإشعارات، الطلبات، المجتمع، البحث)، وهو نمط موجود ومجرّب في المكتبة والإحصاءات.

### 3.3 نقص حالات الحافة
- **الإشعارات:** لا pagination (حد 50)، و`readAll` لا يُبطل شارة الشريط العلوي (`components/chrome.tsx:219`) لأن العدّاد لا يُحدَّث إلا بحدث Realtime أو تغيير مسار.
- **التعليقات:** حد 100 صامت بلا «تحميل المزيد»، وRealtime DELETE بلا `filter` يستمع لحذف أي تعليق في القاعدة (`components/ui.tsx:470-520`).
- **البروفايل:** حد 60 منشورًا وشبكة بلا ترقيم ولا مؤشر متبقٍّ (`app/profile/[id]/page.tsx:95`).
- **`/verification`:** 430 سطرًا في صفحة واحدة بلا تفكيك — كلفة أي تعديل عالية.

---

## 4) «العناصر المزعجة»

### 4.1 نوافذ منبثقة تلقائية

| # | العنصر | السلوك | الأثر | الدليل |
|---|---|---|---|---|
| 1 | **شاشة افتتاح** `P1` | `Splash` تغطي الشاشة بطبقة `z-100` لمدة 900–1600ms عند أول جلسة، قبل الإطار والمحتوى | تأخير مُدرَك يضاف إليه `template.tsx` (140ms) وحركة دخول البطاقات | `components/ui.tsx:645-702` · `app/template.tsx:5` |
| 2 | **حاجب «التطبيق قيد الإعداد»** `P0` | `fixed inset-0 z-[70] role="alert"` يغطّي كل شيء عند فشل bootstrap، **بلا إغلاق ولا تأجيل** | يمنع الاستخدام كليًا حتى الصفحات العامة | `components/chrome.tsx:418-427` |
| 3 | **شريط «لا يوجد اتصال»** `P1` | عائم فوق الشريط السفلي برسالة طويلة، يعتمد على `navigator.onLine` فقط | يظهر أحيانًا مع نجاح الطلبات | `components/chrome.tsx:326-360` |
| 4 | **أفعال مكرّرة داخل البطاقة** `P1` | «عبّئ المتغيرات»/«جرّبه» في طبقة الصورة **و** في الفوتر **و** في صفحة البرومبت | مساران لنفس الفعل يضاعفان الأزرار | `components/PromptCard.tsx:262-282,374-386` |

### 4.2 تنبيهات متكرّرة `P1`

- **اشتراكات Realtime متعدّدة:** `TopBar` يعيد الاشتراك عند كل تغيير مسار (`components/chrome.tsx` — `useEffect(..., [path])`)، وصفحة الإشعارات تفتح اشتراكًا ثانيًا (`app/notifications/page.tsx:15`)، إضافة إلى `prompts-live` في الفيد (`app/page.tsx:232-236`) و`c-${promptId}` لكل تعليقات مفتوحة.
- **`toast` على كل تفاعل صغير:** حفظ/إلغاء، متابعة/إلغاء، إعجاب؛ والحد 3 تنبيهات متزامنة (`slice(-2)`) يعني أن الأخير يطرد الأول (`components/ui.tsx:175-180`).
- **اهتزاز افتراضي مفعّل** في كل ضغطة (`haptic(8)` في التنقّل، `navigator.vibrate` في البطاقة)، قابل للإطفاء من الإعدادات لكنه ليس الافتراضي الأهدأ.
- **تنبيهات بلا تفاصيل أو إجراء إصلاح:** «تعذّر تنفيذ الإجراء» تكرّر في البطاقة والبروفايل والمكتبة.

### 4.3 لافتات (Banners)

| # | اللافتة | التكرار | الدليل |
|---|---|---|---|
| 1 | «مُختارة لك حسب اهتمامك بـ…» | أعلى الفيد في كل تحميل عند وجود اهتمامات | `app/page.tsx:291-296` |
| 2 | **إعلان وهمي** «أعلن لدى خيال» يظهر **حتى بلا إعلان**، داخل الفيد كل 12 بطاقة + عمود الويب | غير محدود طولًا | `components/AdSlot.tsx:66-81` · `app/page.tsx:335` · `components/chrome.tsx` (`.workspace-rail`) |
| 3 | «مفرّع من برومبت آخر…» | `/new` عند التفريع | `app/new/page.tsx:66` |
| 4 | «العنوان والتصنيف والوسوم يولّدها الذكاء الاصطناعي» | `/new` دائمًا | `app/new/page.tsx:105-109` |
| 5 | «جاهزية النشر» بأربع قواعد | `/new` تحت النص مباشرة | `app/new/page.tsx:115-129` |
| 6 | «مركز الأمان والثقة» + «حالة الإذن» + «لا أحد محظور» + «كلمة المرور» | `/settings#privacy` بمستويات متتالية | `app/settings/page.tsx:168-186` |
| 7 | «شارِك نتيجتك اليوم» بزرّين | أسفل `/community` دائمًا | `app/community/page.tsx:74-84` |
| 8 | «بطاقة إعلان» في مسار الويب + «إعلان» في الفيد | عمودان مختلفان لنفس الغرض | `components/chrome.tsx` · `components/AdSlot.tsx` |

### 4.4 أزرار مكرّرة / تنقّل مزدوج `P1`

- **ثلاث واجهات تنقّل لنفس الوجهات:** Sidebar + TopBar/MoreSheet + شريط سفلي بخمس خانات (`الرئيسية · استكشف · أنشئ · تحسين · ملفي`). «التحسين» و«مكتبتي» و«الإشعارات» و«الإعدادات» لها مدخلان أو ثلاثة. `components/chrome.tsx:39-64,246-270,272-289`.
- **طلبات المتابعة:** زر في رأس `/notifications` (`:27`) + عنصر Sidebar/MoreSheet.
- **الإعدادات:** Sidebar + زر فوق غلاف البروفايل + «تعديل الحساب».
- **`/login` مسار كامل يعيد التوجيه فقط** (`app/login/page.tsx`).
- **`confirm()` أصلية بدل النوافذ الموجودة:** 9 مواضع: `app/settings/page.tsx:93` · `app/library/page.tsx:39` · `app/profile/[id]/page.tsx:67,151` · `app/admin/ui.tsx:59,66,75,111,140,156,167,181`. مظهر المتصفح يكسر الهوية ونصّه غير مصمَّم.
- **10 أزرار في بطاقة واحدة على الهاتف:** شريط تفاعل (5) + شريط CTA (3) + مبدّل «محسّن/الأصلي» + زر متابعة. `components/PromptCard.tsx:200-400`.

### 4.5 إيماءات مزعجة `P1`
- **النقر المزدوج للإعجاب على النص** ⇒ أي نقرة عادية قد تُسجّل إعجابًا إن سبقتها نقرة خلال 320ms (`components/PromptCard.tsx:144-148`).
- **تأخير 300ms قبل فتح المعاينة** انتظارًا للنقر المزدوج ⇒ إحساس ببطء الاستجابة (`components/PromptCard.tsx:149-160`).
- **كبسولة «برومبت» تنبض مرتين** عند دخول الصورة للشاشة (`app/clean.css:430-436`).
- **`autofocus` على البحث في سطح المكتب** يسرق المؤشر (`app/search/page.tsx:45`).
- **اقتراح الفئة يكتب فوق اختيار المستخدم** في `/enhance` مع `eslint-disable` لدِبِندِنسي ناقصة (`app/enhance/page.tsx:40-46`).

---

## 5) مشاكل الأداء

### 5.1 إعادة رسم لا داعي لها

1. **`setPull` على كل `touchmove`** في الفيد: كل حركة إصبع تُحدّث حالة تُعيد رسم شجرة الفيد كاملة (مع `motion.div` وIntersectionObserver نشطين) — أخطر بند أداء. `app/page.tsx:243`
2. **Realtime يبني مصفوفة جديدة لكل حدث**: `it.map(...)` على كل العناصر عند أي `UPDATE` على `prompts`؛ ومع `like_count` المتغيّر كثيرًا يعني إعادة رسم شبه مستمرة، بلا debounce. `app/page.tsx:232-236`
3. **إعادة اشتراك الجرس عند كل تنقّل** + استعلام `count` إضافي لكل انتقال صفحة (`components/chrome.tsx` — `TopBar`, تبعية `[path]`).
4. **`useTilt` لكل بطاقة**: 3 `motionValue` + `useSpring` + مستمعي مؤشر لكل بطاقة ⇒ 10 بطاقات = 30 نابضًا نشطًا. `lib/tilt.ts:7-27` · `components/PromptCard.tsx:54`
5. **`PromptCard` ثقيلة بطبيعتها**: 18 `useState`، `motion.article`، `PromptPeekLayer`، `BottomSheet ×2`، `VarsSheet`، `ImagePreview` ديناميكي — `memo` يخفّف ولا يمنع. `components/PromptCard.tsx`
6. **`template.tsx` يلفّ كل صفحة** بـ`motion.div` ⇒ إعادة تركيب كاملة عند كل تنقّل، تُضاف إلى `Splash` و`Reveal` وحركات البطاقات (`app/template.tsx`).
7. **`FuzzyBrand`**: `MutationObserver` على `documentElement` + glitch كل 4200ms + `getComputedStyle` عند كل تغيير كلاس — في كل صفحة (`components/chrome.tsx:23-38`, `components/ui/fuzzy-text.tsx`).

### 5.2 قوائم طويلة بلا virtualization `P1`

| القائمة | السقف | windowing | ملاحظة |
|---|---|---|---|
| الفيد | **بلا سقف** (`PAGE=10` + لا نهائي) | ❌ | التخفيف الوحيد `content-visibility:auto` + `contain-intrinsic-size: 440px` (`app/clean.css:329-331`) — يخفّف الرسم لا الـDOM |
| المكتبة | 200 | ❌ | كل عنصر `motion.article` بـ`layout` |
| البروفايل | 60 | ❌ | شبكة 4:5 |
| الإحصاءات | 200 | ❌ | فرز كامل في المتصفح كل رسم |
| المجتمع | 10 + 50 | ❌ | — |
| التعليقات | 100 | ❌ | تمرير داخلي `max-h-[45vh]` |
| البحث | 20 + 20 | ❌ | — |

`content-visibility` مذكور للفيد فقط؛ لا `react-window`/windowing يدوي في أي شاشة.

### 5.3 صور بلا أبعاد (CLS) `P1`

- **31 وسم `<img>`**، منها **3 فقط** بـ`width`/`height` ظاهرين: `app/search/page.tsx:25`، `components/ui.tsx:255-276` (Gallery)، `app/auth/page.tsx` (صورة auth-story)، إضافة إلى `AdSlot` الذي يمرّرهما صراحة.
- بلا أبعاد: غلاف البروفايل `app/profile/[id]/page.tsx:229`، أفاتار `:245`، شبكة `:327`؛ صور `/new` (`app/new/page.tsx:91`)؛ `ImagePreview.tsx:154,164,192`؛ `PromptPeekLayer.tsx:257`؛ `settings:124,126`.
- **أحجام غير مناسبة:** أفاتار 36px يُحمَّل بـ`thumb(url,400)` (`app/community/page.tsx:20`)، وأفاتار في `settings`/`search`/`requests` بالرابط الأصلي بلا `thumb` (`app/settings/page.tsx:124` · `app/search/page.tsx:83` · `app/requests/page.tsx:30`).
- **`SafeImg` لا يمرّر أبعادًا** (`components/states.tsx:13-21`) ⇒ CLS قائم في كل بطاقة. و`imgSet` (srcSet) يُستخدم في موضع واحد فقط (`components/PromptCard.tsx:243`).

### 5.4 وزن الأصول والخطوط `P1`
- **خطّان × 4 أوزان** (`app/layout.tsx:24-38`) لأداء خط واحد — أكبر توفير فوري.
- **8 مكوّنات `fx`** (~3.9k سطر) تُحمَّل كلها عند فتح أي بطاقة مبدع (`components/CreatorCard.tsx:10-17`).
- **CSS متضارب:** 1803 سطرًا، 90 `!important`، وعشرات القواعد الملغاة — حجم نقل وتحليل بلا مقابل، وسطح صيانة هش.
- `@property --a` و`@keyframes field-spin` معرّفان ثم يُعطَّلان (`app/globals.css:1042-1052`) — كود ميت يُحمَّل في كل صفحة.

---

## 6) مشاكل الإتاحة

### 6.1 تباين ضعيف

| العنصر | القيمة | النسبة التقريبية | الحكم | الدليل |
|---|---|---|---|---|
| `text-ash` (placeholder، أيقونات مساعدة) | `#9E9E9E` على `#FFFFFF` | **2.6:1** | ❌ | `app/globals.css:26,261` |
| `prompt-lock-note--glass` | أبيض على `rgba(255,255,255,.18)` فوق صورة | **~1.1:1** | ❌ غير مقروء | `app/clean.css:240-244` |
| `peek-pill-i` | `rgba(255,255,255,.7)` على `rgba(0,0,0,.32)` فوق صورة | متغيّر | ⚠️ يعتمد على سطوع الصورة | `app/clean.css:428-432` |
| نص البطاقة فوق الأحمر | `text-white/90` على `#CC1728` | ~4.6:1 | ⚠️ على الحد | `components/PromptCard.tsx:327-333` |
| `smoke` على `mist` | `#79747E` على `#EEF0F6` | ~4.3:1 | ⚠️ تحت الحد بقليل | `app/globals.css:25,17` |
| `text-snow/70` على `charcoal` | — | ~5:1 | ✅ للعناصر الكبيرة | `components/ui.tsx:184` |
| `brand-ink` على `brand-tint` | `#A00E1E` على `#FDE9EB` | ~7:1 | ✅ | `app/clean.css:7-11` |

### 6.2 أحجام لمس أقل من 44px `P0`

| العنصر | الحجم | الموضع |
|---|---|---|
| `.chip` | **26px** ثم 30px | `app/globals.css:1081` · `app/clean.css:192` |
| `.seg > button` | **32px** | `app/globals.css:1079` |
| `.btn-sm` / `.btn-xs` | **32 / 28px** | `app/clean.css` (`.btn-sm`, `.btn-xs`) |
| `.prompt-social-action` | **32px** (عرض 38px) | `app/globals.css:1077` |
| `.prompt-social-icon` | **32×32px** | `app/globals.css:1078` |
| أزرار صور `/new` | **32×32px** | `app/new/page.tsx:95-103` |
| حقل التعليق / زر الإرسال | **36px** | `components/ui.tsx:625,631` |
| أزرار القبول/الرفض | **40px** | `app/requests/page.tsx:34-35` |
| حقل بحث المكتبة | **40px** | `app/library/page.tsx:50` |
| `.icon-btn` | **40px** على الويب | `app/clean.css:154-160` |
| أزرار الغلاف/الأفاتار | **36px** (`h-9 w-9`) | `app/profile/[id]/page.tsx:230-243` |

> `AGENTS.md` و`design.md` يفرضان 44px. `app/clean.css:172-175` يرفع `.btn-md`/`.icon-btn` إلى 44 **على الهاتف فقط**، والشرائح تبقى 26–30px على كل الأجهزة.

### 6.3 تسميات ونصوص بديلة `P1`

- **`aria-label` مستخدم ~100 مرة** (جيد)، لكن الفجوات:
  - زر رجوع بلا تسمية: `app/profile/[id]/network/page.tsx:34`.
  - **أزرار معرض الصور** بلا `aria-label` وصورها `alt=""` ⇒ قارئ الشاشة يعلن «زر» فقط (`components/ui.tsx:255-276`).
  - **صور Lightbox/Zoom كلها `alt=""`** (`components/ui.tsx:260,417` · `components/ImagePreview.tsx:154,164,192`).
  - **نقطة الإشعارات غير المقروء بصرية فقط**؛ الزر يحمل `aria-label="الإشعارات"` بلا عدد (`components/chrome.tsx:219`).
  - **حالة التبويبات/الشرائح** بـ`data-on` فقط بلا `aria-pressed`/`aria-selected` (`app/page.tsx` تبويبات الفيد · `components/ui.tsx:767-775` لـ`Chips`).
  - **`PromptPeekLayer`** بلا `role="dialog"` ولا إعلان عند الفتح.
- **`BottomSheet` بلا حبس تركيز**: `role="dialog" aria-modal="true"` موجود، لكن لا focus trap، لا initial focus، والخلفية ليست `inert`، والمقبض يعمل باللمس/الفأرة فقط (`components/ui.tsx:22-100`). و`Modal` بنفس النقص (`:104-160`).
- **`*:focus { outline: none }`** عام يعتمد كليًا على `:focus-visible` ⇒ أي تركيز برمجي بعد فتح ورقة يفقد الحلقة (`app/globals.css:158-159`).
- **`aria-live` غائب عن:** نتيجة التحسين المتدفّقة (`app/enhance/page.tsx:134`)، شريط «مُختارة لك» (`app/page.tsx:291`)، ومرحلة النشر في `/new` (زر `aria-busy` فقط).
- **`h1` مفقود على الهاتف** في `/search`, `/library`, `/stats`, `/notifications`, `/requests`, `/community` لأن `h1` الوحيد هو `.workspace-header` وهو `display:none` تحت 1024px (`app/globals.css:223`).
- **`lang`/`dir` للعناصر اللاتينية** غير مضبوطة في `FuzzyBrand` وبعض `@username` ⇒ قراءة معكوسة محتملة.
- **احترام تقليل الحركة جزئي:** مدعوم في `Splash`/`Toaster`/`BottomSheet`، لكن تعطيل `peek-pulse` و`tab-pulse` و`field-spin` يأتي من قواعد عامة في نهاية `clean.css`، وأي إعادة ترتيب تعيد تشغيلها.

---

## 7) خلاصة الأولويات

### P0 — أولًا
1. توحيد توكنز الهوية (إزالة البنفسجي، مصدر واحد للأسطح والنصوص) — §2.1.
2. منع «الفراغ الكاذب» في الفيد عند تبديل التبويبات — §3.2-1 (`app/page.tsx:163-166,195-212`).
3. إغلاق تسريب النص الكامل في `/p/[id]` — §3.2-2 (`app/p/[id]/page.tsx:29-34`).
4. إيقاف `setPull` على كل `touchmove` — §5.1-1.
5. رفع أحجام اللمس إلى 44px: `.chip`, `.seg>button`, `.prompt-social-*`, أزرار صور `/new` — §6.2.
6. معالجة تباين `text-ash` و`prompt-lock-note--glass` — §6.1.

### P1 — الجودة الأساسية
- مسار خطأ لـ`/notifications` و`/requests`، وهيكل حقيقي لـ`/community`, `/search`, `/settings` — §3.1.
- استبدال `confirm()` بالنوافذ المشتركة — §4.4.
- ضغط طبقات CSS وحذف التعريفات الملغاة، وإزالة `text-h2`/`p-4.5`/`gap-4.5` — §2.2.
- توحيد الخط على عائلة واحدة — §2.5.
- أبعاد/`aspect-ratio` لكل `<img>` و`thumb()` للأفاتار — §5.3.
- `aria-pressed`/`aria-selected`، عدد غير المقروء نصيًّا، وحبس تركيز للنوافذ — §6.3.

### P2 — تلميع وصيانة
- توحيد عرض الأعمدة والمسافات — §2.3.
- حذف الكود الميت: `components/kit.tsx`, `components/UpgradeNote.tsx`, `lib/theme.ts`, `app/login/page.tsx`, `override` في `PromptCard`, خاصية `compact` غير المستخدمة في `BottomSheet`, والاستيراد الفارغ في `app/community/page.tsx:6`, و`--gap-card` غير المستخدمة.
- استبدال الإيموجي بأيقونات `components/icons.tsx` — §2.6.
- تصحيح اتجاه سهم الرجوع في `/p/[id]` و`/auth` — §2.4.

---

## 8) ما لم يشمله التقرير
- تحقق بصري فعلي أو قياس Core Web Vitals/Lighthouse (لا متصفح).
- فحص أمان/RLS على قاعدة حيّة؛ البندان §3.2-2 و§3.2-15 ملاحظتان من قراءة الكود، وليستا نتيجة اختبار.
- تشغيل `tsc`/`lint`/`build`/`preflight` — قد توجد أخطاء نوعية أو مخالفات preflight لا يظهرها التحليل الساكن.
- تطبيق أندرويد (`android/`) و`sw.js` و`scripts/`.
