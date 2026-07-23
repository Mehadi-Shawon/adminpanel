// WooCommerce coupon discount types (coupons endpoint).
export type CouponDiscountType = "percent" | "fixed_cart" | "fixed_product"

export interface Coupon {
  id: number
  code: string
  discountType: CouponDiscountType
  // WooCommerce returns amount as a string; a percentage for "percent",
  // otherwise a currency amount.
  amount: string
  description: string
  // ISO date (YYYY-MM-DD) or null if the coupon never expires.
  dateExpires: string | null
  usageCount: number
}
