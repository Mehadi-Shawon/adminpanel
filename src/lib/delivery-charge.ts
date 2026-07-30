/**
 * Standing policy: orders worth less than this pay a flat delivery charge,
 * anything at or above it ships free.
 */
export const FREE_DELIVERY_THRESHOLD = 3000

/** Flat delivery charge applied below {@link FREE_DELIVERY_THRESHOLD}. */
export const DELIVERY_CHARGE = 150

/**
 * The delivery charge for a given goods subtotal. The threshold is checked
 * against the goods value only — an advance is money already received, not a
 * discount, so it must not push an order under the free-delivery line.
 */
export function getDeliveryCharge(goodsSubtotal: number): number {
  // An empty draft isn't an order yet, so it shouldn't show a charge.
  if (goodsSubtotal <= 0) return 0
  return goodsSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE
}
