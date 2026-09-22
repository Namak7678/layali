import type { Lang } from "./i18n";

export const HOUSE = {
  foundedYear: 2024,
  hijri: "١٤٤٦",
  cityAr: "الرياض",
  cityEn: "Riyadh",
  countryAr: "المملكة العربية السعودية",
  countryEn: "Saudi Arabia",
  craftYears: 12,
  compositions: 6,
  batchNote: { ar: "دفعات محدودة · تعبئة باليد", en: "Limited batches · filled by hand" },
  manifesto: {
    ar: "لَيَالِي دار عطور عربية في الرياض. نركّب للمجلس لا للمنصّة: ورد الطائف، عود كمبودي، زعفران، ومسك لا يصرخ. فُتحت الدار سنة ٢٠٢٤ بعد اثنتي عشرة سنة في الدهن والعود. لا مواسم صاخبة. دفعات محدودة، وتعبئة باليد.",
    en: "LAYALI is an Arabian perfume house in Riyadh. We compose for the majlis, not the feed: Taif rose, Cambodian oud, saffron, and a musk that does not shout. The house opened in 2024 after twelve years in oils and oud. No loud seasons. Limited batches, filled by hand.",
  },
};

export const SOCIAL = [
  { id: "ig", ar: "إنستغرام", en: "Instagram", key: "instagram" as const, prefix: "https://instagram.com/" },
  { id: "tt", ar: "تيك توك", en: "TikTok", key: "tiktok" as const, prefix: "https://www.tiktok.com/@" },
  { id: "snap", ar: "سناب شات", en: "Snapchat", key: "snapchat" as const, prefix: "https://www.snapchat.com/add/" },
  { id: "x", ar: "إكس", en: "X", key: "x" as const, prefix: "https://x.com/" },
] as const;

export const DEFAULT_HANDLES = {
  instagram: "layali.riyadh",
  tiktok: "layali.riyadh",
  snapchat: "layali.riyadh",
  x: "layaliriyadh",
};

