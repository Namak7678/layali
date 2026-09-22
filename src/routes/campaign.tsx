import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { CAMPAIGN, MONEY } from "@/lib/house";
import { t } from "@/lib/i18n";
import { listOrders } from "@/lib/ops-server";
import { useShop } from "@/lib/shop";
import { formatSar } from "@/lib/utils";

export const Route = createFileRoute("/campaign")({ component: Campaign });

function Campaign() {
  const lang = useShop((s) => s.lang);
  const merchant = useShop((s) => s.merchant);
  const [booked, setBooked] = useState(0);
  const [received, setReceived] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void listOrders()
      .then((rows) => {
        setCount(rows.length);
        setBooked(rows.filter((o) => !o.paid).reduce((n, o) => n + o.total, 0));
        setReceived(rows.filter((o) => o.paid).reduce((n, o) => n + o.total, 0));
      })
      .catch(() => undefined);
  }, []);

  function copy(text: string) {
    void navigator.clipboard.writeText(text).then(
      () => toast(t(lang, "copied")),
      () => toast(t(lang, "copied")),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs tracking-[0.28em] text-muted">{t(lang, "campaignKicker")}</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">{t(lang, "campaignTitle")}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{CAMPAIGN.promise[lang]}</p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label={t(lang, "cashReceived")} value={formatSar(received, lang)} />
        <Stat label={t(lang, "cashBooked")} value={formatSar(booked, lang)} />
        <Stat label={t(lang, "ops")} value={`${count}`} />
      </dl>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <article>
          <h2 className="font-display text-2xl">{t(lang, "planAudience")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{CAMPAIGN.audience[lang]}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {CAMPAIGN.pillars.map((p) => (
              <li key={p.en} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
                <p className="text-sm">{p[lang]}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{p.d[lang]}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl">{MONEY.title[lang]}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{MONEY.body[lang]}</p>
          <p className="mt-4 text-sm text-muted">
            STC Pay: {merchant.stcPay || t(lang, "railOff")}
          </p>
          <p className="mt-1 text-sm text-muted">IBAN: {merchant.iban || t(lang, "railOff")}</p>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link to="/setup">{t(lang, "setup")}</Link>
          </Button>
        </article>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl">{t(lang, "planCalendar")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {CAMPAIGN.weeks.map((w) => (
            <div key={w.en} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-sm">{w[lang]}</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                {w.items.map((item) => (
                  <li key={item.en}>{item[lang]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl">{t(lang, "planCaptions")}</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {CAMPAIGN.captions.map((c) => (
            <div key={c.title.en} className="flex flex-col rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-sm">{c.title[lang]}</p>
              <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted">{c.body[lang]}</p>
              <Button type="button" variant="outline" className="mt-5 w-full" onClick={() => copy(c.body[lang])}>
                {t(lang, "copyCaption")}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">{t(lang, "planSpend")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{CAMPAIGN.spend[lang]}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl">{t(lang, "planKpi")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{CAMPAIGN.kpis[lang]}</p>
        </div>
      </section>

      <section className="mt-14 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl">{t(lang, "followUs")}</h2>
        <p className="mt-2 text-sm text-muted">{t(lang, "followBody")}</p>
        <SocialLinks lang={lang} className="mt-5 flex flex-col gap-3 text-sm" />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/shop">{t(lang, "shopCta")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/ops">{t(lang, "ops")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-2 font-display text-3xl tabular-nums">{value}</dd>
    </div>
  );
}
