import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { products, reviews } from "@/lib/catalog";
import { houseFacts } from "@/lib/house";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";

export const Route = createFileRoute("/")({ component: Home });

const MARQUEE = [
  "ورد الطائف",
  "عود كمبودي",
  "زعفران",
  "مسك الخليج",
  "ملح البحر",
  "تمر",
  "بخور",
  "عنبر",
  "Taif rose",
  "Cambodian oud",
  "Saffron",
];

function Home() {
  const lang = useShop((s) => s.lang);
  const featured = products.filter((p) => p.featured);

  return (
    <div>
      <section className="relative min-h-[100svh]">
        <img
          src="/images/hero.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-bg/20" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28">
          <p className="rise-in text-xs tracking-[0.28em] text-accent">{t(lang, "heroKicker")}</p>
          <h1 className="rise-in-2 mt-4 max-w-xl font-display text-4xl leading-[1.1] md:text-6xl">
            {t(lang, "heroTitle")}
          </h1>
          <p className="rise-in-3 mt-4 max-w-md text-sm text-fg/85 md:text-base">{t(lang, "heroBody")}</p>
          <div className="rise-in-3 mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/shop">{t(lang, "shopCta")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/about">{t(lang, "storyCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-border py-3">
        <div className="marquee-track flex w-max gap-10 text-xs tracking-[0.22em] text-muted">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={`${item}-${i}`}>{item}</span>
          ))}
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3">
        {houseFacts(lang)
          .slice(0, 3)
          .map((f) => (
            <div key={f.k} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs tracking-[0.22em] text-muted">{f.k}</p>
              <p className="mt-2 text-sm leading-relaxed">{f.v}</p>
            </div>
          ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl">{t(lang, "featured")}</h2>
          <Link to="/shop" className="text-sm text-muted hover:text-fg">
            {t(lang, "viewAll")}
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} lang={lang} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-8 md:grid-cols-2 md:py-16">
        <img src="/images/atelier.jpg" alt="" className="w-full rounded-3xl object-cover" />
        <div>
          <h2 className="font-display text-3xl">{t(lang, "aboutTitle")}</h2>
          <p className="mt-4 text-muted">{t(lang, "aboutBody")}</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/about">{t(lang, "storyCta")}</Link>
          </Button>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 font-display text-3xl">{t(lang, "lookbook")}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <img src="/images/smoke.jpg" alt="" className="col-span-2 h-56 w-full rounded-3xl object-cover md:h-80" />
            <img src="/images/linen.jpg" alt="" className="h-56 w-full rounded-3xl object-cover md:h-80" />
            <img src="/images/oud.jpg" alt="" className="h-56 w-full rounded-3xl object-cover md:col-span-1 md:h-72" />
            <img src="/images/taif.jpg" alt="" className="h-56 w-full rounded-3xl object-cover md:h-72" />
            <img src="/images/bakhoor.jpg" alt="" className="h-56 w-full rounded-3xl object-cover md:h-72" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 font-display text-3xl">{t(lang, "reviews")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <blockquote key={r.name.en} className="rounded-3xl bg-surface p-6 shadow-[var(--shadow-border)]">
              <p className="text-sm text-fg">{r.body[lang]}</p>
              <footer className="mt-4 text-xs tracking-wide text-muted">{r.name[lang]}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}
