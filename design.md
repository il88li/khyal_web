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

## توكنز iOS (المرحلة 1 — إضافية)
- أسماؤها `ios-*` فقط في `tailwind.config.ts`: نصف القطر `rounded-ios-{sm,md,lg,xl,pill}`، الظلال `shadow-ios-{card,sheet,bar,pressed}`، المسافات `p-ios-{1..16}` (4…64px)، التوقيت `ease-ios` / `ease-ios-out` و`duration-ios-{1..4}`، `min-h-touch`/`min-w-touch` (44px)، `backdrop-blur-ios-{bar,sheet}`.
- متغيرات CSS في `app/globals.css`: `--ease-ios`, `--ease-ios-out`, `--dur-1..4`, `--safe-top`, `--safe-bottom`.
- ظلال `ios-*` هي ظلال ارتفاع للعناصر العائمة فقط (شريط، ورقة، بطاقة عائمة) ولا تُستخدم زخرفة.
