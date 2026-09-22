import { create } from "zustand";
import { products, SHIPPING, FREE_SHIPPING_OVER, GIFT_WRAP, PROMO_CODE, PROMO_RATE } from "./catalog";
import { sanitizePhone } from "./utils";
import type { Lang } from "./i18n";
import { isCourierId, type CourierId } from "./shipping";

export type CartLine = {
  productSlug: string;
  sizeId: string;
  qty: number;
};

export type Merchant = {
  whatsapp: string;
  stcPay: string;
  iban: string;
  telegramToken: string;
  telegramChatId: string;
  telegramBotName: string;
  supplierWhatsapp: string;
  courierId: CourierId;
  courierWhatsapp: string;
  pickupCity: string;
  moyasarKey: string;
  instagram: string;
  tiktok: string;
  snapchat: string;
  x: string;
};

type ShopState = {
  lang: Lang;
  cart: CartLine[];
  cartOpen: boolean;
  giftWrap: boolean;
  promo: string;
  promoOn: boolean;
  merchant: Merchant;
  setLang: (lang: Lang) => void;
  setCartOpen: (open: boolean) => void;
  add: (productSlug: string, sizeId: string) => void;
  setQty: (productSlug: string, sizeId: string, qty: number) => void;
  remove: (productSlug: string, sizeId: string) => void;
  clear: () => void;
  setGiftWrap: (on: boolean) => void;
  setPromo: (code: string) => void;
  applyPromo: () => boolean;
  setMerchant: (m: Partial<Merchant>) => void;
  hydrate: () => void;
};

const STORAGE = "layali-shop";

const emptyMerchant = (): Merchant => ({
  whatsapp: "",
  stcPay: "",
  iban: "",
  telegramToken: "",
  telegramChatId: "",
  telegramBotName: "",
  supplierWhatsapp: "",
  courierId: "smsa",
  courierWhatsapp: "",
  pickupCity: "الرياض",
  moyasarKey: "",
  instagram: "layali.riyadh",
  tiktok: "layali.riyadh",
  snapchat: "layali.riyadh",
  x: "layaliriyadh",
});

export function coerceMerchant(raw?: Partial<Merchant> | null): Merchant {
  const base = emptyMerchant();
  if (!raw) return base;
  return {
    whatsapp: raw.whatsapp ?? base.whatsapp,
    stcPay: raw.stcPay ?? base.stcPay,
    iban: raw.iban ?? base.iban,
    telegramToken: raw.telegramToken ?? "",
    telegramChatId: raw.telegramChatId ?? "",
    telegramBotName: raw.telegramBotName ?? "",
    supplierWhatsapp: raw.supplierWhatsapp ?? "",
    courierId: isCourierId(raw.courierId) ? raw.courierId : "smsa",
    courierWhatsapp: raw.courierWhatsapp ?? "",
    pickupCity: raw.pickupCity || "الرياض",
    moyasarKey: raw.moyasarKey ?? "",
    instagram: raw.instagram ?? base.instagram,
    tiktok: raw.tiktok ?? base.tiktok,
    snapchat: raw.snapchat ?? base.snapchat,
    x: raw.x ?? base.x,
  };
}

function persist(state: ShopState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE,
    JSON.stringify({
      lang: state.lang,
      cart: state.cart,
      giftWrap: state.giftWrap,
      promo: state.promo,
      promoOn: state.promoOn,
      merchant: state.merchant,
    }),
  );
}

