export type Family = "amber" | "fresh" | "oud" | "floral" | "home" | "set";

export type Size = {
  id: string;
  label: { ar: string; en: string };
  price: number;
};

export type Product = {
  slug: string;
  family: Family;
  featured?: boolean;
  image: string;
  name: { ar: string; en: string };
  tagline: { ar: string; en: string };
  story: { ar: string; en: string };
  wear: { ar: string; en: string };
  accords: { ar: string; en: string }[];
  notes: {
    top: { ar: string; en: string };
    heart: { ar: string; en: string };
    base: { ar: string; en: string };
  };
  sizes: Size[];
};

export const families: { id: "all" | Family; ar: string; en: string }[] = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "amber", ar: "عنبرية", en: "Amber" },
  { id: "oud", ar: "عود", en: "Oud" },
  { id: "floral", ar: "زهرية", en: "Floral" },
  { id: "fresh", ar: "منعشة", en: "Fresh" },
  { id: "home", ar: "للدار", en: "Home" },
  { id: "set", ar: "مجموعات", en: "Sets" },
];

export const products: Product[] = [
  {
    slug: "riyadh",
    family: "amber",
    featured: true,
    image: "/images/riyadh.jpg",
    name: { ar: "ليالي الرياض", en: "Layali Riyadh" },
    tagline: { ar: "زعفران، تمر، وعنبر دافئ", en: "Saffron, date, and warm amber" },
    story: {
      ar: "ليلة نجدية هادئة: زعفران يُفتح على تمر مجفف، ثم يستقر على عنبر ناعم وخشب صندل. عطر للسهرة وللثوب في الوقت نفسه.",
      en: "A quiet Najdi night: saffron over dried date, settling into soft amber and sandalwood. Evening wear that still belongs with a white thobe.",
    },
    wear: { ar: "ثبات ١٢ ساعة · سحبة متوسطة", en: "12-hour wear · moderate sillage" },
    accords: [
      { ar: "زعفران", en: "Saffron" },
      { ar: "تمر", en: "Date" },
      { ar: "عنبر", en: "Amber" },
    ],
    notes: {
      top: { ar: "زعفران، برغموت", en: "Saffron, bergamot" },
      heart: { ar: "تمر، ورد مجفف", en: "Date, dried rose" },
      base: { ar: "عنبر، صندل، مسك", en: "Amber, sandalwood, musk" },
    },
    sizes: [
      { id: "50", label: { ar: "٥٠ مل", en: "50 ml" }, price: 380 },
      { id: "100", label: { ar: "١٠٠ مل", en: "100 ml" }, price: 560 },
    ],
  },
  {
    slug: "jeddah",
    family: "fresh",
    featured: true,
    image: "/images/jeddah.jpg",
    name: { ar: "بحر جدّة", en: "Bahr Jeddah" },
    tagline: { ar: "ملح، ياسمين، ومسك أزرق", en: "Salt, jasmine, and blue musk" },
    story: {
      ar: "هواء الكورنيش بعد المغرب: ملح البحر على ياسمين رطب، ثم مسك نظيف لا يصرخ. للعاديّة التي تُريد أن تُتذكر.",
      en: "The corniche after dusk: sea salt on damp jasmine, then a clean musk that never shouts. For the everyday that wants to be remembered.",
    },
    wear: { ar: "ثبات ٨ ساعات · سحبة خفيفة", en: "8-hour wear · soft sillage" },
    accords: [
      { ar: "ملح البحر", en: "Sea salt" },
      { ar: "ياسمين", en: "Jasmine" },
      { ar: "مسك", en: "Musk" },
    ],
    notes: {
      top: { ar: "ملح، ليمون", en: "Salt, lemon" },
      heart: { ar: "ياسمين، أوزون", en: "Jasmine, ozone" },
      base: { ar: "مسك أبيض، أرز", en: "White musk, cedar" },
    },
    sizes: [
      { id: "50", label: { ar: "٥٠ مل", en: "50 ml" }, price: 360 },
      { id: "100", label: { ar: "١٠٠ مل", en: "100 ml" }, price: 520 },
    ],
  },
  {
    slug: "oud",
    family: "oud",
    featured: true,
    image: "/images/oud.jpg",
    name: { ar: "عود النخيل", en: "Oud al Nakheel" },
    tagline: { ar: "عود كمبودي، بخور، وجلد", en: "Cambodian oud, incense, and leather" },
    story: {
      ar: "دِهْن ثقيل على الخشب المحروق. عود كمبودي يُمسك ببخور الكنيسة وجلد السرج — للمجلس، لا للممرّ.",
      en: "A heavy oil on charred wood. Cambodian oud held by temple incense and saddle leather — for the majlis, not the hallway.",
    },
    wear: { ar: "ثبات ١٤ ساعة · سحبة قوية", en: "14-hour wear · strong sillage" },
    accords: [
      { ar: "عود", en: "Oud" },
      { ar: "بخور", en: "Incense" },
      { ar: "جلد", en: "Leather" },
    ],
    notes: {
      top: { ar: "زعفران مرّ، فلفل", en: "Bitter saffron, pepper" },
      heart: { ar: "عود كمبودي، بخور", en: "Cambodian oud, incense" },
      base: { ar: "جلد، صمغ، مسك غزال", en: "Leather, resin, deer musk" },
    },
    sizes: [
      { id: "12", label: { ar: "١٢ مل دهن", en: "12 ml oil" }, price: 420 },
      { id: "50", label: { ar: "٥٠ مل", en: "50 ml" }, price: 620 },
    ],
  },
  {
    slug: "taif",
    family: "floral",
    image: "/images/taif.jpg",
    name: { ar: "ورد الطائف", en: "Ward al Taif" },
    tagline: { ar: "ورد الطائف، صندل، وحليب", en: "Taif rose, sandalwood, and milk" },
    story: {
      ar: "الوردة كما تُقطف في الشفا: كثيفة، عسلية، بلا حلاوة الأطفال. تحتها صندل وحليب دافئ يُقرّبها من الجلد.",
      en: "The rose as it is picked in al-Shafa: dense, honeyed, never childish. Sandalwood and warm milk pull it against the skin.",
    },
    wear: { ar: "ثبات ١٠ ساعات · سحبة متوسطة", en: "10-hour wear · moderate sillage" },
    accords: [
      { ar: "ورد الطائف", en: "Taif rose" },
      { ar: "صندل", en: "Sandalwood" },
      { ar: "حليب", en: "Milk" },
    ],
    notes: {
      top: { ar: "ورد الطائف، فلفل وردي", en: "Taif rose, pink pepper" },
      heart: { ar: "عسل، فاوانيا", en: "Honey, peony" },
      base: { ar: "صندل، حليب، مسك", en: "Sandalwood, milk, musk" },
    },
    sizes: [
      { id: "50", label: { ar: "٥٠ مل", en: "50 ml" }, price: 420 },
      { id: "100", label: { ar: "١٠٠ مل", en: "100 ml" }, price: 610 },
    ],
  },
  {
    slug: "bakhoor",
    family: "home",
    image: "/images/bakhoor.jpg",
    name: { ar: "بخور الدار", en: "Bakhoor al Dar" },
    tagline: { ar: "رقائق عود، صمغ، وورد مجفف", en: "Oud chips, resin, and dried rose" },
    story: {
      ar: "صندوق خشب يفتح على رقائق معتدلة: ليست خانقة، تملأ المجلس ثم تهدأ. مع مبخرة نحاس صغيرة.",
      en: "A wooden box of measured chips: not choking, filling the majlis then settling. Comes with a small brass burner.",
    },
    wear: { ar: "٤٠ غ · يحرق على فحم هادئ", en: "40 g · burn on quiet coal" },
    accords: [
      { ar: "عود", en: "Oud" },
      { ar: "صمغ", en: "Resin" },
      { ar: "ورد", en: "Rose" },
    ],
    notes: {
      top: { ar: "ورد مجفف", en: "Dried rose" },
      heart: { ar: "بخور، صمغ", en: "Incense, resin" },
      base: { ar: "عود محترق، صندل", en: "Burnt oud, sandalwood" },
    },
    sizes: [{ id: "box", label: { ar: "صندوق ٤٠ غ", en: "40 g box" }, price: 280 }],
  },
  {
    slug: "discovery",
    family: "set",
    image: "/images/discovery.jpg",
    name: { ar: "مجموعة الغروب", en: "The Sundown Set" },
    tagline: { ar: "خمسة تراكيب بحجم السفر", en: "Five compositions in travel size" },
    story: {
      ar: "البيت كلّه في الكف: الرياض، جدّة، العود، ورد الطائف، ولمسة بخور. للهدية، أو لمن لم يختر بعد.",
      en: "The whole house in the palm: Riyadh, Jeddah, oud, Taif rose, and a trace of bakhoor. A gift, or a first choosing.",
    },
    wear: { ar: "٥ × ٧ مل", en: "5 × 7 ml" },
    accords: [
      { ar: "مجموعة", en: "Collection" },
      { ar: "سفر", en: "Travel" },
      { ar: "هدية", en: "Gift" },
    ],
    notes: {
      top: { ar: "البيت كامل", en: "The full house" },
      heart: { ar: "خمس تراكيب", en: "Five compositions" },
      base: { ar: "علبة كتان", en: "Linen case" },
    },
    sizes: [{ id: "set", label: { ar: "علبة كاملة", en: "Full set" }, price: 290 }],
  },
];

