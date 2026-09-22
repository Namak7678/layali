import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/catalog";
import { fromPrice } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { formatSar } from "@/lib/utils";

export function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="overflow-hidden rounded-3xl bg-surface p-2">
        <img
          src={product.image}
          alt={product.name[lang]}
          className="aspect-[2/3] w-full rounded-2xl object-cover transition-transform duration-slow ease-smooth-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 space-y-1 px-1">
        <h3 className="text-base font-medium">{product.name[lang]}</h3>
        <p className="text-sm text-muted">{product.tagline[lang]}</p>
        <p className="text-sm tabular-nums text-fg">
          {t(lang, "from")} {formatSar(fromPrice(product), lang)}
        </p>
      </div>
    </Link>
  );
}
