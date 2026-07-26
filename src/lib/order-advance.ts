import type { Order } from "@/types"

/** Standing policy: 10% of the order value is taken as an advance. */
export const ADVANCE_RATE = 0.1

export interface AdvanceBreakdown {
  /** Goods + shipping, before any advance is deducted. */
  orderValue: number
  advance: number
  due: number
  /**
   * True when the advance is a real amount collected and recorded on the order
   * (a negative "Advance paid" fee line), rather than the 10% policy estimate.
   */
  isRecorded: boolean
}

// An order created through Custom Order can carry the exact advance that was
// taken; anything else (a website order, say) falls back to the standard 10%.
export function getAdvanceBreakdown(order: Order): AdvanceBreakdown {
  const orderValue = order.subtotal + order.shipping
  const isRecorded = order.advancePaid > 0
  const advance = isRecorded ? order.advancePaid : Math.round(orderValue * ADVANCE_RATE)
  return { orderValue, advance, due: orderValue - advance, isRecorded }
}

export function advanceLabel(breakdown: AdvanceBreakdown) {
  return breakdown.isRecorded ? "Advance paid" : `Advance (${Math.round(ADVANCE_RATE * 100)}%)`
}
