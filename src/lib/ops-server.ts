import { createServerFn } from "@tanstack/react-start";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { itemsCost } from "./wholesale";
import { courierRate } from "./shipping";

export type OpsStatus =
  | "new"
  | "confirmed"
  | "sourcing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OpsItem = { slug: string; sizeId: string; qty: number };

export type OpsOrder = {
  id: string;
  city: string;
  items: OpsItem[];
  giftWrap: boolean;
  promoOn: boolean;
  total: number;
  cost: number;
  shippingCost: number;
  status: OpsStatus;
  carrier: string;
  tracking: string;
  telegramSent: boolean;
  paid: boolean;
  paymentRef: string;
  createdAt: string;
};

export type OpsStock = {
  sku: string;
  slug: string;
  sizeId: string;
  onHand: number;
  reorderAt: number;
};

const ItemZ = z.object({
  slug: z.string().min(1).max(40),
  sizeId: z.string().min(1).max(20),
  qty: z.number().int().min(1).max(20),
});

const IngestZ = z.object({
  id: z.string().regex(/^LY-\d{4}$/),
  city: z.string().max(40).default(""),
  items: z.array(ItemZ).min(1).max(20),
  giftWrap: z.boolean().default(false),
  promoOn: z.boolean().default(false),
  total: z.number().int().min(0).max(200000),
});

const UpdateZ = z.object({
  id: z.string().regex(/^LY-\d{4}$/),
  status: z
    .enum(["new", "confirmed", "sourcing", "packed", "shipped", "delivered", "cancelled"])
    .optional(),
  carrier: z.string().max(20).optional(),
  tracking: z.string().max(48).optional(),
  telegramSent: z.boolean().optional(),
  paid: z.boolean().optional(),
  paymentRef: z.string().max(80).optional(),
});

const RestockZ = z.object({
  lines: z
    .array(
      z.object({
        slug: z.string().min(1).max(40),
        sizeId: z.string().min(1).max(20),
        qty: z.number().int().min(1).max(500),
      }),
    )
    .min(1)
    .max(20),
});

const TelegramZ = z.object({
  token: z.string().max(120).optional(),
  chatId: z.string().max(80).optional(),
  text: z.string().min(1).max(3900),
});

const TokenZ = z.object({
  token: z.string().max(120).optional(),
});

type TgJson = { ok?: boolean; description?: string; result?: unknown };

const SECRETS_PATH = join(process.cwd(), ".grok/secrets.json");

function readSecrets(): Record<string, string> {
  try {
    const parsed = JSON.parse(readFileSync(SECRETS_PATH, "utf8")) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.trim() && !k.startsWith("VITE_")) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function persistSecret(key: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  const next = { ...readSecrets(), [key]: trimmed };
  writeFileSync(SECRETS_PATH, `${JSON.stringify(next, null, 2)}\n`);
}

function secret(key: string) {
  const v = typeof process !== "undefined" ? process.env[key]?.trim() : "";
  if (v) return v;
  return readSecrets()[key] ?? "";
}

type TgChat = { id?: number; title?: string; first_name?: string; username?: string };
type TgUpdate = {
  message?: { chat?: TgChat };
  edited_message?: { chat?: TgChat };
  my_chat_member?: { chat?: TgChat };
  channel_post?: { chat?: TgChat };
};

function chatFromUpdates(result: unknown): { chatId: string; name: string } | null {
  const updates = Array.isArray(result) ? (result as TgUpdate[]) : [];
  for (let i = updates.length - 1; i >= 0; i -= 1) {
    const chat =
      updates[i]?.message?.chat ||
      updates[i]?.edited_message?.chat ||
      updates[i]?.my_chat_member?.chat ||
      updates[i]?.channel_post?.chat;
    if (chat?.id != null) {
      return { chatId: String(chat.id), name: chat.title || chat.first_name || chat.username || "" };
    }
  }
  return null;
}

async function telegram(token: string, method: string, body?: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as TgJson;
  return { http: res.status, json };
}

function resolveToken(passed?: string) {
  const t = passed?.trim() || secret("TELEGRAM_BOT_TOKEN");
  return t;
}

function resolveChat(passed?: string) {
  return passed?.trim() || secret("TELEGRAM_CHAT_ID");
}

type OrderRow = {
  id: string;
  city: string;
  items: string;
  gift_wrap: boolean;
  promo_on: boolean;
  total: number;
  cost: number;
  shipping_cost: number;
  status: string;
  carrier: string;
  tracking: string;
  telegram_sent: boolean;
  paid: boolean;
  payment_ref: string;
  created_at: string;
};

function mapOrder(row: OrderRow): OpsOrder {
  let items: OpsItem[] = [];
  try {
    const parsed = JSON.parse(row.items) as OpsItem[];
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    items = [];
  }
  return {
    id: row.id,
    city: row.city,
    items,
    giftWrap: Boolean(row.gift_wrap),
    promoOn: Boolean(row.promo_on),
    total: Number(row.total) || 0,
    cost: Number(row.cost) || 0,
    shippingCost: Number(row.shipping_cost) || 0,
    status: row.status as OpsStatus,
    carrier: row.carrier,
    tracking: row.tracking,
    telegramSent: Boolean(row.telegram_sent),
    paid: Boolean(row.paid),
    paymentRef: row.payment_ref ?? "",
    createdAt: row.created_at,
  };
}

export const getRails = createServerFn({ method: "GET" }).handler(async () => {
  const token = secret("TELEGRAM_BOT_TOKEN");
  let botUsername = "";
  if (token) {
    try {
      const { json } = await telegram(token, "getMe");
      const result = json.result as { username?: string } | undefined;
      botUsername = result?.username ?? "";
    } catch {
      botUsername = "";
    }
  }
  const { dbSource, getSql } = await import("@/lib/db");
  let madaPk = "";
  try {
    const sql = await getSql();
    const pkRow = await sql<{ v: string }>`select v from ops_settings where k = ${"moyasar_pk"}`;
    madaPk = pkRow[0]?.v ?? "";
  } catch {
    madaPk = "";
  }
  return {
    telegramEnv: Boolean(token),
    telegramChatEnv: Boolean(secret("TELEGRAM_CHAT_ID")),
    botUsername,
    durable: dbSource === "neon",
    madaPk,
    madaSecret: Boolean(secret("MOYASAR_SECRET_KEY")),
  };
});

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<OrderRow>`
    select id, city, items, gift_wrap, promo_on, total, cost, shipping_cost,
           status, carrier, tracking, telegram_sent, paid, payment_ref, created_at::text as created_at
    from ops_orders
    order by created_at desc
    limit 80
  `;
  return rows.map(mapOrder);
});