export const useShop = create<ShopState>((set, get) => ({
  lang: "ar",
  cart: [],
  cartOpen: false,
  giftWrap: false,
  promo: "",
  promoOn: false,
  merchant: emptyMerchant(),
  setLang: (lang) => {
    set({ lang });
    persist(get());
  },
  setCartOpen: (cartOpen) => set({ cartOpen }),
  add: (productSlug, sizeId) => {
    const cart = [...get().cart];
    const i = cart.findIndex((l) => l.productSlug === productSlug && l.sizeId === sizeId);
    if (i >= 0) {
      const current = cart[i];
      if (current) cart[i] = { ...current, qty: current.qty + 1 };
    } else cart.push({ productSlug, sizeId, qty: 1 });
    set({ cart, cartOpen: true });
    persist(get());
  },
  setQty: (productSlug, sizeId, qty) => {
    const cart =
      qty <= 0
        ? get().cart.filter((l) => !(l.productSlug === productSlug && l.sizeId === sizeId))
        : get().cart.map((l) =>
            l.productSlug === productSlug && l.sizeId === sizeId ? { ...l, qty } : l,
          );
    set({ cart });
    persist(get());
  },
  remove: (productSlug, sizeId) => {
    set({
      cart: get().cart.filter((l) => !(l.productSlug === productSlug && l.sizeId === sizeId)),
    });
    persist(get());
  },
  clear: () => {
    set({ cart: [], giftWrap: false, promoOn: false, promo: "" });
    persist(get());
  },
  setGiftWrap: (giftWrap) => {
    set({ giftWrap });
    persist(get());
  },
  setPromo: (promo) => set({ promo }),
  applyPromo: () => {
    const ok = get().promo.trim().toUpperCase() === PROMO_CODE;
    set({ promoOn: ok });
    persist(get());
    return ok;
  },
  setMerchant: (m) => {
    const prev = get().merchant;
    const merchant = coerceMerchant({
      ...prev,
      ...m,
      whatsapp: m.whatsapp !== undefined ? sanitizePhone(m.whatsapp) : prev.whatsapp,
      supplierWhatsapp:
        m.supplierWhatsapp !== undefined ? sanitizePhone(m.supplierWhatsapp) : prev.supplierWhatsapp,
      courierWhatsapp:
        m.courierWhatsapp !== undefined ? sanitizePhone(m.courierWhatsapp) : prev.courierWhatsapp,
      telegramToken: m.telegramToken !== undefined ? m.telegramToken.trim() : prev.telegramToken,
      telegramChatId: m.telegramChatId !== undefined ? m.telegramChatId.trim() : prev.telegramChatId,
    });
    set({ merchant });
    persist(get());
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ShopState>;
        set({
          lang: parsed.lang === "en" ? "en" : "ar",
          cart: Array.isArray(parsed.cart) ? parsed.cart : [],
          giftWrap: Boolean(parsed.giftWrap),
          promo: typeof parsed.promo === "string" ? parsed.promo : "",
          promoOn: Boolean(parsed.promoOn),
          merchant: coerceMerchant(parsed.merchant),
        });
      }
    } catch {
      /* ignore */
    }
    const wa = new URLSearchParams(window.location.search).get("wa");
    if (wa) {
      const digits = sanitizePhone(wa);
      if (digits) {
        sessionStorage.setItem("layali-wa", digits);
        set({ merchant: { ...get().merchant, whatsapp: digits } });
        persist(get());
      }
    } else {
      const sessionWa = sessionStorage.getItem("layali-wa");
      if (sessionWa && !get().merchant.whatsapp) {
        set({ merchant: { ...get().merchant, whatsapp: sessionWa } });
      }
    }
  },
}));

export function linePrice(line: CartLine) {
  const product = products.find((p) => p.slug === line.productSlug);
  const size = product?.sizes.find((s) => s.id === line.sizeId);
  return (size?.price ?? 0) * line.qty;
}

export function cartSubtotal(cart: CartLine[]) {
  return cart.reduce((sum, line) => sum + linePrice(line), 0);
}

export function cartCount(cart: CartLine[]) {
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

export function totals(state: { cart: CartLine[]; giftWrap: boolean; promoOn: boolean }) {
  const sub = cartSubtotal(state.cart);
  const discount = state.promoOn ? Math.round(sub * PROMO_RATE) : 0;
  const after = sub - discount;
  const shipping = after >= FREE_SHIPPING_OVER || after === 0 ? 0 : SHIPPING;
  const wrap = state.giftWrap && state.cart.length ? GIFT_WRAP : 0;
  return { sub, discount, shipping, wrap, total: after + shipping + wrap };
}
