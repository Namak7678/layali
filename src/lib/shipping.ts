export type CourierId = "smsa" | "aymakan" | "aramex" | "jt" | "dhl";

export type Courier = {
  id: CourierId;
  nameAr: string;
  nameEn: string;
  eta: { ar: string; en: string };
  rateRiyadh: number;
  rateOther: number;
  phone: string;
  bookUrl: string;
  supportWa?: string;
  track: (awb: string) => string;
};

export const couriers: Courier[] = [
  {
    id: "smsa",
    nameAr: "سمسا إكسبريس",
    nameEn: "SMSA Express",
    eta: { ar: "٢–٣ أيام", en: "2–3 days" },
    rateRiyadh: 22,
    rateOther: 28,
    phone: "920009999",
    bookUrl: "https://www.smsaexpress.com/",
    track: (awb) =>
      `https://www.smsaexpress.com/sa/trackingdetails?trackno=${encodeURIComponent(awb)}`,
  },
  {
    id: "aymakan",
    nameAr: "أي مكان",
    nameEn: "AyMakan",
    eta: { ar: "١–٣ أيام", en: "1–3 days" },
    rateRiyadh: 20,
    rateOther: 26,
    phone: "920000710",
    bookUrl: "https://aymakan.com/",
    supportWa: "966532126550",
    track: (awb) => `https://aymakan.com/?track=${encodeURIComponent(awb)}`,
  },
  {
    id: "aramex",
    nameAr: "أرامكس",
    nameEn: "Aramex",
    eta: { ar: "٢–٤ أيام", en: "2–4 days" },
    rateRiyadh: 28,
    rateOther: 35,
    phone: "920027247",
    bookUrl: "https://www.aramex.com/sa/ar",
    track: (awb) =>
      `https://www.aramex.com/sa/ar/track/shipments?ShipmentNumber=${encodeURIComponent(awb)}`,
  },
  {
    id: "jt",
    nameAr: "جاي آند تي",
    nameEn: "J&T Express",
    eta: { ar: "٢–٤ أيام", en: "2–4 days" },
    rateRiyadh: 18,
    rateOther: 24,
    phone: "920011547",
    bookUrl: "https://www.jtexpress.sa/",
    track: (awb) =>
      `https://www.jtexpress.sa/trajectoryQuery?waybillNo=${encodeURIComponent(awb)}`,
  },
  {
    id: "dhl",
    nameAr: "دي إتش إل",
    nameEn: "DHL",
    eta: { ar: "١–٢ يوم", en: "1–2 days" },
    rateRiyadh: 45,
    rateOther: 55,
    phone: "920002345",
    bookUrl: "https://www.dhl.com/sa-ar/home.html",
    track: (awb) =>
      `https://www.dhl.com/sa-ar/home/tracking.html?tracking-id=${encodeURIComponent(awb)}`,
  },
];

export function getCourier(id: string | undefined) {
  return couriers.find((c) => c.id === id) ?? couriers[0]!;
}

export function isCourierId(v: unknown): v is CourierId {
  return typeof v === "string" && couriers.some((c) => c.id === v);
}

export function isRiyadh(city: string) {
  return /رياض|riyadh/i.test(city);
}

export function courierRate(id: string, city: string) {
  const c = getCourier(id);
  return isRiyadh(city) ? c.rateRiyadh : c.rateOther;
}

export function bookingMessage(opts: {
  orderId: string;
  city: string;
  items: string;
  pickupCity: string;
  carrier: Courier;
  lang: "ar" | "en";
}) {
  if (opts.lang === "ar") {
    return [
      `طلب التقاط شحنة — لَيَالِي ${opts.orderId}`,
      `الناقل: ${opts.carrier.nameAr}`,
      `من: ${opts.pickupCity || "الرياض"}`,
      `إلى: ${opts.city || "داخل المملكة"}`,
      "",
      opts.items,
      "",
      "طرد عطور · وزن تقريبي ٠٫٥ كغ · قيمة معلنة حسب الفاتورة.",
      "نرجو رقم بوليصة بعد التقاط الشحنة.",
    ].join("\n");
  }
  return [
    `Pickup booking — LAYALI ${opts.orderId}`,
    `Carrier: ${opts.carrier.nameEn}`,
    `From: ${opts.pickupCity || "Riyadh"}`,
    `To: ${opts.city || "Saudi"}`,
    "",
    opts.items,
    "",
    "Perfume parcel · ~0.5 kg · declared value per invoice.",
    "Please return the AWB after pickup.",
  ].join("\n");
}

export function trackingMessage(opts: {
  orderId: string;
  carrier: Courier;
  awb: string;
  lang: "ar" | "en";
}) {
  const url = opts.carrier.track(opts.awb);
  if (opts.lang === "ar") {
    return [
      `شحنة طلبك ${opts.orderId} خرجت مع ${opts.carrier.nameAr}.`,
      `رقم التتبع: ${opts.awb}`,
      url,
    ].join("\n");
  }
  return [
    `Your order ${opts.orderId} is with ${opts.carrier.nameEn}.`,
    `Tracking: ${opts.awb}`,
    url,
  ].join("\n");
}
