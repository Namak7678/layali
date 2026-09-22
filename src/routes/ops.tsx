import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { products } from "@/lib/catalog";
import { t, type DictKey, type Lang } from "@/lib/i18n";
import { parseWhatsappOrder } from "@/lib/order-parse";
import {
  discoverTelegramChat,
  getRails,
  ingestOrder,
  listOrders,
  listStock,
  notifyTelegram,
  restockItems,
  updateOrder,
  verifyTelegram,
  type OpsOrder,
  type OpsStatus,
  type OpsStock,
} from "@/lib/ops-server";
import {
  bookingMessage,
  courierRate,
  couriers,
  getCourier,
  trackingMessage,
  type CourierId,
} from "@/lib/shipping";
import { useShop } from "@/lib/shop";
import { formatSar, orderId, waHref } from "@/lib/utils";
import { factoryOrderText, skuLabel, SUPPLIER, unitCost } from "@/lib/wholesale";

export const Route = createFileRoute("/ops")({ component: Ops });

const STATUS_KEY: Record<string, DictKey> = {
  new: "statusNew",
  confirmed: "statusConfirmed",
  sourcing: "statusSourcing",
  packed: "statusPacked",
  shipped: "statusShipped",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

function Ops() {
  const lang = useShop((s) => s.lang);
  const merchant = useShop((s) => s.merchant);
  const setMerchant = useShop((s) => s.setMerchant);
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [stock, setStock] = useState<OpsStock[]>([]);
  const [rails, setRails] = useState<{
    telegramEnv: boolean;
    telegramChatEnv: boolean;
    botUsername: string;
    durable: boolean;
    madaPk: string;
    madaSecret: boolean;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [awb, setAwb] = useState("");
  const [busy, setBusy] = useState(false);
  const forwarded = useRef(new Set<string>());

  const selected = orders.find((o) => o.id === selectedId) ?? orders[0] ?? null;

  const refresh = useCallback(async () => {
    try {
      const [nextOrders, nextStock, nextRails] = await Promise.all([
        listOrders(),
        listStock(),
        getRails(),
      ]);
      setOrders(nextOrders);
      setStock(nextStock);
      setRails(nextRails);
      setSelectedId((id) => id ?? nextOrders[0]?.id ?? null);
    } catch {
      /* keep last snapshot */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const tmr = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(tmr);
  }, [refresh]);

  useEffect(() => {
    if (selected) setAwb(selected.tracking);
  }, [selected?.id, selected?.tracking]);

  const canToken = Boolean(merchant.telegramToken || rails?.telegramEnv);
  const canChat = Boolean(merchant.telegramChatId || rails?.telegramChatEnv);

  useEffect(() => {
    if (!canToken || !canChat) return;
    for (const order of orders) {
      if (order.telegramSent || forwarded.current.has(order.id)) continue;
      forwarded.current.add(order.id);
      void (async () => {
        const res = await notifyTelegram({
          data: {
            token: merchant.telegramToken || undefined,
            chatId: merchant.telegramChatId || undefined,
            text: deskMessage(order, lang),
          },
        });
        if (res.ok) {
          await updateOrder({ data: { id: order.id, telegramSent: true } });
          void refresh();
        }
      })();
    }
  }, [orders, canToken, canChat, merchant.telegramToken, merchant.telegramChatId, lang, refresh]);

  const low = stock.filter((s) => s.onHand <= s.reorderAt);
  const restockLines = useMemo(
    () =>
      (low.length ? low : stock.slice(0, 3)).map((s) => ({
        slug: s.slug,
        sizeId: s.sizeId,
        qty: Math.max(SUPPLIER.moq, s.reorderAt * 4),
      })),
    [low, stock],
  );

  async function filePaste() {
    const parsed = parseWhatsappOrder(paste);
    if (!parsed) {
      toast(t(lang, "parseFail"));
      return;
    }
    setBusy(true);
    const res = await ingestOrder({
      data: {
        id: parsed.id,
        city: parsed.city,
        items: parsed.items,
        giftWrap: parsed.giftWrap,
        promoOn: parsed.promoOn,
        total: parsed.total,
      },
    });
    setBusy(false);
    if (!res.ok) toast(t(lang, "inboxFull"));
    else {
      setPaste("");
      setSelectedId(parsed.id);
      toast(parsed.id);
      void refresh();
    }
  }

  async function demoOrder() {
    setBusy(true);
    const id = orderId();
    await ingestOrder({
      data: {
        id,
        city: "الرياض",
        items: [{ slug: "riyadh", sizeId: "50", qty: 1 }],
        giftWrap: false,
        promoOn: false,
        total: 405,
      },
    });
    setSelectedId(id);
    setBusy(false);
    void refresh();
    toast(id);
  }

  async function setStatus(status: Exclude<OpsStatus, "new" | "shipped">) {
    if (!selected) return;
    await updateOrder({ data: { id: selected.id, status } });
    void refresh();
  }

  async function ship() {
    if (!selected) return;
    const tracking = awb.trim();
    if (!tracking) return;
    await updateOrder({
      data: {
        id: selected.id,
        status: "shipped",
        carrier: merchant.courierId,
        tracking,
      },
    });
    void refresh();
    toast(t(lang, "markShipped"));
  }

  async function ping() {
    if (!canToken) {
      toast(t(lang, "tgNeedToken"));
      return;
    }
    const res = await notifyTelegram({
      data: {
        token: merchant.telegramToken || undefined,
        chatId: merchant.telegramChatId || undefined,
        text: lang === "ar" ? "لَيَالِي — غرفة العمليات موصولة." : "LAYALI — ops room is live.",
      },
    });
    toast(res.ok ? t(lang, "tgSent") : t(lang, "tgMiss"));
  }

  async function onVerify() {
    const res = await verifyTelegram({ data: { token: merchant.telegramToken || undefined } });
    if (res.ok) {
      setMerchant({ telegramBotName: res.username });
      toast(`${t(lang, "tgOk")}${res.username ? ` @${res.username}` : ""}`);
    } else toast(t(lang, "tgBad"));
  }

  async function onDiscover() {
    const res = await discoverTelegramChat({ data: { token: merchant.telegramToken || undefined } });
    if (res.ok && res.chatId) {
      setMerchant({ telegramChatId: res.chatId });
      toast(res.chatId);
    } else toast(t(lang, "tgNoChat"));
  }

  function openFactory() {
    const text = factoryOrderText(restockLines, lang);
    window.open(SUPPLIER.url, "_blank", "noopener,noreferrer");
    if (merchant.supplierWhatsapp) {
      window.open(waHref(merchant.supplierWhatsapp, text), "_blank", "noopener,noreferrer");
    } else {
      void navigator.clipboard.writeText(text).then(() => toast(t(lang, "copied")));
    }
  }

  async function arrived() {
    if (!restockLines.length) return;
    await restockItems({ data: { lines: restockLines } });
    void refresh();
    toast(t(lang, "factoryArrived"));
  }

  function openPickup() {
    if (!selected) return;
    const carrier = getCourier(merchant.courierId);
    const items = selected.items.map((i) => `• ${skuLabel(i.slug, i.sizeId, lang)} × ${i.qty}`).join("\n");
    const text = bookingMessage({
      orderId: selected.id,
      city: selected.city,
      items,
      pickupCity: merchant.pickupCity,
      carrier,
      lang,
    });
    const phone = merchant.courierWhatsapp || carrier.supportWa || "";
    if (phone) window.open(waHref(phone, text), "_blank", "noopener,noreferrer");
    else void navigator.clipboard.writeText(text).then(() => toast(t(lang, "copied")));
  }

  async function copyTrack() {
    if (!selected?.tracking) return;
    const text = trackingMessage({
      orderId: selected.id,
      carrier: getCourier(selected.carrier || merchant.courierId),
      awb: selected.tracking,
      lang,
    });
    await navigator.clipboard.writeText(text);
    toast(t(lang, "copied"));
  }

  async function sendSelectedTg() {
    if (!selected) return;
    const res = await notifyTelegram({
      data: {
        token: merchant.telegramToken || undefined,
        chatId: merchant.telegramChatId || undefined,
        text: deskMessage(selected, lang),
      },
    });
    if (res.ok) {
      await updateOrder({ data: { id: selected.id, telegramSent: true } });
      toast(t(lang, "tgSent"));
      void refresh();
    } else toast(t(lang, "tgMiss"));
  }

  const waOn = Boolean(merchant.whatsapp);
  const tgOn = canToken && canChat;
  const factoryOn = Boolean(merchant.supplierWhatsapp);
  const shipOn = Boolean(merchant.courierWhatsapp);
  const cashIn = orders.filter((o) => o.paid).reduce((s, o) => s + o.total, 0);
  const cashBooked = orders
    .filter((o) => !o.paid && o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  async function markPaid(paid: boolean) {
    if (!selected) return;
    await updateOrder({ data: { id: selected.id, paid } });
    void refresh();
    toast(paid ? t(lang, "payPaid") : t(lang, "payUnpaid"));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs tracking-[0.28em] text-muted">{t(lang, "opsKicker")}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t(lang, "opsTitle")}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{t(lang, "opsBody")}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/setup">{t(lang, "setup")}</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Rail label={t(lang, "railWa")} on={waOn} lang={lang} detail={merchant.whatsapp || t(lang, "railOff")} />
        <Rail
          label={t(lang, "railTg")}
          on={tgOn}
          lang={lang}
          detail={
            rails?.botUsername || merchant.telegramBotName
              ? `@${rails?.botUsername || merchant.telegramBotName}`
              : rails?.telegramEnv
                ? t(lang, "envTg")
                : t(lang, "envTgOff")
          }
        />
        <Rail
          label={t(lang, "railFactory")}
          on={factoryOn}
          lang={lang}
          detail={`${lang === "ar" ? SUPPLIER.nameAr : SUPPLIER.nameEn} · ${lang === "ar" ? SUPPLIER.cityAr : SUPPLIER.cityEn}`}
        />
        <Rail
          label={t(lang, "railShip")}
          on={shipOn}
          lang={lang}
          detail={lang === "ar" ? getCourier(merchant.courierId).nameAr : getCourier(merchant.courierId).nameEn}
        />
      </div>
      <p className="mt-3 text-xs text-subtle">{rails?.durable ? t(lang, "durableOn") : t(lang, "durableOff")}</p>

      <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "cashTitle")}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">{t(lang, "cashReceived")}</dt>
            <dd className="mt-1 font-display text-3xl tabular-nums">{formatSar(cashIn, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t(lang, "cashBooked")}</dt>
            <dd className="mt-1 font-display text-3xl tabular-nums">{formatSar(cashBooked, lang)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted">{t(lang, "cashNone")}</p>
        <p className="mt-2 text-xs text-subtle">{t(lang, "cashStripe")}</p>
        <p className="mt-1 text-xs text-subtle">{t(lang, "cashWhop")}</p>
        <p className="mt-1 text-xs text-subtle">{rails?.madaPk ? t(lang, "cashMadaOn") : t(lang, "cashMadaOff")}</p>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.2fr]">
        <section className="space-y-4">
          <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "opsPaste")}</p>
            <p className="mt-2 text-sm text-muted">{t(lang, "opsPasteHint")}</p>
            <Textarea className="mt-3" rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={filePaste} disabled={busy}>
                {t(lang, "opsIngest")}
              </Button>
              <Button variant="outline" className="flex-1" onClick={demoOrder} disabled={busy}>
                {t(lang, "opsDemo")}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl bg-surface p-2 shadow-[var(--shadow-border)]">
            {orders.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">{t(lang, "opsEmpty")}</p>
            ) : (
              <ul>
                {orders.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-start transition-colors duration-quick ${
                        selected?.id === order.id ? "bg-elevated" : "hover:bg-elevated/60"
                      }`}
                    >
                      <span>
                        <span className="block text-sm tabular-nums">{order.id}</span>
                        <span className="text-xs text-muted">
                          {order.city || "—"} · {order.items.reduce((n, i) => n + i.qty, 0)} ·{" "}
                          {t(lang, order.paid ? "payPaid" : "payUnpaid")}
                        </span>
                      </span>
                      <span className="text-end">
                        <Badge>{t(lang, STATUS_KEY[order.status] ?? "statusNew")}</Badge>
                        <span className="mt-1 block text-xs tabular-nums text-muted">
                          {formatSar(order.total, lang)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-4">
          {selected ? (
            <OrderDesk
              order={selected}
              lang={lang}
              awb={awb}
              setAwb={setAwb}
              onStatus={setStatus}
              onShip={ship}
              onPickup={openPickup}
              onCopyTrack={copyTrack}
              onTg={sendSelectedTg}
              onPaid={markPaid}
              courierId={merchant.courierId}
            />
          ) : (
            <div className="rounded-3xl bg-surface px-5 py-16 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              {t(lang, "opsEmpty")}
            </div>
          )}

          <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "sectionTelegram")}</p>
            <p className="mt-2 text-sm text-muted">
              {rails?.telegramEnv
                ? rails.botUsername
                  ? `@${rails.botUsername} · ${t(lang, "envTg")}`
                  : t(lang, "envTg")
                : t(lang, "tgHint")}
            </p>
            {rails?.telegramEnv ? (
              <>
                <p className="mt-2 text-sm text-muted">
                  {rails.telegramChatEnv ? t(lang, "envTg") : t(lang, "tgNeedStart")}
                </p>
                {rails.botUsername ? (
                  <Button asChild className="mt-4 w-full">
                    <a href={`https://t.me/${rails.botUsername}`} target="_blank" rel="noreferrer">
                      {t(lang, "tgOpenBot")}
                    </a>
                  </Button>
                ) : null}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button variant="outline" onClick={onDiscover}>
                    {t(lang, "tgDiscover")}
                  </Button>
                  <Button variant="outline" onClick={ping} disabled={!canChat}>
                    {t(lang, "tgPing")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex h-11 items-center text-sm text-fg underline-offset-4 hover:underline"
                >
                  @BotFather
                </a>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Input
                    value={merchant.telegramToken}
                    onChange={(e) => setMerchant({ telegramToken: e.target.value })}
                    placeholder={t(lang, "tgToken")}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Input
                    value={merchant.telegramChatId}
                    onChange={(e) => setMerchant({ telegramChatId: e.target.value })}
                    placeholder={t(lang, "tgChat")}
                    autoComplete="off"
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button variant="outline" onClick={onVerify}>
                    {t(lang, "tgVerify")}
                  </Button>
                  <Button variant="outline" onClick={onDiscover}>
                    {t(lang, "tgDiscover")}
                  </Button>
                  <Button variant="outline" onClick={ping}>
                    {t(lang, "tgPing")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "stockTitle")}</p>
              <h2 className="mt-1 font-display text-2xl">{lang === "ar" ? SUPPLIER.nameAr : SUPPLIER.nameEn}</h2>
              <p className="mt-2 text-sm text-muted">{t(lang, "factoryHint")}</p>
            </div>
            <Badge>{low.length ? t(lang, "stockLow") : t(lang, "stockOk")}</Badge>
          </div>
          <ul className="mt-5 divide-y divide-border">
            {stock.map((row) => (
              <li key={row.sku} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  {skuLabel(row.slug, row.sizeId, lang)}
                  <span className="mt-0.5 block text-xs text-muted">
                    {formatSar(unitCost(row.slug, row.sizeId), lang)}
                  </span>
                </span>
                <span className={`tabular-nums ${row.onHand <= row.reorderAt ? "text-fg" : "text-muted"}`}>
                  {row.onHand}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={openFactory}>
              {t(lang, "factoryOrder")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={arrived}>
              {t(lang, "factoryArrived")}
            </Button>
          </div>
        </section>

        <section className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "sectionShip")}</p>
          <ul className="mt-4 space-y-3">
            {couriers.map((c) => {
              const active = merchant.courierId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setMerchant({ courierId: c.id })}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-start shadow-[var(--shadow-border)] transition-colors duration-quick ${
                      active ? "bg-elevated" : "bg-transparent hover:bg-elevated/60"
                    }`}
                  >
                    <span>
                      <span className="block text-sm">{lang === "ar" ? c.nameAr : c.nameEn}</span>
                      <span className="text-xs text-muted">{c.eta[lang]}</span>
                    </span>
                    <span className="text-end text-xs tabular-nums text-muted">
                      {formatSar(c.rateRiyadh, lang)}
                      <span className="block">
                        {formatSar(c.rateOther, lang)} · {lang === "ar" ? "خارج الرياض" : "other cities"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Rail({
  label,
  on,
  detail,
  lang,
}: {
  label: string;
  on: boolean;
  detail: string;
  lang: Lang;
}) {
  return (
    <div className="rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-2 text-sm">{on ? t(lang, "railOn") : t(lang, "railOff")}</p>
      <p className="mt-1 truncate text-xs text-subtle">{detail}</p>
    </div>
  );
}

function OrderDesk({
  order,
  lang,
  awb,
  setAwb,
  onStatus,
  onShip,
  onPickup,
  onCopyTrack,
  onTg,
  onPaid,
  courierId,
}: {
  order: OpsOrder;
  lang: Lang;
  awb: string;
  setAwb: (v: string) => void;
  onStatus: (status: "confirmed" | "sourcing" | "packed" | "delivered" | "cancelled") => void;
  onShip: () => void;
  onPickup: () => void;
  onCopyTrack: () => void;
  onTg: () => void;
  onPaid: (paid: boolean) => void;
  courierId: CourierId;
}) {
  const rate = courierRate(order.carrier || courierId, order.city);
  const shipCost = order.shippingCost || (order.status === "shipped" ? rate : rate);
  const profit = order.total - order.cost - shipCost;
  const carrier = getCourier(order.carrier || courierId);

  return (
    <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tabular-nums tracking-[0.22em] text-muted">{order.id}</p>
          <h2 className="mt-1 font-display text-2xl">{order.city || "—"}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{t(lang, STATUS_KEY[order.status] ?? "statusNew")}</Badge>
          <Badge>{t(lang, order.paid ? "payPaid" : "payUnpaid")}</Badge>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {order.items.map((item) => {
          const product = products.find((p) => p.slug === item.slug);
          return (
            <li key={`${item.slug}-${item.sizeId}`} className="flex items-center gap-3">
              {product ? (
                <img src={product.image} alt="" className="size-12 rounded-md object-cover" />
              ) : (
                <span className="size-12 rounded-md bg-elevated" />
              )}
              <span className="min-w-0 flex-1 text-sm">
                {skuLabel(item.slug, item.sizeId, lang)}
                <span className="block text-xs text-muted">× {item.qty}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
        <Row label={t(lang, "total")} value={formatSar(order.total, lang)} />
        <Row label={t(lang, "cost")} value={formatSar(order.cost, lang)} />
        <Row label={t(lang, "shipRate")} value={formatSar(shipCost, lang)} />
        <Row label={t(lang, "profit")} value={formatSar(profit, lang)} strong />
      </dl>
      <p className="mt-2 text-xs text-subtle">{t(lang, "profitHint")}</p>
      <Button className="mt-4 w-full" variant={order.paid ? "outline" : "default"} onClick={() => onPaid(!order.paid)}>
        {order.paid ? t(lang, "markUnpaid") : t(lang, "markPaid")}
      </Button>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onStatus("confirmed")}>
          {t(lang, "markConfirmed")}
        </Button>
        <Button variant="outline" onClick={() => onStatus("sourcing")}>
          {t(lang, "markSourcing")}
        </Button>
        <Button variant="outline" onClick={() => onStatus("packed")}>
          {t(lang, "markPacked")}
        </Button>
        <Button variant="outline" onClick={() => onStatus("delivered")}>
          {t(lang, "markDelivered")}
        </Button>
      </div>

      <div className="mt-5 flex gap-2">
        <Input value={awb} onChange={(e) => setAwb(e.target.value)} placeholder={t(lang, "tracking")} />
        <Button onClick={onShip}>{t(lang, "markShipped")}</Button>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={onPickup}>
          {t(lang, "bookPickup")}
        </Button>
        <Button variant="outline" onClick={onCopyTrack} disabled={!order.tracking}>
          {t(lang, "copyTrack")}
        </Button>
        <Button variant="outline" onClick={onTg}>
          {t(lang, "sendTg")}
        </Button>
        {order.tracking ? (
          <Button asChild variant="outline">
            <a href={carrier.track(order.tracking)} target="_blank" rel="noreferrer">
              {t(lang, "openTrack")}
            </a>
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onStatus("cancelled")}>
            {t(lang, "markCancelled")}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-medium text-fg" : ""}`}>{value}</dd>
    </div>
  );
}

function deskMessage(order: OpsOrder, lang: Lang) {
  const lines = order.items.map((i) => `• ${skuLabel(i.slug, i.sizeId, "ar")} × ${i.qty}`);
  return [
    lang === "ar" ? `طلب ${order.id} — لَيَالِي` : `Order ${order.id} — LAYALI`,
    `${lang === "ar" ? "المدينة" : "City"}: ${order.city || "—"}`,
    "",
    ...lines,
    "",
    `${lang === "ar" ? "الإجمالي" : "Total"}: ${order.total} SAR`,
    `${lang === "ar" ? "الحالة" : "Status"}: ${order.status}`,
    order.tracking ? `${lang === "ar" ? "تتبع" : "Tracking"}: ${order.tracking}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
