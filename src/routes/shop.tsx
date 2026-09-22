import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { families, products, type Family } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({ component: Shop });

function Shop() {
  const lang = useShop((s) => s.lang);
  const [family, setFamily] = useState<"all" | Family>("all");
  const list = family === "all" ? products : products.filter((p) => p.family === family);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs tracking-[0.28em] text-muted">{t(lang, "heroKicker")}</p>
      <h1 className="mt-2 font-display text-4xl">{t(lang, "shop")}</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">{t(lang, "freeOver")}</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {families.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFamily(f.id)}
            className={cn(
              "h-11 shrink-0 rounded-full px-4 text-sm transition-colors duration-quick",
              family === f.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg",
            )}
          >
            {f[lang]}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} lang={lang} />
        ))}
      </div>
    </div>
  );
}
