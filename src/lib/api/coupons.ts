import type { Coupon, CouponDiscountType } from "@/types"
import { stripHtml } from "@/lib/format"
import { wcDelete, wcGetList, wcPost } from "./wc-client"

interface WcCoupon {
  id: number
  code: string
  discount_type: string
  amount: string
  description: string
  date_expires: string | null
  usage_count: number
}

const DISCOUNT_TYPES: CouponDiscountType[] = ["percent", "fixed_cart", "fixed_product"]

function mapCoupon(c: WcCoupon): Coupon {
  return {
    id: c.id,
    code: c.code,
    discountType: DISCOUNT_TYPES.includes(c.discount_type as CouponDiscountType)
      ? (c.discount_type as CouponDiscountType)
      : "fixed_cart",
    amount: c.amount,
    description: stripHtml(c.description || ""),
    dateExpires: c.date_expires,
    usageCount: c.usage_count ?? 0,
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  const { data } = await wcGetList<WcCoupon>("coupons", { orderby: "date", order: "desc" })
  return data.map(mapCoupon)
}

export interface CouponInput {
  code: string
  discountType: CouponDiscountType
  amount: string
  description?: string
  // YYYY-MM-DD or omitted for no expiry.
  dateExpires?: string
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const wc = await wcPost<WcCoupon>("coupons", {
    code: input.code,
    discount_type: input.discountType,
    amount: input.amount,
    description: input.description ?? "",
    date_expires: input.dateExpires || null,
  })
  return mapCoupon(wc)
}

export async function deleteCoupon(id: number): Promise<void> {
  await wcDelete(`coupons/${id}`, { force: true })
}
