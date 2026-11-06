import { PROMO_CODE, PROMO_RATE } from "./catalog.ts";

/** True only for the published launch code. Matching is case-insensitive. */
export function giftPromoOn(code: string) {
  return code.trim().toUpperCase() === PROMO_CODE;
}

/**
 * What the buyer transfers. The card's face value stays intact for the
 * recipient; LAYALI10 discounts the amount due, not the code's value.
 */
export function giftDue(faceSar: number, promoOn: boolean) {
  if (!promoOn) return faceSar;
  return Math.round(faceSar * (1 - PROMO_RATE));
}
