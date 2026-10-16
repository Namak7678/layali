import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { createGiftCard, GIFT_TIERS } from "@/lib/gift-cards-server";
import { formatSar, waHref } from "@/lib/utils";

export const Route = createFileRoute("/gift-cards")({ component: GiftCards });

function GiftCards() {
  const lang = useShop((s) => s.lang);
  const merchant = useShop((s) => s.merchant);
  const [tier, setTier] = useState<number>(300);
  const [buyer, setBuyer] = useState("");
  const [recipient, setRecipient] = useState("");
  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [filed, setFiled] = useState<string | null>(null);

  async function submit() {
    const digits = (v: string) => v.replace(/\D/g, "");
    if (digits(buyer).length < 8 || digits(recipient).length < 8 || !senderName.trim()) {
      toast(t(lang, "required"));
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await createGiftCard({
        data: {
          amount: tier as 150 | 300 | 500,
          buyer: digits(buyer),
          recipient: digits(recipient),
          senderName: senderName.trim(),
          note: note.trim(),
        },
      });
      if (!res.ok) throw new Error(res.reason);
      setFiled(res.id);
      toast(t(lang, "giftDone"));
    } catch {
      toast(t(lang, "giftFail"));
    }
    setBusy(false);
  }

  const payMessage =
    lang === "ar"
      ? `طلب بطاقة هدية ${filed} — ${tier} ر.س. أريد إتمام الدفع.`
      : `Gift card order ${filed} — SAR ${tier}. I'd like to complete the payment.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="text-center">
        <p className="text-xs tracking-[0.28em] text-accent">{t(lang, "giftKicker")}</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{t(lang, "giftTitle")}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">{t(lang, "giftBody")}</p>
      </header>

      {filed ? (
        <section className="mx-auto mt-10 max-w-xl rounded-3xl bg-surface p-6 text-center shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "giftDone")}</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{filed}</p>
          <p className="mt-1 text-xs text-muted">{t(lang, "giftRefHint")}</p>
          <p className="mt-6 font-display text-4xl tabular-nums">{formatSar(tier, lang)}</p>
          <div className="mt-6 rounded-2xl bg-elevated p-4 text-start">
            <p className="text-sm font-medium">{t(lang, "giftPayTitle")}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{t(lang, "giftPayHint")}</p>
            {merchant.stcPay ? (
              <p className="mt-2 text-xs tabular-nums text-muted">STC Pay: {merchant.stcPay}</p>
            ) : null}
            {merchant.iban ? (
              <p className="mt-1 text-xs tabular-nums text-muted">IBAN: {merchant.iban}</p>
            ) : null}
          </div>
          {merchant.whatsapp ? (
            <Button
              className="mt-6 w-full"
              onClick={() => window.open(waHref(merchant.whatsapp, payMessage), "_blank", "noopener,noreferrer")}
            >
              {t(lang, "giftSendWa")}
            </Button>
          ) : null}
        </section>
      ) : (
        <section className="mx-auto mt-10 max-w-xl space-y-6">
          <div className="rounded-3xl bg-surface p-6 shadow-[var(--shadow-border)]">
            <p className="text-xs tracking-[0.22em] text-muted">{t(lang, "giftChoose")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {GIFT_TIERS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTier(v)}
                  className={`rounded-2xl border p-4 text-center transition-colors duration-quick ${
                    tier === v ? "border-accent bg-elevated" : "border-border hover:bg-elevated/60"
                  }`}
                >
                  <span className="block font-display text-2xl tabular-nums">{formatSar(v, lang)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-3xl bg-surface p-6 shadow-[var(--shadow-border)]">
            <Input
              inputMode="tel"
              placeholder={t(lang, "giftBuyer")}
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
            <Input
              inputMode="tel"
              placeholder={t(lang, "giftRecipient")}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <Input
              placeholder={t(lang, "giftFrom")}
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
            <Textarea
              rows={2}
              placeholder={t(lang, "giftNote")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs leading-6 text-subtle">{t(lang, "giftPrivacy")}</p>
            <Button className="w-full" onClick={submit} disabled={busy}>
              {t(lang, "giftOrder")}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
