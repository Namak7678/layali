import { createFileRoute } from "@tanstack/react-router";
import { botToken, handleTelegramUpdate, telegram, webhookSecret } from "@/lib/telegram";

export const Route = createFileRoute("/api/telegram")({
  server: {
    handlers: {
      GET: async () => {
        const token = botToken();
        if (!token) return Response.json({ ok: false, reason: "no_bot" }, { status: 503 });
        const { json } = await telegram(token, "getWebhookInfo");
        const result = (json.result ?? {}) as { url?: string; pending_update_count?: number };
        return Response.json({
          ok: true,
          webhook: result.url ?? "",
          pending: result.pending_update_count ?? 0,
        });
      },
      POST: async ({ request }) => {
        const token = botToken();
        if (!token) return new Response("no bot", { status: 503 });
        const hdr = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (hdr !== webhookSecret(token)) return new Response("forbidden", { status: 403 });
        const update = (await request.json().catch(() => ({}))) as Parameters<typeof handleTelegramUpdate>[1];
        await handleTelegramUpdate(token, update);
        return Response.json({ ok: true });
      },
    },
  },
});
