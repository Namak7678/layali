import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { formatSar, waHref } from "@/lib/utils";
import { listGiftCards, updateGiftCard, type GiftCard } from "@/lib/gift-cards-server";

/**
 * Ops section: gift card desk. Confirms payment (which fires the profit ping),
 * then hands the owner a one-tap WhatsApp link that delivers the code to the
 * recipient's number, then marks the card delivered.
 */
export function GiftCardDesk({ auth }: { auth: string }) {
  const lang = useShop((s) => s.lang);
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setCards(await listGiftCards({ data: { auth } }));
    } catch {
      /* passcode flipped or session stale — OpsGate handles the sign-out path */
    }
  }, [auth]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function deliveryMessage(card: GiftCard) {
    if (lang === "ar") {
      const lines = [
        `بطاقة هدية من متجر ليالي 🎁`,
        `من: ${card.senderName}`,
        `القيمة: ${formatSar(card.amount, "ar")}`,
        `الرمز: ${card.code}`,
      ];
      if (card.note) lines.push(`رسالة: ${card.note}`);
      lines.push("صالحة سنة على كل المجموعة. للطلب راسل المتجر واذكر الرمز.");
      return lines.join("\n");
    }
    const lines = [
      "A gift card from Layali 🎁",
      `From: ${card.senderName}`,
      `Value: ${formatSar(card.amount, "en")}`,
      `Code: ${card.code}`,
    ];
    if (card.note) lines.push(`Message: ${card.note}`);
    lines.push("Valid for a year on the full collection. To order, message the store with the code.");
    return lines.join("\n");
  }

  async function patch(id: string, changes: { paid?: boolean; delivered?: boolean }) {
    if (busy) return;
    setBusy(true);
    try {
      await updateGiftCard({ data: { auth, id, ...changes } });
      await reload();
    } catch {
      toast(t(lang, "giftOpsFail"));
    }
    setBusy(false);
  }

  return (
    <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "giftOpsTitle")}</p>
      {cards.length === 0 ? (
        <p className="mt-4 px-4 py-8 text-center text-sm text-muted">{t(lang, "giftOpsEmpty")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {cards.map((card) => (
            <li key={card.id} className="rounded-2xl bg-elevated p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm tabular-nums">
                    {card.id} · {formatSar(card.amount, lang)}
                  </p>
                  <p className="text-xs text-muted">
                    {card.senderName} → {card.recipient}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{card.paid ? t(lang, "payPaid") : t(lang, "payUnpaid")}</Badge>
                  {card.delivered ? <Badge>{t(lang, "giftOpsDelivered")}</Badge> : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={card.paid ? "outline" : "default"}
                  onClick={() => patch(card.id, { paid: !card.paid })}
                  disabled={busy}
                >
                  {card.paid ? t(lang, "markUnpaid") : t(lang, "giftOpsMarkPaid")}
                </Button>
                {card.paid ? (
                  <>
                    <code className="rounded-md bg-surface px-2 py-1 text-xs tabular-nums">{card.code}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          waHref(card.recipient, deliveryMessage(card)),
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      {t(lang, "giftOpsSend")}
                    </Button>
                    {!card.delivered ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patch(card.id, { delivered: true })}
                        disabled={busy}
                      >
                        {t(lang, "giftOpsDelivered")}
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
