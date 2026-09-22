import { createFileRoute } from "@tanstack/react-router";
import { CareDesk } from "@/components/care-desk";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";

export const Route = createFileRoute("/care")({ component: Care });

function Care() {
  const lang = useShop((s) => s.lang);

  const faqs = [
    { q: t(lang, "careFaqCard"), a: t(lang, "careFaqCardA") },
    { q: t(lang, "careFaqPay"), a: t(lang, "careFaqPayA") },
    { q: t(lang, "careFaqShip"), a: t(lang, "careFaqShipA") },
    { q: t(lang, "careFaqReturn"), a: t(lang, "careFaqReturnA") },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-xs tracking-[0.28em] text-muted">{t(lang, "care")}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{t(lang, "careTitle")}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{t(lang, "careBody")}</p>

        <div className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">{t(lang, "careMoneyTitle")}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t(lang, "careMoneyBody")}</p>
        </div>

        <dl className="mt-8 space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-2xl bg-surface px-5 py-4 shadow-[var(--shadow-border)]">
              <summary className="cursor-pointer text-sm">{item.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </dl>
      </div>

      <aside className="flex min-h-[28rem] flex-col rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="mb-4 text-sm text-muted">{t(lang, "careHours")}</p>
        <CareDesk />
      </aside>
    </div>
  );
}
