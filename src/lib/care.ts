import { products } from "./catalog";
import type { Lang } from "./i18n";

function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(n: string, keys: string[]) {
  return keys.some((k) => n.includes(fold(k)));
}

export function answerCare(raw: string, lang: Lang): string {
  const n = fold(raw);
  const ar = lang === "ar";

  if (has(n, ["بطاقه", "فيزا", "visa", "mastercard", "ماستر", "cvv", "pin", "رقم البطاق", "بانك كارد", "bank card"])) {
    return ar
      ? "لا تدخل بطاقة بنك هنا، ولا ترسل رقمها في الدردشة. الدار لا تستلم بطاقتك ولا تحوّل لحساب وسيط. المبلغ يصل حسابك أنت: STC Pay أو الآيبان المسجَّل، أو مدى عبر بوابة معتمدة باسم المتجر. بعد الشحن والاستلام يُعلَّم الطلب «واصل» في الصندوق — المال لا يمر علينا."
      : "Do not enter a bank card here, and never send the number in chat. The house does not hold your card or sit in the money path. Funds land on your STC Pay or IBAN, or on Mada through a licensed gateway in the store’s name. After delivery the desk marks the order received — money never passes through us.";
  }

  if (has(n, ["دفع", "فلوس", "حواله", "تحويل", "stc", "iban", "ايبان", "آيبان", "كاش", "استلام", "مدى", "pay"])) {
    return ar
      ? "مسار المال المعتمد اليوم: تؤكد الطلب عبر واتساب، ثم تحويل STC Pay أو آيبان، أو الدفع عند الاستلام. مدى يظهر في الدفع فقط إن رُبط حساب Moyasar باسم المتجر. لا نأخذ عمولة وسيطة ولا نحوّل إلى بطاقة شخصية."
      : "Today’s money path: confirm on WhatsApp, then STC Pay or IBAN, or cash on delivery. Mada appears at checkout only if a Moyasar account is keyed in the store’s name. We take no intermediary cut and we do not payout to a personal card.";
  }

  if (has(n, ["شحن", "توصيل", "يوصل", "سمسا", "aramex", "ايماكان", "dhl", "موعد", "كم يوم"])) {
    return ar
      ? "الشحن داخل المملكة ٢–٤ أيام عمل، والخليج ٥–٨. الناقل الافتراضي سمسا، مع أيمكان وأرامكس وجي آند تي وDHL عند الحاجة. رقم التتبع يُرسل على واتساب بعد التغليف. فوق ٤٥٠ ر.س التوصيل مجاني داخل المملكة."
      : "Saudi delivery is 2–4 business days; GCC 5–8. Default courier is SMSA, with Aymakan, Aramex, J&T and DHL when needed. The tracking number is sent on WhatsApp after packing. Over SAR 450, shipping is free inside the Kingdom.";
  }

  if (has(n, ["ارجاع", "استرجاع", "استبدال", "فتح", "رجيع"])) {
    return ar
      ? "الإرجاع خلال ٧ أيام للعبوات غير المفتوحة والأختام سليمة. البخور بعد الحرق لا يُرجع. بلّغ الطلب من واتساب ونرتّب الاستلام."
      : "Unopened bottles with intact seals may return within 7 days. Burnt bakhoor cannot return. Message WhatsApp with the order and we arrange pickup.";
  }

  if (has(n, ["تتبع", "تراك", "شحنتي", "وين طلبي", "اين طلبي", "رقم الشحن", "awb"])) {
    return ar
      ? "أرسل رقم الطلب LY-xxxx على واتساب أو هنا. بعد التغليف يظهر رقم الناقل في غرفة الحجوزات ويُرسل لك رابط التتبع."
      : "Send your LY-xxxx order number here or on WhatsApp. After packing, the AWB lands in the bookings desk and the tracking link is sent to you.";
  }

  if (has(n, ["تغليف", "هديه", "هدية", "بوكس", "كيس"])) {
    return ar
      ? "تغليف الهدية كتان وكيس قماش بـ ٢٥ ر.س. مجموعة الغروب جاهزة للإهداء كما هي. اذكر الاسم على الكرت في خانة الملاحظة عند الطلب."
      : "Gift wrap is linen and a cloth pouch for SAR 25. The Sundown Set is already gift-ready. Put the card name in the checkout note.";
  }

  const hit = products.find((p) => {
    const blob = fold(`${p.slug} ${p.name.ar} ${p.name.en} ${p.tagline.ar} ${p.tagline.en} ${p.accords.map((a) => `${a.ar} ${a.en}`).join(" ")}`);
    return blob.split(" ").some((w) => w.length > 2 && n.includes(w));
  });
  if (hit) {
    const from = hit.sizes[0];
    return ar
      ? `${hit.name.ar} — ${hit.tagline.ar}. ${hit.wear.ar}. يبدأ من ${from.price} ر.س (${from.label.ar}). ${hit.story.ar} إن رغبت نجهّز الطلب الآن.`
      : `${hit.name.en} — ${hit.tagline.en}. ${hit.wear.en}. From SAR ${from.price} (${from.label.en}). ${hit.story.en} Say the word and we will raise the order.`;
  }

  if (has(n, ["سعر", "اسعار", "كم", "غالي", "رخيص", "price"])) {
    return ar
      ? "الأسعار من ٢٨٠ ر.س لبخور الدار إلى ٦٢٠ ر.س لعود النخيل ٥٠ مل. مجموعة الغروب ٢٩٠ ر.س. التوصيل مجاني فوق ٤٥٠ ر.س."
      : "Prices run from SAR 280 for Bakhoor al Dar to SAR 620 for Oud al Nakheel 50 ml. The Sundown Set is SAR 290. Shipping is free over SAR 450.";
  }

  if (has(n, ["دوام", "ساعه", "ساعات", "متى ترد", "خدمه", "رد", "hello", "مرحبا", "السلام", "hi"])) {
    return ar
      ? "خدمة العملاء هنا في المتجر ترد فوراً على العطور والشحن والدفع. واتساب العمل للطلبات الحية وتأكيد التحويل. لا نطلب بطاقة بنك في أي محادثة."
      : "House care here answers at once on scent, shipping, and payment. Business WhatsApp is for live orders and transfer confirmation. We never ask for a bank card in any thread.";
  }

  return ar
    ? "اسأل عن عطر، الشحن، الدفع، أو طلب قائم. للدفع: STC Pay أو الآيبان — بلا بطاقة في الدردشة. إن فضّلت الجوال، واتساب العمل مفتوح."
    : "Ask about a scent, shipping, payment, or an open order. Pay by STC Pay or IBAN — never a card in chat. WhatsApp is open if you prefer the phone.";
}

export const careChips = [
  { ar: "كيف أدفع؟", en: "How do I pay?" },
  { ar: "متى يوصل؟", en: "When does it arrive?" },
  { ar: "عود النخيل", en: "Oud al Nakheel" },
  { ar: "تغليف هدية", en: "Gift wrap" },
] as const;
