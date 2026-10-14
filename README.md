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
