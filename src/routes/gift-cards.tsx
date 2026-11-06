import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentRails } from "@/components/payment-rails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROMO_CODE } from "@/lib/catalog";
import { giftDue, giftPromoOn } from "@/lib/gift-money";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { createGiftCard, GIFT_TIERS } from "@/lib/gift-cards-server";
import { formatSar, waHref } from "@/lib/utils";

export const Route = createFileRoute("/gift-cards")({ component: GiftCards });

type Filed = { id: string; due: number; face: number; promoOn: boolean };

function GiftCards() {
  const lang = useShop((s) => s.lang);
  const merchant = useShop((s) => s.merchant);
  const [tier, setTier] = useState<number>(300);
  const [buyer, setBuyer] = useState("");
  const [recipient, setRecipient] = useState("");
  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");
  const [promo, setPromo] = useState("");
  const [promoOn, setPromoOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filed, setFiled] = useState<Filed | null>(null);
  const due = giftDue(tier, promoOn);

  function applyCode() {
    const ok = giftPromoOn(promo);
    setPromoOn(ok);
    toast(ok ? t(lang, "promoOk") : t(lang, "promoBad"));
  }

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
          promoCode: promoOn ? PROMO_CODE : "",
        },
      });
      if (!res.ok) throw new Error(res.reason);
      setFiled({ id: res.id, due: res.due, face: res.face, promoOn: res.promoOn });
      toast(t(lang, "giftDone"));
    } catch {
      toast(t(lang, "giftFail"));
    }
    setBusy(false);
  }

  const payMessage = filed
    ? lang === "ar"
      ? [
          `طلب بطاقة هدية ${filed.id}`,
          `قيمة البطاقة: ${formatSar(filed.face, "ar")}`,
          `المستحق: ${formatSar(filed.due, "ar")}`,
          filed.promoOn ? `الرمز: ${PROMO_CODE}` : "",
          "أريد إتمام الدفع.",
        ]
          .filter(Boolean)
          .join("\n")
      : [
          `Gift card order ${filed.id}`,
          `Card value: ${formatSar(filed.face, "en")}`,
          `Due: ${formatSar(filed.due, "en")}`,
          filed.promoOn ? `Code: ${PROMO_CODE}` : "",
          "I'd like to complete the payment.",
        ]
          .filter(Boolean)
          .join("\n")
    : "";

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
          <p className="mt-2 font-display text-3xl tabular-nums" dir="ltr">
            {filed.id}
          </p>
          <p className="mt-1 text-xs text-muted">{t(lang, "giftRefHint")}</p>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">{t(lang, "giftFace")}</dt>
              <dd className="font-display text-2xl tabular-nums">
                <bdi>{formatSar(filed.face, lang)}</bdi>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">{t(lang, "giftDue")}</dt>
              <dd className="font-display text-3xl tabular-nums">
                <bdi>{formatSar(filed.due, lang)}</bdi>
              </dd>
            </div>
          </dl>
          {filed.promoOn ? <p className="mt-3 text-xs leading-6 text-muted">{t(lang, "giftPromoNote")}</p> : null}
          <div className="mt-6 text-start">
            <PaymentRails lang={lang} stcPay={merchant.stcPay} iban={merchant.iban} />
          </div>
          {merchant.whatsapp ? (
            <Button
              className="mt-6 w-full"
              onClick={() => window.open(waHref(merchant.whatsapp, payMessage), "_blank", "noopener,noreferrer")}
            >
              {t(lang, "giftSendWa")}
            </Button>
          ) : (
            <p className="mt-6 text-sm leading-7 text-muted">{t(lang, "noWaPublic")}</p>
          )}
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
                  <span className="block font-display text-2xl tabular-nums">
                    <bdi>{formatSar(v, lang)}</bdi>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted">{t(lang, "giftDue")}</span>
              <span className="font-display text-2xl tabular-nums">
                <bdi>{formatSar(due, lang)}</bdi>
              </span>
            </div>
            {promoOn ? <p className="mt-2 text-xs leading-6 text-muted">{t(lang, "giftPromoNote")}</p> : null}
          </div>

          <div className="space-y-3 rounded-3xl bg-surface p-6 shadow-[var(--shadow-border)]">
            <Input
              inputMode="tel"
              dir="ltr"
              className={lang === "ar" ? "text-right" : undefined}
              placeholder={t(lang, "giftBuyer")}
              aria-label={t(lang, "giftBuyer")}
              autoComplete="tel"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
            <Input
              inputMode="tel"
              dir="ltr"
              className={lang === "ar" ? "text-right" : undefined}
              placeholder={t(lang, "giftRecipient")}
              aria-label={t(lang, "giftRecipient")}
              autoComplete="tel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <Input
              placeholder={t(lang, "giftFrom")}
              aria-label={t(lang, "giftFrom")}
              autoComplete="name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
            <Textarea
              rows={2}
              placeholder={t(lang, "giftNote")}
              aria-label={t(lang, "giftNote")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                value={promo}
                onChange={(e) => {
                  setPromo(e.target.value);
                  if (promoOn) setPromoOn(false);
                }}
                placeholder={t(lang, "promo")}
                aria-label={t(lang, "promo")}
                dir="ltr"
                className={`flex-1 ${lang === "ar" ? "text-right" : ""}`}
                autoCapitalize="characters"
              />
              <Button type="button" variant="outline" onClick={applyCode}>
                {t(lang, "apply")}
              </Button>
            </div>
            <PaymentRails lang={lang} stcPay={merchant.stcPay} iban={merchant.iban} />
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
