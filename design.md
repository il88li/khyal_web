# خيال — نظام التصميم (design.md)

المصدر: شعار الفرشاة الأحمر. اللون الأساسي ثابت ولا يغيّره المستخدم.

## الألوان
| الدور | فاتح | داكن |
|---|---|---|
| brand (أساسي، من الشعار) | `#CC1728` (204 23 40) | `#D62836` (214 40 54) |
| brand-lo (ضغط/تحويم) | `#A00E1E` | `#B01F2C` |
| brand-ink (نص على tint) | `#A00E1E` | `#FF8A92` |
| brand-tint (سطح مظلّل) | `#FDE9EB` | `#40161C` |
| on-brand | `#FFFFFF` | `#FFFFFF` |
| fog (خلفية الصفحة) | `#F7F8FB` | `#121212` |
| snow (بطاقة) | `#FFFFFF` | `#1B1C21` |
| mist (حقول/أسطح ثانوية) | `#EEF0F6` | `#262830` |
| ink | `#12141C` | `#EEF1F8` |

## قواعد
- لا حدود ولا ظلال زخرفية؛ الظل للارتفاع فقط (نوافذ/قوائم).
- الخط: IBM Plex Sans Arabic، ارتفاع السطر 1.7.
- الأيقونات: خطية 24px بسمك 1.5px.
- الحركة: spring أو ease-out، لا خطّي.
- الحد الأقصى: خط 32px، حشوة 24px، نصف قطر 28px.
- لا تغيير للون الأساسي من الإعدادات.

## لمسات Gen Z (إضافة — لا تغيّر اللون الأساسي)

| التوكن | فاتح | داكن | الدور |
|---|---|---|---|
| `bg` / `fog` | `#FAF6F0` عاجي دافئ | `#171512` فحمي دافئ | خلفية الصفحة |
| `accentWarm` | `#E27A44` | `#FFAB7A` | لمسة برتقالية دافئة |
| `accentMint` | `#7ED1B2` | `#98E8C9` | لمسة نعناعية فاتحة |
| `rounded-genz` | 24px | — | البطاقات الكبيرة |
| `onMedia` | `#FFFFFF` | `#FFFFFF` | نص فوق الوسائط |
| `scrim` | `#161310` | `#080706` | تعتيم خلف النوافذ |

- **العناوين الكبيرة:** خط Display (تجوال المحمَّل أصلًا) عبر `font-display`/`h1`، والنصوص تبقى IBM Plex Sans Arabic.
- **الحركة:** `duration-fast` 150ms · `duration-slow` 320ms · `ease-spring` `cubic-bezier(.34,1.56,.64,1)`.
- **الحبيبات:** طبقة `body.grain::after` بنسبة 3.5% فاتح / 4.5% داكن، وتُوقف بـ`html[data-grain="off"]` أو تلقائيًا مع `prefers-reduced-transparency`.

## توكنز iOS (المرحلة 1 — إضافية)
- أسماؤها `ios-*` فقط في `tailwind.config.ts`: نصف القطر `rounded-ios-{sm,md,lg,xl,pill}`، الظلال `shadow-ios-{card,sheet,bar,pressed}`، المسافات `p-ios-{1..16}` (4…64px)، التوقيت `ease-ios` / `ease-ios-out` و`duration-ios-{1..4}`، `min-h-touch`/`min-w-touch` (44px)، `backdrop-blur-ios-{bar,sheet}`.
- متغيرات CSS في `app/globals.css`: `--ease-ios`, `--ease-ios-out`, `--dur-1..4`, `--safe-top`, `--safe-bottom`.
- ظلال `ios-*` هي ظلال ارتفاع للعناصر العائمة فقط (شريط، ورقة، بطاقة عائمة) ولا تُستخدم زخرفة.
