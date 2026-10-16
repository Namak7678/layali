import { createFileRoute } from "@tanstack/react-router";

/**
 * Internal profit relay: the store's checkout pings PROFIT_WEBHOOK_URL (this
 * route). The sale is written to the CTO agent's Base44 app, which triggers the
 * instant WhatsApp profit alert for the owner. Keeps checkout code unchanged.
 */
const BASE44_API = "https://base44.app/api/apps/6ab5921b9ca1863c59719606/entities/Sale";

async function relay(body: Record<string, unknown>): Promise<Response> {
  const token = (process.env.BASE44_SERVICE_TOKEN ?? "").trim();
  const orderId = String(body?.orderId ?? body?.order_id ?? "").trim();
  const amount = Number(body?.amount ?? 0);
  if (!orderId || !Number.isFinite(amount) || amount < 0) {
    return Response.json({ ok: false, error: "bad_payload", required: "orderId, amount" }, { status: 400 });
  }
  if (!token) return Response.json({ ok: false, error: "no_service_token" }, { status: 503 });

  const res = await fetch(BASE44_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderId.slice(0, 40),
      amount,
      store: String(body?.store ?? "layali").slice(0, 60),
      product: String(body?.product ?? "").slice(0, 200),
      currency: String(body?.currency ?? "SAR").slice(0, 8),
    }),
  }).catch(() => null);

  if (!res || !res.ok) {
    return Response.json({ ok: false, error: "relay_failed", status: res?.status ?? 0 }, { status: 502 });
  }
  return Response.json({ ok: true });
}

export const Route = createFileRoute("/api/profit-ping")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return relay(body);
      },
      GET: async () => Response.json({ ok: true, endpoint: "profit-ping" }),
    },
  },
});
