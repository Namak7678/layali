import { products } from "./catalog";

export type ParsedItem = { slug: string; sizeId: string; qty: number };

export type ParsedOrder = {
  id: string;
  city: string;
  items: ParsedItem[];
  giftWrap: boolean;
  promoOn: boolean;
  total: number;
};

function digits(raw: string) {
  const western = raw.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const n = western.replace(/[^\d]/g, "");
  return n ? Number(n) : 0;
}

export function parseWhatsappOrder(raw: string): ParsedOrder | null {
  const id = raw.match(/LY-\d{4}/i)?.[0]?.toUpperCase();
  if (!id) return null;

  const cityLine = raw.match(/(?:المدينة|City)\s*[:：]\s*([^\n]+)/i);
  const city = (cityLine?.[1] ?? "")
    .split("—")[0]
    ?.split("–")[0]
    ?.split("-")[0]
    ?.trim() ?? "";

  const items: ParsedItem[] = [];
  for (const line of raw.split(/\n+/)) {
    if (!/[•\-*]/.test(line) && !/×|x\s*\d/i.test(line)) continue;
    const qty = Number(line.match(/[×xX]\s*(\d+)/)?.[1] ?? 1);
    for (const product of products) {
      if (!line.includes(product.name.ar) && !line.includes(product.name.en)) continue;
      const size =
        product.sizes.find(
          (s) => line.includes(s.label.ar) || line.includes(s.label.en) || line.includes(s.id),
        ) ?? product.sizes[0];
      if (!size) continue;
      items.push({ slug: product.slug, sizeId: size.id, qty: Number.isFinite(qty) && qty > 0 ? qty : 1 });
      break;
    }
  }

  const totalLine = raw.match(/(?:الإجمالي|Total)\s*[:：]?\s*([^\n]+)/i);
  const total = totalLine ? digits(totalLine[1] ?? "") : 0;
  const giftWrap = /تغليف|gift wrap/i.test(raw);
  const promoOn = /LAYALI10|−10%|-10%/i.test(raw);

  if (!items.length) return null;
  return { id, city, items, giftWrap, promoOn, total };
}
