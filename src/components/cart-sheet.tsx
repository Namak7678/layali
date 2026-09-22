import { Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { products } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { cartCount, linePrice, totals, useShop } from "@/lib/shop";
import { formatSar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function CartSheet() {
  const lang = useShop((s) => s.lang);
  const cart = useShop((s) => s.cart);
  const open = useShop((s) => s.cartOpen);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setQty = useShop((s) => s.setQty);
  const giftWrap = useShop((s) => s.giftWrap);
  const promoOn = useShop((s) => s.promoOn);
  const sums = totals({ cart, giftWrap, promoOn });
  const count = cartCount(cart);

  return (
    <Sheet open={open} onOpenChange={setCartOpen} title={`${t(lang, "cart")}${count ? ` · ${count}` : ""}`}>
      {cart.length === 0 ? (
        <div className="flex flex-col items-start gap-4 pt-8">
          <p className="text-muted">{t(lang, "emptyCart")}</p>
          <Button asChild onClick={() => setCartOpen(false)}>
            <Link to="/shop">{t(lang, "continue")}</Link>
          </Button>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          <ul className="flex flex-col gap-5">
            {cart.map((line) => {
              const product = products.find((p) => p.slug === line.productSlug);
              const size = product?.sizes.find((s) => s.id === line.sizeId);
              if (!product || !size) return null;
              return (
                <li key={`${line.productSlug}-${line.sizeId}`} className="flex gap-3">
                  <img
                    src={product.image}
                    alt=""
                    className="size-20 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{product.name[lang]}</p>
                    <p className="text-xs text-muted">{size.label[lang]}</p>
                    <p className="mt-1 text-sm tabular-nums">{formatSar(linePrice(line), lang)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-md bg-elevated"
                        onClick={() => setQty(line.productSlug, line.sizeId, line.qty - 1)}
                        aria-label="−"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-6 text-center text-sm tabular-nums">{line.qty}</span>
                      <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-md bg-elevated"
                        onClick={() => setQty(line.productSlug, line.sizeId, line.qty + 1)}
                        aria-label="+"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto space-y-3 border-t border-border pt-5">
            <Row label={t(lang, "subtotal")} value={formatSar(sums.sub, lang)} />
            {sums.discount ? <Row label={t(lang, "promoOk")} value={`− ${formatSar(sums.discount, lang)}`} /> : null}
            <Row
              label={t(lang, "shipping")}
              value={sums.shipping ? formatSar(sums.shipping, lang) : t(lang, "freeShipping")}
            />
            {sums.wrap ? <Row label={t(lang, "giftWrap")} value={formatSar(sums.wrap, lang)} /> : null}
            <Row label={t(lang, "total")} value={formatSar(sums.total, lang)} strong />
            <Button asChild className="w-full">
              <Link to="/checkout" onClick={() => setCartOpen(false)}>
                {t(lang, "checkout")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className={strong ? "font-medium tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}