export const listStock = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{
    sku: string;
    slug: string;
    size_id: string;
    on_hand: number;
    reorder_at: number;
  }>`select sku, slug, size_id, on_hand, reorder_at from ops_stock order by slug, size_id`;
  return rows.map(
    (r): OpsStock => ({
      sku: r.sku,
      slug: r.slug,
      sizeId: r.size_id,
      onHand: Number(r.on_hand) || 0,
      reorderAt: Number(r.reorder_at) || 0,
    }),
  );
});

export const ingestOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => IngestZ.parse(data))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const counted = await sql<{ n: number }>`select count(*)::int as n from ops_orders`;
    if ((counted[0]?.n ?? 0) >= 200) {
      return { ok: false as const, reason: "inbox_full" };
    }
    const existing = await sql<{ id: string }>`select id from ops_orders where id = ${data.id}`;
    if (existing.length) return { ok: true as const, id: data.id, duplicate: true };
    const cost = itemsCost(data.items, data.giftWrap);
    await sql`
      insert into ops_orders (id, city, items, gift_wrap, promo_on, total, cost, status)
      values (
        ${data.id},
        ${data.city},
        ${JSON.stringify(data.items)},
        ${data.giftWrap},
        ${data.promoOn},
        ${data.total},
        ${cost},
        ${"new"}
      )
    `;
    for (const item of data.items) {
      const sku = `${item.slug}:${item.sizeId}`;
      await sql`
        update ops_stock
        set on_hand = greatest(on_hand - ${item.qty}, 0)
        where sku = ${sku}
      `;
    }
    return { ok: true as const, id: data.id, duplicate: false };
  });

