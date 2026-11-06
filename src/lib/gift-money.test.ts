import assert from "node:assert/strict";
import test from "node:test";
import { giftDue, giftPromoOn } from "./gift-money.ts";

test("LAYALI10 is the only gift-card promo", () => {
  assert.equal(giftPromoOn("layali10"), true);
  assert.equal(giftPromoOn("  LAYALI10 "), true);
  assert.equal(giftPromoOn("LAYALI"), false);
  assert.equal(giftPromoOn(""), false);
});

test("promo discounts the amount due and leaves a round SAR figure", () => {
  assert.equal(giftDue(150, false), 150);
  assert.equal(giftDue(150, true), 135);
  assert.equal(giftDue(300, true), 270);
  assert.equal(giftDue(500, true), 450);
});
