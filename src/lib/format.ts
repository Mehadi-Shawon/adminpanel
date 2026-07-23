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

export function getDisplayName(email: string): string {
  const localPart = email.split("@")[0] ?? email
  return (
    localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Admin"
  )
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  return "Good Evening"
}

// WooCommerce sometimes returns taxonomy names with HTML markup or entities
// (e.g. "<p class="...">Tea &amp; Coffee</p>"). Strip tags and decode the
// common entities so names display as plain text instead of raw markup.
export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim()
}
