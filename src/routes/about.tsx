import { createFileRoute, Link } from "@tanstack/react-router";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { HOUSE, MONEY, houseFacts } from "@/lib/house";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  const lang = useShop((s) => s.lang);
  const facts = houseFacts(lang);

  return (
    <div>
      <section className="relative min-h-[55svh]">
        <img src="/images/atelier.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[55svh] max-w-6xl items-end px-4 pb-12">
          <div>
            <p className="text-xs tracking-[0.28em] text-accent">{t(lang, "heroKicker")}</p>
            <h1 className="mt-3 font-display text-4xl md:text-6xl">{t(lang, "aboutTitle")}</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="max-w-2xl text-lg leading-relaxed text-fg/90">{HOUSE.manifesto[lang]}</p>
        <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.k} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <dt className="text-xs tracking-[0.22em] text-muted">{f.k}</dt>
              <dd className="mt-2 text-sm leading-relaxed">{f.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">{t(lang, "followUs")}</h2>
          <p className="mt-2 text-sm text-muted">{t(lang, "followBody")}</p>
          <SocialLinks lang={lang} className="mt-5 flex flex-col gap-3 text-sm" />
        </div>
        <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl">{MONEY.title[lang]}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{MONEY.public[lang]}</p>
          <p className="mt-4 text-sm text-muted">{t(lang, "shippingBody")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/shop">{t(lang, "shopCta")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/campaign">{t(lang, "campaign")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pb-20">
        <img src="/images/smoke.jpg" alt="" className="col-span-2 h-64 w-full rounded-3xl object-cover md:h-80" />
        <img src="/images/linen.jpg" alt="" className="h-56 w-full rounded-3xl object-cover" />
        <img src="/images/discovery.jpg" alt="" className="h-56 w-full rounded-3xl object-cover" />
      </section>
    </div>
  );
}
