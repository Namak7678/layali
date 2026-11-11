# لَيَالِي LAYALI

دار عطور عربية في الرياض. المجموعة، الطلب، والحجوزات.

اطلب من المتجر. التحويل يصل STC Pay أو الآيبان المسجَّل باسم الدار.

## Security — admin surfaces (/ops, /setup)

The ops and setup pages and their server functions are protected by a passcode:

- Set `OPS_PASSCODE` as an environment variable in your deployment (or in `.grok/secrets.json` for local dev).
- Without `OPS_PASSCODE`, all admin server functions deny access by default.
- Customer-facing flows (checkout, payment confirmation, campaign stats) stay public and never required the admin code.
- The code is kept in the browser's sessionStorage after a successful unlock; clear it by closing the tab.

Gated server functions: `getRails`, `reconnectRails`, `listOrders`, `listStock`, `updateOrder`, `restockItems`, `verifyTelegram`, `discoverTelegramChat`, `saveMadaKey`.

## Profit notifications

Set `PROFIT_WEBHOOK_URL` (and optionally `PROFIT_WEBHOOK_KEY`) as environment
variables to make the store send a webhook every time an order is confirmed
paid — the ops agent then delivers an instant WhatsApp profit alert.

## متغيرات البيئة

### مطلوبة للتشغيل الكامل

| المتغير | الغرض | لو غاب |
|---|---|---|
| `DATABASE_URL` | اتصال Postgres (Neon). بدونه يعمل المتجر على PGlite داخل العملية | البيانات **لا تُحفظ** بعد إعادة التشغيل، والطلبات تضيع |
| `OPS_PASSCODE` | كلمة مرور لوحات الإدارة `/ops` و`/setup` | كل دوال الإدارة ترفض الوصول (سلوك آمن افتراضي)، فلا يمكن إدارة الطلبات أو المخزون |
| `MOYASAR_SECRET_KEY` | مفتاح ميسر السري لتأكيد الدفع | الدفع بالمدى/البطاقة يتعطل، ويبقى التحويل اليدوي فقط |
| `TELEGRAM_BOT_TOKEN` | توكن البوت لإشعارات الطلبات | لا تصل إشعارات للبوت |
| `TELEGRAM_CHAT_ID` | المحادثة التي تصلها الإشعارات | إشعارات البوت لا تُوجَّه لأحد |

### اختيارية

| المتغير | الغرض |
|---|---|
| `PROFIT_WEBHOOK_URL` | يُنادى عند تأكيد دفع طلب، لإرسال تنبيه ربح فوري |
| `PROFIT_WEBHOOK_KEY` | مفتاح يرسل مع النداء أعلاه للتحقق |
| `VITE_AUTH_ENABLED` | إظهار واجهة تسجيل الدخول للعملاء |

### يحقنها النظام تلقائيا (لا تُضبط يدويا)

`GROK_PROJECT_ID`, `GROK_GATE_ORIGIN`, `GROK_CONNECTORS_URL`,
`GROK_CONNECTOR_ACCESS_TOKEN`, `GROK_AUTH_CLIENT_ID`, `GROK_AUTH_CLIENT_SECRET`,
`GROK_AUTH_ISSUER`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `BASE44_SERVICE_TOKEN`.

هذه يضخها وقت التشغيل المضيف. ضبطها يدويا بقيم خاطئة يكسر المصادقة والبوابة.

## توجيهات النشر

1. **البناء:** `npm run build` يشغّل `vite build` ثم `npm run db:migrate` تلقائيا.
   لذلك فشل الاتصال بقاعدة البيانات يفشل عملية النشر كلها. تأكد من `DATABASE_URL` أولا.
2. **الترحيلات:** موجودة في `migrations/` وتُطبَّق بالترتيب. لا تعدّل ترحيلا منفّذا، أضف ملفا جديدا.
3. **بدون `DATABASE_URL`:** يعمل المتجر لكن على قاعدة مؤقتة في الذاكرة (`pglite`). يصلح للتجربة فقط، وممنوع للإنتاج.
4. **بعد النشر:** افتح `/setup` وأدخل `OPS_PASSCODE`، ثم اربط ميسر وأدخل بيانات الآيبان/STC Pay الظاهرة في صفحة الدفع.
5. **التحقق من الجاهزية:** الصفحة الرئيسية و`/shop` يجب أن ترجع 200، و`/ops` يجب أن تطلب كلمة المرور (الرفض الافتراضي = الحماية تعمل).

## حالة الجاهزية الحالية

- الواجهة والمتجر: يعملان وينشران بنجاح.
- الدفع الإلكتروني: الكود موجود، والمفتاح السري غير مضبوط في بيئة الإنتاج.
- التحويل اليدوي: الطريق البديل المتاح الآن (STC Pay أو آيبان).
- المخزون: يجب تعبئته قبل أي حملة تسويقية.


---

### N3mak AI agent

This project is part of the N3mak stack. The business agent lives on Telegram: exposure checks, website dossiers and instant quoting.
Try it: https://t.me/N3mak_bot?start=gh_layali
Product listing: https://namak7678.github.io/n3mak-ai-agent/
