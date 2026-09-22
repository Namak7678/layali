import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSar(value: number, lang: "ar" | "en") {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function sanitizePhone(raw: string) {
  return raw.replace(/[^\d]/g, "").replace(/^00/, "");
}

export function waHref(phone: string, text: string) {
  const digits = sanitizePhone(phone);
  const q = encodeURIComponent(text);
  return digits ? `https://wa.me/${digits}?text=${q}` : `https://wa.me/?text=${q}`;
}

export function orderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `LY-${n}`;
}