export const updateOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => UpdateZ.parse(data))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<OrderRow>`
      select id, city, items, gift_wrap, promo_on, total, cost, shipping_cost,
             status, carrier, tracking, telegram_sent, paid, payment_ref, created_at::text as created_at
      from ops_orders where id = ${data.id}
    `;
    const current = rows[0];
    if (!current) return { ok: false as const, reason: "missing" };

    const status = data.status ?? current.status;
    const carrier = data.carrier ?? current.carrier;
    const tracking = data.tracking ?? current.tracking;
    const telegramSent = data.telegramSent ?? current.telegram_sent;
    const paid = data.paid ?? current.paid;
    const paymentRef = data.paymentRef ?? current.payment_ref ?? "";
    const shippingCost =
      status === "shipped" && carrier
        ? courierRate(carrier, current.city)
        : Number(current.shipping_cost) || 0;

    await sql`
      update ops_orders
      set status = ${status},
          carrier = ${carrier},
          tracking = ${tracking},
          telegram_sent = ${telegramSent},
          paid = ${paid},
          payment_ref = ${paymentRef},
          shipping_cost = ${shippingCost}
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const restockItems = createServerFn({ method: "POST" })
  .validator((data: unknown) => RestockZ.parse(data))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    for (const line of data.lines) {
      const sku = `${line.slug}:${line.sizeId}`;
      await sql`
        update ops_stock
        set on_hand = on_hand + ${line.qty}
        where sku = ${sku}
      `;
    }
    return { ok: true as const };
  });

export const notifyTelegram = createServerFn({ method: "POST" })
  .validator((data: unknown) => TelegramZ.parse(data))
  .handler(async ({ data }) => {
    const token = resolveToken(data.token);
    const chatId = resolveChat(data.chatId);
    if (!token) return { ok: false as const, reason: "missing_token" };
    if (!chatId) return { ok: false as const, reason: "missing_chat" };
    try {
      const { json } = await telegram(token, "sendMessage", {
        chat_id: chatId,
        text: data.text,
      });
      return {
        ok: Boolean(json.ok) as boolean,
        reason: json.ok ? "sent" : (json.description ?? "telegram_error"),
      };
    } catch {
      return { ok: false as const, reason: "network" };
    }
  });

export const verifyTelegram = createServerFn({ method: "POST" })
  .validator((data: unknown) => TokenZ.parse(data))
  .handler(async ({ data }) => {
    const token = resolveToken(data.token);
    if (!token) return { ok: false as const, reason: "missing_token", username: "" };
    try {
      const { json } = await telegram(token, "getMe");
      const result = json.result as { username?: string; first_name?: string } | undefined;
      if (!json.ok || !result) {
        return { ok: false as const, reason: json.description ?? "bad_token", username: "" };
      }
      return {
        ok: true as const,
        reason: "ok",
        username: result.username ?? result.first_name ?? "",
      };
    } catch {
      return { ok: false as const, reason: "network", username: "" };
    }
  });

export const discoverTelegramChat = createServerFn({ method: "POST" })
  .validator((data: unknown) => TokenZ.parse(data))
  .handler(async ({ data }) => {
    const token = resolveToken(data.token);
    if (!token) return { ok: false as const, reason: "missing_token", chatId: "", name: "" };
    try {
      const { json } = await telegram(token, "getUpdates", { offset: -40, timeout: 0 });
      if (!json.ok) {
        return { ok: false as const, reason: (json.description as string | undefined) ?? "bad_token", chatId: "", name: "" };
      }
      const found = chatFromUpdates(json.result);
      if (found) {
        persistSecret("TELEGRAM_CHAT_ID", found.chatId);
        return { ok: true as const, reason: "ok", chatId: found.chatId, name: found.name };
      }
      return { ok: false as const, reason: "no_messages", chatId: "", name: "" };
    } catch {
      return { ok: false as const, reason: "network", chatId: "", name: "" };
    }
  });

const MoyasarPkZ = z
  .string()
  .max(120)
  .regex(/^pk_(test|live)_[A-Za-z0-9]+$/);

export const getMadaKey = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ v: string }>`select v from ops_settings where k = ${"moyasar_pk"}`;
  return { pk: rows[0]?.v ?? "" };
});

export const saveMadaKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ pk: z.string().max(120) }).parse(data))
  .handler(async ({ data }) => {
    const pk = data.pk.trim();
    if (pk && !MoyasarPkZ.safeParse(pk).success) {
      return { ok: false as const, reason: "bad_key" };
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (!pk) {
      await sql`delete from ops_settings where k = ${"moyasar_pk"}`;
      return { ok: true as const };
    }
    await sql`
      insert into ops_settings (k, v) values (${"moyasar_pk"}, ${pk})
      on conflict (k) do update set v = excluded.v
    `;
    return { ok: true as const };
  });

export const confirmMadaPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        orderId: z.string().regex(/^LY-\d{4}$/),
        paymentId: z.string().min(8).max(80),
        amount: z.number().int().min(100).max(20_000_000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ id: string; total: number; paid: boolean }>`
      select id, total, paid from ops_orders where id = ${data.orderId}
    `;
    const order = rows[0];
    if (!order) return { ok: false as const, reason: "missing" };

    const sk = secret("MOYASAR_SECRET_KEY");
    if (sk) {
      try {
        const res = await fetch(`https://api.moyasar.com/v1/payments/${data.paymentId}`, {
          headers: { Authorization: `Basic ${Buffer.from(`${sk}:`).toString("base64")}` },
        });
        const body = (await res.json()) as { status?: string; amount?: number; currency?: string };
        if (body.status !== "paid" || body.currency !== "SAR" || Number(body.amount) !== data.amount) {
          return { ok: false as const, reason: "unpaid" };
        }
      } catch {
        return { ok: false as const, reason: "network" };
      }
    }

    await sql`
      update ops_orders
      set paid = ${true}, payment_ref = ${data.paymentId}
      where id = ${data.orderId}
    `;
    return { ok: true as const, verified: Boolean(sk) };
  });


