import { readFileSync } from "node:fs";
import { join } from "node:path";
import { answerCare } from "./care";

type TgJson = { ok?: boolean; description?: string; result?: unknown };

function readFileSecrets(): Record<string, string> {
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), ".grok/secrets.json"), "utf8")) as Record<
      string,
      unknown
    >;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.trim() && !k.startsWith("VITE_")) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

export function botToken(passed?: string) {
  const t = passed?.trim();
  if (t) return t;
  const env = typeof process !== "undefined" ? process.env.TELEGRAM_BOT_TOKEN?.trim() : "";
  if (env) return env;
  return readFileSecrets().TELEGRAM_BOT_TOKEN ?? "";
}

export function webhookSecret(token: string) {
  const compact = token.replace(/[^A-Za-z0-9]/g, "").slice(-32);
  return `Layali${compact}`.slice(0, 64);
}

export function publicOrigin() {
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^https?:\/\//, "");
  if (prod) return `https://${prod}`;
  const url = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
  if (url) return `https://${url}`;
  return "https://layali-omega.vercel.app";
}

export async function telegram(token: string, method: string, body?: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as TgJson;
  return { http: res.status, json };
}

export async function getSetting(k: string) {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ v: string }>`select v from ops_settings where k = ${k}`;
    return rows[0]?.v ?? "";
  } catch {
    return "";
  }
}

export async function setSetting(k: string, v: string) {
  const value = v.trim();
  if (!value) return;
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    insert into ops_settings (k, v) values (${k}, ${value})
    on conflict (k) do update set v = excluded.v
  `;
}

export async function storedChatId() {
  const env = typeof process !== "undefined" ? process.env.TELEGRAM_CHAT_ID?.trim() : "";
  if (env) return env;
  const file = readFileSecrets().TELEGRAM_CHAT_ID;
  if (file) return file;
  return getSetting("telegram_chat_id");
}

export async function ensureWebhook(token: string) {
  const url = `${publicOrigin()}/api/telegram`;
  const { json } = await telegram(token, "setWebhook", {
    url,
    secret_token: webhookSecret(token),
    allowed_updates: ["message", "my_chat_member"],
  });
  return { ok: Boolean(json.ok), url, reason: json.ok ? "ok" : (json.description ?? "webhook_error") };
}

export async function sendTelegram(token: string, chatId: string, text: string) {
  const { json } = await telegram(token, "sendMessage", { chat_id: chatId, text });
  return { ok: Boolean(json.ok), reason: json.ok ? "sent" : (json.description ?? "telegram_error") };
}

type Incoming = {
  message?: {
    chat?: { id?: number; first_name?: string; username?: string; title?: string };
    text?: string;
  };
  my_chat_member?: { chat?: { id?: number } };
};

export async function handleTelegramUpdate(token: string, update: Incoming) {
  const chatId =
    update.message?.chat?.id != null
      ? String(update.message.chat.id)
      : update.my_chat_member?.chat?.id != null
        ? String(update.my_chat_member.chat.id)
        : "";
  if (!chatId) return { ok: true as const, handled: false };

  await setSetting("telegram_chat_id", chatId);

  const text = String(update.message?.text ?? "").trim();
  if (!update.message) return { ok: true as const, handled: true, chatId };

  const arabic = /[\u0600-\u06FF]/.test(text) || !/[A-Za-z]{4,}/.test(text);
  const store = publicOrigin();
  let reply: string;
  if (!text || text.startsWith("/start")) {
    reply = arabic
      ? `لَيَالِي على الخط.\nالمتجر: ${store}\nالمجموعة: ${store}/shop\nاكتب عن العطر أو الشحن أو الدفع أو رقم الطلب LY-xxxx.`
      : `LAYALI is live.\nStore: ${store}\nShop: ${store}/shop\nAsk about scent, shipping, payment, or order LY-xxxx.`;
  } else {
    reply = answerCare(text, arabic ? "ar" : "en");
  }
  await sendTelegram(token, chatId, reply);
  return { ok: true as const, handled: true, chatId };
}
