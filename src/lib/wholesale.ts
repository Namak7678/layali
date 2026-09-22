import { products } from "./catalog";

/** مصنع بروق — عنيزة. تركيب خاص / برايفت ليبل. لا واتساب عام على الموقع. */
export const SUPPLIER = {
  id: "brooq",
  nameAr: "مصنع بروق",
  nameEn: "Brooq Factory",
  cityAr: "عنيزة",
  cityEn: "Unayzah",
  url: "https://brooqksa.com/",
  moq: 50,
  leadDays: "10–18",
} as const;

/** تكلفة الزجاجة من المصنع (ريال) عند دفعة ٥٠+. ليست أسعار التجزئة. */
export const factoryCost: Record<string, Record<string, number>> = {
  riyadh: { "50": 72, "100": 108 },
  jeddah: { "50": 68, "100": 102 },
  oud: { "12": 195, "50": 148 },
  taif: { "50": 84, "100": 126 },
  bakhoor: { box: 58 },
  discovery: { set: 95 },
};

export const WRAP_COST = 8;

export function unitCost(slug: string, sizeId: string) {
  return factoryCost[slug]?.[sizeId] ?? 0;
}

export function lineCost(slug: string, sizeId: string, qty: number) {
  return unitCost(slug, sizeId) * qty;
}

export function itemsCost(
  items: { slug: string; sizeId: string; qty: number }[],
  giftWrap = false,
) {
  const goods = items.reduce((sum, i) => sum + lineCost(i.slug, i.sizeId, i.qty), 0);
  return goods + (giftWrap ? WRAP_COST : 0);
}

export function skuLabel(slug: string, sizeId: string, lang: "ar" | "en") {
  const product = products.find((p) => p.slug === slug);
  const size = product?.sizes.find((s) => s.id === sizeId);
  if (!product || !size) return `${slug} ${sizeId}`;
  return `${product.name[lang]} · ${size.label[lang]}`;
}

export function factoryOrderText(
  lines: { slug: string; sizeId: string; qty: number }[],
  lang: "ar" | "en",
) {
  const body = lines
    .map((l) => `• ${skuLabel(l.slug, l.sizeId, "ar")} / ${skuLabel(l.slug, l.sizeId, "en")} × ${l.qty}`)
    .join("\n");
  const cost = itemsCost(lines);
  if (lang === "ar") {
    return [
      "طلب تصنيع خاص — لَيَالِي",
      "المصنع: بروق · عنيزة",
      `الدفعة الدنيا: ${SUPPLIER.moq} وحدة للصنف الجديد`,
      "",
      body,
      "",
      `تكلفة تقديرية: ${cost} ر.س`,
      "نحتاج: زجاجات خاصة، غطاء أسود مطفي، كرتون كتان، ملصق لَيَالِي.",
      "الشحن إلى الرياض بعد التعبئة.",
    ].join("\n");
  }
  return [
    "Private-label production order — LAYALI",
    "Factory: Brooq · Unayzah",
    `MOQ: ${SUPPLIER.moq} units on a new SKU`,
    "",
    body,
    "",
    `Estimated cost: SAR ${cost}`,
    "Need: custom bottles, matte black cap, linen carton, LAYALI label.",
    "Ship packed to Riyadh.",
  ].join("\n");
}
