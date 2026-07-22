import { format, formatDistanceToNow } from "date-fns"

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string | Date, pattern = "MMM d, yyyy"): string {
  return format(new Date(value), pattern)
}

export function formatRelativeTime(value: string | Date): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}