export function handleOf(raw: string | undefined, fallback: string) {
  const v = (raw || fallback).trim().replace(/^@/, "").replace(/^https?:\/\/[^/]+\//, "").replace(/^add\//, "").replace(/^@/, "");
  return v || fallback;
}

export function socialHref(id: (typeof SOCIAL)[number]["id"], handle: string) {
  const row = SOCIAL.find((s) => s.id === id);
  return row ? `${row.prefix}${handle}` : "#";
}

export function houseFacts(lang: Lang) {
  const ar = lang === "ar";
  return [
    { k: ar ? "أين" : "Where", v: ar ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia" },
    { k: ar ? "متى" : "When", v: ar ? "أُسست الدار ١٤٤٦ هـ · ٢٠٢٤" : "House founded 2024 · 1446 AH" },
    { k: ar ? "الخبرة" : "Craft", v: ar ? "١٢ سنة في تركيب الدهن والعود قبل فتح الدار" : "12 years composing oils and oud before the house opened" },
    { k: ar ? "المجموعة" : "The line", v: ar ? "٦ تراكيب · دفعات محدودة · تعبئة باليد" : "6 compositions · limited batches · filled by hand" },
    { k: ar ? "المتابعون" : "Following", v: ar ? "حسابات الإطلاق: @layali.riyadh — لا نعرض رقماً غير حقيقي" : "Launch handles @layali.riyadh — we do not invent a follower count" },
    { k: ar ? "المبيعات" : "Sales", v: ar ? "كل حجز يظهر في الصندوق. المال يصل STC Pay أو الآيبان المسجَّل باسمك." : "Every booking lands in the inbox. Funds go to the STC Pay or IBAN saved in your name." },
  ];
}

export type Caption = { title: { ar: string; en: string }; body: { ar: string; en: string } };

export const CAMPAIGN = {
  promise: {
    ar: "دار ليلية من الرياض. عطر يُروى، لا يُصرخ به. نبيع هدوء المجلس في زجاجة.",
    en: "A night house from Riyadh. A scent that is told, not shouted. We sell the quiet of the majlis in a bottle.",
  },
  audience: {
    ar: "نساء ورجال ٢٥–٤٥ في الرياض وجدة والخبر، يهدون ويُضيفون للثوب والمجلس. يشترون من إنستغرام وتيك توك وواتساب، لا من الإعلانات الصاخبة.",
    en: "Women and men 25–45 in Riyadh, Jeddah and Khobar who gift and dress the thobe and the majlis. They buy from Instagram, TikTok and WhatsApp, not from loud ads.",
  },
  pillars: [
    { ar: "التركيب", en: "Composition", d: { ar: "هرم العطر، المادة، من أين جاءت الوردة.", en: "The pyramid, the material, where the rose was picked." } },
    { ar: "المجلس", en: "Majlis", d: { ar: "غرف، كتان، بخور هادئ، ليل الرياض.", en: "Rooms, linen, quiet bakhoor, Riyadh night." } },
    { ar: "اليد", en: "The hand", d: { ar: "التعبئة، الختم، كيس القماش.", en: "Filling, the seal, the cloth pouch." } },
    { ar: "الهدية", en: "The gift", d: { ar: "مجموعة الغروب، الكرت، مناسبات رمضان والعيد والزواج.", en: "The Sundown Set, the card, Ramadan, Eid, and weddings." } },
  ],
  weeks: [
    {
      ar: "الأسبوع ١ · الإفصاح",
      en: "Week 1 · The reveal",
      items: [
        { ar: "إنستغرام: فيلم الدار ١٥ ثانية — الرياض ليلاً، ثم الزجاجة.", en: "Instagram: 15s house film — Riyadh at night, then the bottle." },
        { ar: "تيك توك: «ليش العطر العربي ما لازم يصرخ».", en: "TikTok: why Arabian scent does not have to shout." },
        { ar: "سناب: قصة يومية من المشغل.", en: "Snap: a daily story from the atelier." },
        { ar: "واتساب الحالة: رابط المتجر + ليالي الرياض.", en: "WhatsApp status: store link + Layali Riyadh." },
      ],
    },
    {
      ar: "الأسبوع ٢ · المادة",
      en: "Week 2 · The material",
      items: [
        { ar: "كاروسيل ورد الطائف من الشفا.", en: "Carousel: Taif rose from al-Shafa." },
        { ar: "عيدان عود النخيل على الخشب.", en: "Oud al Nakheel sticks on wood." },
        { ar: "استفتاء: عنبري أم منعش.", en: "Poll: amber or fresh." },
        { ar: "إكس: جملة واحدة من بيان الدار.", en: "X: one line from the house manifesto." },
      ],
    },
    {
      ar: "الأسبوع ٣ · الهدية",
      en: "Week 3 · The gift",
      items: [
        { ar: "مجموعة الغروب تُفتح على الكف.", en: "The Sundown Set opening in the palm." },
        { ar: "تغليف الكتان خطوة بخطوة.", en: "Linen wrap, step by step." },
        { ar: "عرض LAYALI10 لثلاثة أيام.", en: "LAYALI10 for three days." },
        { ar: "واتساب للعملاء السابقين إن وُجدوا.", en: "WhatsApp to prior customers if any." },
      ],
    },
    {
      ar: "الأسبوع ٤ · المجلس",
      en: "Week 4 · The majlis",
      items: [
        { ar: "بخور الدار يحترق ثم يهدأ.", en: "Bakhoor al Dar burning, then settling." },
        { ar: "شهادة نورة · الرياض كما هي.", en: "Noura · Riyadh, as written." },
        { ar: "بث قصير: كيف تختار الحجم.", en: "Short live: how to choose a size." },
        { ar: "إغلاق الشهر بأرقام الصندوق الحقيقية فقط.", en: "Close the month on the real inbox numbers only." },
      ],
    },
  ],
  captions: [
    {
      title: { ar: "افتتاح الدار", en: "House opening" },
      body: {
        ar: "لَيَالِي. دار في الرياض تُركّب بعد العشاء.\nورد الطائف، عود كمبودي، ومسك لا يملأ الغرفة عنوة.\nالمجموعة من المتجر — رابط في البايو.",
        en: "LAYALI. A Riyadh house composed after dinner.\nTaif rose, Cambodian oud, and a musk that does not crowd the room.\nThe collection is in the shop — link in bio.",
      },
    },
    {
      title: { ar: "ليالي الرياض", en: "Layali Riyadh" },
      body: {
        ar: "زعفران على تمر، ثم عنبر وصندل.\nعطر للثوب الأبيض وللسهرة في الوقت نفسه.\n٥٠ مل من ٣٨٠ ر.س. اطلب من الرابط.",
        en: "Saffron over date, then amber and sandalwood.\nEvening wear that still belongs with a white thobe.\n50 ml from SAR 380. Order from the link.",
      },
    },
    {
      title: { ar: "الهدية", en: "The gift" },
      body: {
        ar: "مجموعة الغروب: خمسة تراكيب في الكف.\nلمن لم يختر بعد، أو لمن تُحب أن تُفاجَأ.\n٢٩٠ ر.س. تغليف كتان إن طلبتِ.",
        en: "The Sundown Set: five compositions in the palm.\nFor the one who has not chosen, or the one you surprise.\nSAR 290. Linen wrap if you ask.",
      },
    },
  ] satisfies Caption[],
  spend: {
    ar: "أول ثلاثين يوماً: محتوى يومي بلا إعلان مدفوع حتى يثبت الحجز. بعد أول عشرة طلبات: ٥٠٠–١٥٠٠ ر.س على إنستغرام وتيك توك داخل الرياض وجدة فقط، موجّهة لـ «عطر عربي، هدية، مجلس». لا نشتري متابعين.",
    en: "First thirty days: daily content, no paid ads until a booking holds. After the first ten orders: SAR 500–1500 on Instagram and TikTok inside Riyadh and Jeddah only, aimed at Arabian scent, gift, majlis. We do not buy followers.",
  },
  kpis: {
    ar: "نجاح الأسبوع: حجوزات حقيقية في الصندوق، لا إعجابات. هدف الشهر الأول: ١٠ طلبات مؤكدة. لا نعد بأرباح قبل تحويل واصل.",
    en: "A week succeeds on real inbox bookings, not likes. First-month aim: 10 confirmed orders. No profit promised before a transfer lands.",
  },
};

export const MONEY = {
  title: { ar: "إلى أين تذهب المبيعات", en: "Where the money goes" },
  public: {
    ar: "التحويل يصل حساب الدار مباشرة: STC Pay أو الآيبان المعلن عند الطلب. لا عمولة وسيطة، ولا بطاقة في الدردشة.",
    en: "Transfers land in the house account directly: STC Pay or the IBAN given at order. No intermediary cut, no card in chat.",
  },
  body: {
    ar: "لا وسطاء. العميل يحوّل على STC Pay أو الآيبان الذي حفظته في إعداد المتجر — المبلغ يصل حسابك البنكي مباشرة. مدى، إن رُبط، يمر Moyasar ثم إلى البنك المرتبط بسجلك. Stripe التجريبي وWhop ليسا مسار بيع العطر. نحن لا نمسك المال ولا نحوّل إلى بطاقة.",
    en: "No middle desk. The customer transfers to the STC Pay or IBAN you saved in store setup — funds land in your bank directly. Mada, if keyed, goes through Moyasar then to the bank on your CR. Test Stripe and Whop are not the perfume rail. We do not hold the money and we do not payout to a card.",
  },
};
