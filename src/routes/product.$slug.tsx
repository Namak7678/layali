import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { cn, formatSar } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({ component: ProductPage });

function ProductPage() {
  const { slug } = Route.useParams();
  const lang = useShop((s) => s.lang);
  const add = useShop((s) => s.add);
  const navigate = useNavigate();
  const product = getProduct(slug);
  const [sizeId, setSizeId] = useState(product?.sizes[0]?.id ?? "");

  if (!product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-display text-2xl">{t(lang, "notFound")}</p>
        <Button asChild className="mt-6">
          <Link to="/shop">{t(lang, "backShop")}</Link>
        </Button>
      </div>
    );
  }

  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:py-16">
      <div className="overflow-hidden rounded-3xl bg-surface p-2">
        <img
          src={product.image}
          alt={product.name[lang]}
          className="aspect-[2/3] w-full rounded-2xl object-cover"
        />
      </div>
      <div className="flex flex-col">
        <p className="text-xs tracking-[0.22em] text-muted">{product.wear[lang]}</p>
        <h1 className="mt-2 font-display text-4xl">{product.name[lang]}</h1>
        <p className="mt-2 text-muted">{product.tagline[lang]}</p>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-fg/90">{product.story[lang]}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {product.accords.map((a) => (
            <span
              key={a.en}
              className="rounded-full px-3 py-1 text-xs text-muted shadow-[var(--shadow-border)]"
            >
              {a[lang]}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-xs font-medium text-muted">{t(lang, "size")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSizeId(s.id)}
                className={cn(
                  "h-11 rounded-md px-4 text-sm tabular-nums transition-colors duration-quick",
                  sizeId === s.id ? "bg-accent text-accent-fg" : "bg-elevated text-fg",
                )}
              >
                {s.label[lang]} · {formatSar(s.price, lang)}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 font-display text-3xl tabular-nums">{formatSar(size?.price ?? 0, lang)}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => {
              if (!size) return;
              add(product.slug, size.id);
              toast(t(lang, "added"));
            }}
          >
            {t(lang, "add")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (!size) return;
              add(product.slug, size.id);
              navigate({ to: "/checkout" });
            }}
          >
            {t(lang, "buyNow")}
          </Button>
        </div>

        <dl className="mt-10 grid gap-4 border-t border-border pt-8 text-sm">
          <p className="text-xs tracking-[0.2em] text-muted">{t(lang, "notes")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-muted">{t(lang, "top")}</dt>
              <dd className="mt-1">{product.notes.top[lang]}</dd>
            </div>
            <div>
              <dt className="text-muted">{t(lang, "heart")}</dt>
              <dd className="mt-1">{product.notes.heart[lang]}</dd>
            </div>
            <div>
              <dt className="text-muted">{t(lang, "base")}</dt>
              <dd className="mt-1">{product.notes.base[lang]}</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
