import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MadaForm } from "@/components/mada-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { products } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { toHalala } from "@/lib/moyasar";
import { confirmMadaPayment, getMadaKey, ingestOrder, notifyTelegram } from "@/lib/ops-server";
import { totals, useShop } from "@/lib/shop";
import { formatSar, orderId, waHref } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({ component: Checkout });

const CITIES = [
  "cityRiyadh",
  "cityJeddah",
  "cityDammam",
  "cityMakkah",
  "cityMadinah",
  "cityKhobar",
  "cityAbha",
  "cityOther",
] as const;

function Checkout() {
  const lang = useShop((s) => s.lang);
  const cart = useShop((s) => s.cart);
  const giftWrap = useShop((s) => s.giftWrap);
  const setGiftWrap = useShop((s) => s.setGiftWrap);
  const promo = useShop((s) => s.promo);
  const setPromo = useShop((s) => s.setPromo);
  const applyPromo = useShop((s) => s.applyPromo);
  const promoOn = useShop((s) => s.promoOn);
  const merchant = useShop((s) => s.merchant);
  const clear = useShop((s) => s.clear);
  const sums = totals({ cart, giftWrap, promoOn });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<(typeof CITIES)[number]>("cityRiyadh");
  const [district, setDistrict] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pk, setPk] = useState("");
  const [madaOrder, setMadaOrder] = useState<string | null>(null);

  useEffect(() => {
    void getMadaKey()
      .then((r) => setPk(r.pk || merchant.moyasarKey))
      .catch(() => setPk(merchant.moyasarKey));
  }, [merchant.moyasarKey]);

  function buildMessage(id: string) {
    const lines = cart
      .map((line) => {
        const product = products.find((p) => p.slug === line.productSlug);
        const size = product?.sizes.find((s) => s.id === line.sizeId);
        if (!product || !size) return "";
        return `• ${product.name.ar} / ${product.name.en} — ${size.label.ar} × ${line.qty}`;
      })
      .filter(Boolean);
    const cityLabel = t(lang, city);
    return [
      lang === "ar" ? `طلب ${id} — لَيَالِي` : `Order ${id} — LAYALI`,
      `${lang === "ar" ? "الاسم" : "Name"}: ${name.trim()}`,
      `${lang === "ar" ? "الجوال" : "Mobile"}: ${phone.trim()}`,
      `${lang === "ar" ? "المدينة" : "City"}: ${cityLabel}${district.trim() ? ` — ${district.trim()}` : ""}`,
      "",
      ...lines,
      giftWrap ? (lang === "ar" ? "• تغليف هدية" : "• Gift wrap") : "",
      promoOn ? "LAYALI10 −10%" : "",
      "",
      `${lang === "ar" ? "الإجمالي" : "Total"}: ${formatSar(sums.total, lang)}`,
      note.trim() ? `${lang === "ar" ? "ملاحظة" : "Note"}: ${note.trim()}` : "",
      merchant.stcPay ? `STC Pay: ${merchant.stcPay}` : "",
      merchant.iban ? `IBAN: ${merchant.iban}` : "",
    ]
      .filter((x) => x !== "")
      .join("\n");
  }

  async function fileOrder(id: string) {
    const message = buildMessage(id);
    const filed = await ingestOrder({
      data: {
        id,
        city: t("ar", city),
        items: cart.map((line) => ({
          slug: line.productSlug,
          sizeId: line.sizeId,
          qty: line.qty,
        })),
        giftWrap,
        promoOn,
        total: sums.total,
      },
    });
    if (!filed.ok) throw new Error(filed.reason);
    try {
      await notifyTelegram({
        data: {
          token: merchant.telegramToken || undefined,
          chatId: merchant.telegramChatId || undefined,
          text: message,
        },
      });
    } catch {
      /* Telegram is a notify rail, not the booking */
    }
    return message;
  }

  async function submitWa() {
    if (!name.trim() || !phone.trim()) {
      toast(t(lang, "required"));
      return;
    }
    if (!cart.length || busy) return;
    const id = orderId();
    setBusy(true);
    try {
      const message = await fileOrder(id);
      setSent(id);
      toast(t(lang, "bookedOk"));
      if (merchant.whatsapp) {
        window.open(waHref(merchant.whatsapp, message), "_blank", "noopener,noreferrer");
      }
    } catch {
      toast(t(lang, "bookFail"));
    }
    setBusy(false);
  }

  async function submitMada() {
    if (!name.trim() || !phone.trim()) {
      toast(t(lang, "required"));
      return;
    }
    if (!cart.length || busy) return;
    if (!pk) {
      toast(t(lang, "madaNeedKey"));
      return;
    }
    const id = orderId();
    setBusy(true);
    try {
      await fileOrder(id);
      setMadaOrder(id);
    } catch {
      toast(t(lang, "bookFail"));
    }
    setBusy(false);
  }

  async function onMadaPaid(paymentId: string) {
    if (!madaOrder) return;
    try {
      const res = await confirmMadaPayment({
        data: { orderId: madaOrder, paymentId, amount: toHalala(sums.total) },
      });
      if (res.ok) {
        setPaid(true);
        setSent(madaOrder);
        clear();
        toast(t(lang, "paySuccess"));
        return;
      }
    } catch {
      /* fall through */
    }
    toast(t(lang, "payFailed"));
  }

  async function copySummary() {
    const id = sent ?? orderId();
    const message = buildMessage(id);
    try {
      await navigator.clipboard.writeText(message);
      toast(t(lang, "copied"));
    } catch {
      toast(t(lang, "copied"));
    }
  }

  if (cart.length === 0 && !sent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-display text-2xl">{t(lang, "emptyCart")}</p>
        <Button asChild className="mt-6">
          <Link to="/shop">{t(lang, "continue")}</Link>
        </Button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-xs tracking-[0.28em] text-muted">{sent}</p>
        <h1 className="mt-3 font-display text-4xl">{paid ? t(lang, "paySuccess") : t(lang, "thanks")}</h1>
        <p className="mt-4 text-muted">{paid ? t(lang, "payMadaBody") : t(lang, "thanksBody")}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={copySummary}>{t(lang, "copyOrder")}</Button>
          <Button asChild variant="outline">
            <Link to="/ops">{t(lang, "openOps")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/shop">{t(lang, "continue")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (madaOrder) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-xs tracking-[0.28em] text-muted">{madaOrder}</p>
        <h1 className="mt-2 font-display text-4xl">{t(lang, "payMadaTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t(lang, "payMadaBody")}</p>
        <p className="mt-4 text-sm tabular-nums">{formatSar(sums.total, lang)}</p>
        <div className="mt-6">
          <MadaForm
            amountSar={sums.total}
            orderId={madaOrder}
            publishableKey={pk}
            onPaid={onMadaPaid}
            onFail={() => toast(t(lang, "payFailed"))}
          />
        </div>
        <Button type="button" variant="outline" className="mt-6 w-full" onClick={() => setMadaOrder(null)}>
          {t(lang, "sendWa")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h1 className="font-display text-4xl">{t(lang, "checkoutTitle")}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">{t(lang, "checkoutHint")}</p>
        {!merchant.whatsapp ? (
          <p className="mt-4 rounded-2xl bg-elevated px-4 py-3 text-sm text-muted">
            {t(lang, "noWa")}{" "}
            <Link to="/setup" className="text-fg underline-offset-4 hover:underline">
              {t(lang, "setup")}
            </Link>
          </p>
        ) : null}

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitWa();
          }}
        >
          <Field label={t(lang, "name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </Field>
          <Field label={t(lang, "phone")}>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="05xxxxxxxx"
              required
            />
          </Field>
          <Field label={t(lang, "city")}>
            <select
              className="h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              value={city}
              onChange={(e) => setCity(e.target.value as (typeof CITIES)[number])}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {t(lang, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(lang, "district")}>
            <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
          </Field>
          <Field label={t(lang, "note")}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </Field>

          <label className="flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-accent"
              checked={giftWrap}
              onChange={(e) => setGiftWrap(e.target.checked)}
            />
            <span>
              <span className="block font-medium">{t(lang, "giftWrap")}</span>
              <span className="text-muted">{t(lang, "giftWrapHint")}</span>
            </span>
          </label>

          <div className="flex gap-2">
            <Input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder={t(lang, "promo")}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => toast(applyPromo() ? t(lang, "promoOk") : t(lang, "promoBad"))}
            >
              {t(lang, "apply")}
            </Button>
          </div>

          {pk ? (
            <Button type="button" className="w-full" disabled={busy} onClick={() => void submitMada()}>
              {t(lang, "madaPay")}
            </Button>
          ) : null}
          <Button type="submit" variant={pk ? "outline" : "default"} className="w-full" disabled={busy}>
            {t(lang, "sendWa")}
          </Button>
          <p className="text-xs text-subtle">{t(lang, "paymentHint")}</p>
        </form>
      </div>

      <aside className="h-fit rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <ul className="space-y-4">
          {cart.map((line) => {
            const product = products.find((p) => p.slug === line.productSlug);
            const size = product?.sizes.find((s) => s.id === line.sizeId);
            if (!product || !size) return null;
            return (
              <li key={`${line.productSlug}-${line.sizeId}`} className="flex gap-3">
                <img src={product.image} alt="" className="size-16 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{product.name[lang]}</p>
                  <p className="text-xs text-muted">
                    {size.label[lang]} × {line.qty}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatSar(size.price * line.qty, lang)}</p>
              </li>
            );
          })}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t(lang, "subtotal")}</dt>
            <dd className="tabular-nums">{formatSar(sums.sub, lang)}</dd>
          </div>
          {sums.discount ? (
            <div className="flex justify-between">
              <dt className="text-muted">{t(lang, "promoOk")}</dt>
              <dd className="tabular-nums">− {formatSar(sums.discount, lang)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">{t(lang, "shipping")}</dt>
            <dd className="tabular-nums">
              {sums.shipping ? formatSar(sums.shipping, lang) : t(lang, "freeShipping")}
            </dd>
          </div>
          {sums.wrap ? (
            <div className="flex justify-between">
              <dt className="text-muted">{t(lang, "giftWrap")}</dt>
              <dd className="tabular-nums">{formatSar(sums.wrap, lang)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between pt-2 text-base font-medium">
            <dt>{t(lang, "total")}</dt>
            <dd className="tabular-nums">{formatSar(sums.total, lang)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
