import { createServerFn } from "@tanstack/react-start";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { botToken, sendTelegram, storedChatId } from "./telegram";

/**
 * Digital gift cards — server layer.
 *
 * Public surface: createGiftCard (books a card request, no identity stored
 * beyond what the buyer typed, no payment taken). Ops surface: list + update
 * (confirm payment, mark delivered). The card code is generated server-side
 * and only revealed to the owner in /ops — never before payment confirmation.
 */

const AuthZ = z.string().min(1).max(128);

export const GIFT_TIERS = [150, 300, 500] as const;
export type GiftTier = (typeof GIFT_TIERS)[number];

const SECRETS_PATH = join(process.cwd(), ".grok/secrets.json");

function readSecrets(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(SECRETS_PATH, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function secret(key: string) {
  const v = typeof process !== "undefined" ? process.env[key]?.trim() : "";
  if (v) return v;
  return readSecrets()[key] ?? "";
}

/** Same admin gate as /ops and /setup: denied unless OPS_PASSCODE matches. */
function assertOpsAccess(auth: unknown): void {
  const expected = secret("OPS_PASSCODE");
  const given = typeof auth === "string" ? auth : "";
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (!expected) throw new Error("ops_passcode_not_configured");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("ops_access_denied");
}

/** Profit ping — same rail as confirmMadaPayment: fire-and-forget, never blocks. */
async function notifyProfitPing(ref: string, amountSar: number) {
  const url = secret("PROFIT_WEBHOOK_URL");
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "gift_card_paid",
        order_id: ref,
        amount: amountSar * 100, // halalas, consistent with the mada rail
        currency: "SAR",
        product: "gift_card",
      }),
    });
  } catch {
    /* a ping failure must never fail the ops action */
  }
}

function giftCode() {
  const b = randomBytes(4).toString("hex").toUpperCase();
  return `LYL-${b.slice(0, 4)}-${b.slice(4, 8)}`;
}

export type GiftCard = {
  id: string;
  code: string;
  amount: number;
  buyer: string;
  recipient: string;
  senderName: string;
  note: string;
  paid: boolean;
  delivered: boolean;
  createdAt: string;
};

const CreateZ = z.object({
  amount: z.union([z.literal(150), z.literal(300), z.literal(500)]),
  buyer: z.string().regex(/^\d{8,16}$/),
  recipient: z.string().regex(/^\d{8,16}$/),
  senderName: z.string().trim().min(1).max(40),
  note: z.string().trim().max(200).optional().default(""),
});

export const createGiftCard = createServerFn({ method: "POST" })
  .validator((data: unknown) => CreateZ.parse(data))
  .handler(async ({ data }) => {
    const { getSql } = await import("./db");
    const sql = await getSql();

    // Inbox protection, mirroring ingestOrder: a flood of unpaid card
    // requests must not be able to fill the database.
    const counted = await sql<{ n: number }>`
      select count(*)::int as n from ops_gift_cards where paid = false
    `;
    if ((counted[0]?.n ?? 0) >= 200) {
      return { ok: false as const, reason: "inbox_full" as const };
    }

    let id = `GC-${randomInt(1000, 9999)}`;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const clash = await sql<{ id: string }>`select id from ops_gift_cards where id = ${id}`;
      if (!clash.length) break;
      id = `GC-${randomInt(1000, 9999)}`;
    }

    const code = giftCode();
    await sql`
      insert into ops_gift_cards (id, code, amount, buyer, recipient, sender_name, note)
      values (${id}, ${code}, ${data.amount}, ${data.buyer}, ${data.recipient},
              ${data.senderName}, ${data.note})
    `;

    const token = botToken();
    const chatId = await storedChatId();
    if (token && chatId) {
      const lines = [
        `بطاقة هدية جديدة ${id}`,
        `${data.amount} ر.س`,
        `من: ${data.senderName}`,
        `المستلم: ${data.recipient}`,
      ];
      if (data.note) lines.push(`الرسالة: ${data.note}`);
      const sent = await sendTelegram(token, chatId, lines.join("\n"));
      if (sent.ok) {
        await sql`update ops_gift_cards set telegram_sent = true where id = ${id}`;
      }
    }

    // The code itself is never returned here — only the booking reference.
    return { ok: true as const, id };
  });

const ListZ = z.object({ auth: AuthZ });

export const listGiftCards = createServerFn({ method: "GET" })
  .validator((data: unknown) => ListZ.parse(data))
  .handler(async ({ data }) => {
    assertOpsAccess(data.auth);
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      code: string;
      amount: number;
      buyer: string;
      recipient: string;
      sender_name: string;
      note: string;
      paid: boolean;
      delivered: boolean;
      created_at: string;
    }>`
      select id, code, amount, buyer, recipient, sender_name, note,
             paid, delivered, created_at::text as created_at
      from ops_gift_cards
      order by created_at desc
      limit 60
    `;
    return rows.map(
      (r): GiftCard => ({
        id: r.id,
        code: r.code,
        amount: Number(r.amount) || 0,
        buyer: r.buyer,
        recipient: r.recipient,
        senderName: r.sender_name,
        note: r.note,
        paid: Boolean(r.paid),
        delivered: Boolean(r.delivered),
        createdAt: r.created_at,
      }),
    );
  });

const UpdateZ = z.object({
  auth: AuthZ,
  id: z.string().min(3).max(20),
  paid: z.boolean().optional(),
  delivered: z.boolean().optional(),
});

export const updateGiftCard = createServerFn({ method: "POST" })
  .validator((data: unknown) => UpdateZ.parse(data))
  .handler(async ({ data }) => {
    assertOpsAccess(data.auth);
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ id: string; paid: boolean; amount: number; recipient: string }>`
      select id, paid, amount, recipient from ops_gift_cards where id = ${data.id}
    `;
    const current = rows[0];
    if (!current) return { ok: false as const, reason: "missing" as const };

    const paid = data.paid ?? Boolean(current.paid);
    const delivered = data.delivered ?? undefined;

    await sql`
      update ops_gift_cards
      set paid = ${paid},
          delivered = coalesce(${delivered ?? null}::boolean, delivered)
      where id = ${data.id}
    `;

    const justPaid = paid && !Boolean(current.paid);
    if (justPaid) {
      await notifyProfitPing(data.id, Number(current.amount) || 0);
    }

    return { ok: true as const };
  });
