import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { discoverTelegramChat, saveMadaKey, getMadaKey, verifyTelegram } from "@/lib/ops-server";
import { useShop } from "@/lib/shop";
import { isMoyasarPk } from "@/lib/moyasar";
import { couriers, isCourierId, type CourierId } from "@/lib/shipping";
import { SUPPLIER } from "@/lib/wholesale";
import { sanitizePhone } from "@/lib/utils";

export const Route = createFileRoute("/setup")({ component: Setup });

function Setup() {
  const lang = useShop((s) => s.lang);
  const merchant = useShop((s) => s.merchant);
  const setMerchant = useShop((s) => s.setMerchant);
  const [whatsapp, setWhatsapp] = useState(merchant.whatsapp);
  const [stcPay, setStcPay] = useState(merchant.stcPay);
  const [iban, setIban] = useState(merchant.iban);
  const [telegramToken, setTelegramToken] = useState(merchant.telegramToken);
  const [telegramChatId, setTelegramChatId] = useState(merchant.telegramChatId);
  const [supplierWhatsapp, setSupplierWhatsapp] = useState(merchant.supplierWhatsapp);
  const [courierId, setCourierId] = useState<CourierId>(merchant.courierId);
  const [courierWhatsapp, setCourierWhatsapp] = useState(merchant.courierWhatsapp);
  const [pickupCity, setPickupCity] = useState(merchant.pickupCity);
  const [moyasarKey, setMoyasarKey] = useState(merchant.moyasarKey);
  const [instagram, setInstagram] = useState(merchant.instagram);
  const [tiktok, setTiktok] = useState(merchant.tiktok);
  const [snapchat, setSnapchat] = useState(merchant.snapchat);
  const [xHandle, setXHandle] = useState(merchant.x);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWhatsapp(merchant.whatsapp);
    setStcPay(merchant.stcPay);
    setIban(merchant.iban);
    setTelegramToken(merchant.telegramToken);
    setTelegramChatId(merchant.telegramChatId);
    setSupplierWhatsapp(merchant.supplierWhatsapp);
    setCourierId(merchant.courierId);
    setCourierWhatsapp(merchant.courierWhatsapp);
    setPickupCity(merchant.pickupCity);
    setMoyasarKey(merchant.moyasarKey);
    setInstagram(merchant.instagram);
    setTiktok(merchant.tiktok);
    setSnapchat(merchant.snapchat);
    setXHandle(merchant.x);
  }, [merchant]);

  useEffect(() => {
    void getMadaKey()
      .then((r) => {
        if (r.pk) {
          setMoyasarKey(r.pk);
          setMerchant({ moyasarKey: r.pk });
        }
      })
      .catch(() => undefined);
  }, [setMerchant]);

  function save() {
    const digits = sanitizePhone(whatsapp);
    setMerchant({
      whatsapp: digits,
      stcPay: stcPay.trim(),
      iban: iban.trim(),
      telegramToken: telegramToken.trim(),
      telegramChatId: telegramChatId.trim(),
      supplierWhatsapp,
      courierId,
      courierWhatsapp,
      pickupCity: pickupCity.trim() || "الرياض",
      moyasarKey: moyasarKey.trim(),
      instagram: instagram.trim().replace(/^@/, ""),
      tiktok: tiktok.trim().replace(/^@/, ""),
      snapchat: snapchat.trim().replace(/^@/, ""),
      x: xHandle.trim().replace(/^@/, ""),
    });
    const pk = moyasarKey.trim();
    if (pk && !isMoyasarPk(pk)) {
      toast(t(lang, "madaBad"));
      return;
    }
    void saveMadaKey({ data: { pk } }).then((res) => {
      if (res.ok && pk) toast(t(lang, "madaOk"));
    });
    const origin = window.location.origin;
    const url = digits ? `${origin}/?wa=${digits}` : origin;
    setLink(url);
    toast(t(lang, "saved"));
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast(t(lang, "copied"));
    } catch {
      toast(t(lang, "copied"));
    }
  }

  async function onVerify() {
    setBusy(true);
    try {
      const res = await verifyTelegram({ data: { token: telegramToken } });
      if (res.ok) {
        setMerchant({ telegramToken: telegramToken.trim(), telegramBotName: res.username });
        toast(`${t(lang, "tgOk")}${res.username ? ` @${res.username}` : ""}`);
      } else toast(t(lang, "tgBad"));
    } catch {
      toast(t(lang, "tgBad"));
    }
    setBusy(false);
  }

  async function onDiscover() {
    setBusy(true);
    try {
      const res = await discoverTelegramChat({ data: { token: telegramToken } });
      if (res.ok && res.chatId) {
        setTelegramChatId(res.chatId);
        setMerchant({ telegramToken: telegramToken.trim(), telegramChatId: res.chatId });
        toast(`${t(lang, "tgOk")} ${res.chatId}`);
      } else toast(t(lang, "tgNoChat"));
    } catch {
      toast(t(lang, "tgNoChat"));
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-4xl">{t(lang, "setupTitle")}</h1>
      <p className="mt-3 text-sm text-muted">{t(lang, "setupBody")}</p>

      <form
        className="mt-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Section title={t(lang, "sectionStore")}>
          <Field label={t(lang, "waNumber")}>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              inputMode="tel"
              placeholder="9665xxxxxxxx"
              required
            />
          </Field>
          <Field label={t(lang, "stcPay")}>
            <Input value={stcPay} onChange={(e) => setStcPay(e.target.value)} placeholder="05xxxxxxxx" />
          </Field>
          <Field label={t(lang, "iban")}>
            <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="SA00..." />
          </Field>
        </Section>

        <Section title={t(lang, "sectionSocial")}>
          <Field label={t(lang, "socialIg")}>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="layali.riyadh" />
          </Field>
          <Field label={t(lang, "socialTt")}>
            <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="layali.riyadh" />
          </Field>
          <Field label={t(lang, "socialSnap")}>
            <Input value={snapchat} onChange={(e) => setSnapchat(e.target.value)} placeholder="layali.riyadh" />
          </Field>
          <Field label={t(lang, "socialX")}>
            <Input value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="layaliriyadh" />
          </Field>
        </Section>

        <details className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <summary className="cursor-pointer text-sm">{t(lang, "moreLater")}</summary>
          <div className="mt-6 space-y-8">
        <Section title={t(lang, "sectionMada")}>
          <p className="text-sm text-muted">{t(lang, "madaHint")}</p>
          <Field label={t(lang, "madaKey")}>
            <Input
              value={moyasarKey}
              onChange={(e) => setMoyasarKey(e.target.value)}
              placeholder="pk_live_…"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <p className="text-xs text-subtle">{t(lang, "madaTestNote")}</p>
          <Button asChild type="button" variant="outline" className="w-full">
            <a href="https://dashboard.moyasar.com" target="_blank" rel="noreferrer">
              {t(lang, "madaOpenDash")}
            </a>
          </Button>
        </Section>

        <Section title={t(lang, "sectionTelegram")}>
          <p className="text-sm text-muted">{t(lang, "tgHint")}</p>
          <Field label={t(lang, "tgToken")}>
            <Input
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label={t(lang, "tgChat")}>
            <Input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={onVerify} disabled={busy}>
              {t(lang, "tgVerify")}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onDiscover} disabled={busy}>
              {t(lang, "tgDiscover")}
            </Button>
          </div>
        </Section>

        <Section title={t(lang, "sectionFactory")}>
          <p className="text-sm text-muted">{t(lang, "factoryHint")}</p>
          <p className="text-sm">
            {lang === "ar" ? SUPPLIER.nameAr : SUPPLIER.nameEn} · {lang === "ar" ? SUPPLIER.cityAr : SUPPLIER.cityEn}
          </p>
          <Field label={t(lang, "factoryWa")}>
            <Input
              value={supplierWhatsapp}
              onChange={(e) => setSupplierWhatsapp(e.target.value)}
              inputMode="tel"
              placeholder="9665xxxxxxxx"
            />
          </Field>
          <Button asChild type="button" variant="outline" className="w-full">
            <a href={SUPPLIER.url} target="_blank" rel="noreferrer">
              {t(lang, "factoryOpen")}
            </a>
          </Button>
        </Section>

        <Section title={t(lang, "sectionShip")}>
          <Field label={t(lang, "carrier")}>
            <select
              className="h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              value={courierId}
              onChange={(e) => {
                const v = e.target.value;
                if (isCourierId(v)) setCourierId(v);
              }}
            >
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "ar" ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(lang, "carrierWa")}>
            <Input
              value={courierWhatsapp}
              onChange={(e) => setCourierWhatsapp(e.target.value)}
              inputMode="tel"
              placeholder="9665xxxxxxxx"
            />
          </Field>
          <Field label={t(lang, "pickupCity")}>
            <Input value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} />
          </Field>
        </Section>
          </div>
        </details>

        <Button type="submit" className="w-full">
          {t(lang, "save")}
        </Button>
      </form>

      {link ? (
        <div className="mt-8 space-y-3 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted">{t(lang, "shareLink")}</p>
          <p className="break-all text-sm">{link}</p>
          <Button type="button" variant="outline" className="w-full" onClick={copy}>
            {t(lang, "copyOrder")}
          </Button>
          <Button asChild className="w-full">
            <Link to="/shop">{t(lang, "shopCta")}</Link>
          </Button>
        </div>
      ) : (
        <Button asChild variant="outline" className="mt-8 w-full">
          <Link to="/ops">{t(lang, "openOps")}</Link>
        </Button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <legend className="px-1 text-xs tracking-[0.22em] text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
