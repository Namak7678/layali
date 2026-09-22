import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { CareDock } from "@/components/care-dock";
import { CartSheet } from "@/components/cart-sheet";
import { SocialLinks } from "@/components/social-links";
import { t } from "@/lib/i18n";
import { cartCount, useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function StoreShell({ children }: { children: ReactNode }) {
  const lang = useShop((s) => s.lang);
  const setLang = useShop((s) => s.setLang);
  const cart = useShop((s) => s.cart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const hydrate = useShop((s) => s.hydrate);
  const [menu, setMenu] = useState(false);
  const count = cartCount(cart);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const nav = [
    { to: "/shop" as const, label: t(lang, "shop") },
    { to: "/about" as const, label: t(lang, "house") },
    { to: "/care" as const, label: t(lang, "care") },
  ];

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-3 items-center px-4">
          <div className="flex items-center justify-start gap-6">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-md md:hidden"
              aria-label="Menu"
              onClick={() => setMenu((v) => !v)}
            >
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="transition-colors duration-quick hover:text-fg"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            to="/"
            className="flex flex-col items-center justify-self-center leading-none"
            onClick={() => setMenu(false)}
          >
            <span className="font-display text-lg tracking-[0.22em] text-fg">
              {lang === "ar" ? "لَيَالِي" : "LAYALI"}
            </span>
            <span className="mt-1 text-[9px] tracking-[0.32em] text-muted">
              {lang === "ar" ? "LAYALI" : "الرياض"}
            </span>
          </Link>

          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-md text-xs tracking-wider text-muted hover:text-fg"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            >
              {t(lang, "lang")}
            </button>
            <button
              type="button"
              className="relative inline-flex size-11 items-center justify-center rounded-md"
              aria-label={t(lang, "cart")}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-5" />
              {count > 0 ? (
                <span className="absolute top-1.5 end-1.5 flex min-w-4 justify-center rounded-full bg-accent px-1 text-[10px] font-medium tabular-nums text-accent-fg">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
        {menu ? (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex h-11 items-center text-sm text-fg"
                onClick={() => setMenu(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="relative z-0 flex-1">{children}</main>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-2xl">{lang === "ar" ? "لَيَالِي" : "LAYALI"}</p>
            <p className="mt-2 text-sm text-muted">{t(lang, "footerNote")}</p>
            <SocialLinks lang={lang} className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <Link to="/shop" className="hover:text-fg">
              {t(lang, "shop")}
            </Link>
            <Link to="/about" className="hover:text-fg">
              {t(lang, "house")}
            </Link>
            <Link to="/campaign" className="hover:text-fg">
              {t(lang, "campaign")}
            </Link>
            <Link to="/care" className="hover:text-fg">
              {t(lang, "care")}
            </Link>
            <Link to="/setup" className="hover:text-fg">
              {t(lang, "setup")}
            </Link>
            <Link to="/ops" className="hover:text-fg">
              {t(lang, "ops")}
            </Link>
          </div>
        </div>
      </footer>

      <CartSheet />
      <CareDock />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          className: cn("!bg-elevated !text-fg !border-border !font-sans"),
        }}
      />
    </div>
  );
}