export const reviews = [
  {
    name: { ar: "نورة · الرياض", en: "Noura · Riyadh" },
    body: {
      ar: "ليالي الرياض ثبت من العصر إلى منتصف الليل، والزعفران فيه نظيف مو ثقيل.",
      en: "Layali Riyadh lasted from late afternoon to midnight. The saffron is clean, never heavy.",
    },
  },
  {
    name: { ar: "خالد · جدة", en: "Khalid · Jeddah" },
    body: {
      ar: "عود النخيل للمجالس. طلبت الثاني بعد أسبوع. التوصيل كان في ثلاثة أيام.",
      en: "Oud al Nakheel is for the majlis. I ordered a second bottle a week later. Three-day delivery.",
    },
  },
  {
    name: { ar: "لمى · الخبر", en: "Lama · Khobar" },
    body: {
      ar: "مجموعة الغروب غيّرت رأيي في الهدايا. العلبة نفسها تستاهل.",
      en: "The Sundown Set changed how I gift. The case alone is worth it.",
    },
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function fromPrice(product: Product) {
  return Math.min(...product.sizes.map((s) => s.price));
}

export const SHIPPING = 25;
export const FREE_SHIPPING_OVER = 450;
export const GIFT_WRAP = 25;
export const PROMO_CODE = "LAYALI10";
export const PROMO_RATE = 0.1;
