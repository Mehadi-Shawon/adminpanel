export interface ParsedCustomer {
  name?: string
  phone?: string
  address?: string
  town?: string
  city?: string
  email?: string
  note?: string
}

// Maps a label word (the bit before a ":" / "-" / "=" on a line) to a field.
function labelField(key: string): keyof ParsedCustomer | null {
  const k = key.toLowerCase()
  if (/name|customer/.test(k)) return "name"
  if (/e-?mail|gmail/.test(k)) return "email"
  if (/phone|mobile|mob|cell|contact|whats?app|imo/.test(k)) return "phone"
  if (/town|area|thana|upazil|police\s*station/.test(k)) return "town"
  if (/city|district|zila|division|dist/.test(k)) return "city"
  if (/address|adress|location|thikana/.test(k)) return "address"
  if (/note|comment|instruction|remark|delivery/.test(k)) return "note"
  return null
}

const digits = (s: string) => s.replace(/[^\d+]/g, "")

// Best-effort extraction of customer details from a pasted message. Handles
// labeled lines ("Town: …", "Email: …", "Note: …") plus loose email/phone
// anywhere in the text, and falls back to line order for name/address. It's a
// time-saver — every field it fills stays fully editable in the form.
export function parseOrderText(raw: string): ParsedCustomer {
  const text = raw.trim()
  if (!text) return {}

  const result: ParsedCustomer = {}
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const unlabeled: string[] = []

  // --- Labeled lines first (most reliable). ---
  for (const line of lines) {
    const m = line.match(/^([^:\-–=]{2,30})\s*[:\-–=]\s*(.+)$/)
    const field = m ? labelField(m[1].trim()) : null
    if (m && field && m[2].trim()) {
      if (!result[field]) {
        result[field] = field === "phone" ? digits(m[2].trim()) : m[2].trim()
      }
    } else {
      unlabeled.push(line)
    }
  }

  // --- Loose email / phone anywhere in the text. ---
  if (!result.email) {
    const em = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    if (em) result.email = em[0]
  }
  if (!result.phone) {
    const ph = text.match(/(?:\+?88)?0?1[3-9]\d{8}/) ?? text.match(/\+?\d[\d\s\-()]{8,}\d/)
    if (ph) result.phone = ph[0].replace(/[\s\-()]/g, "")
  }

  // --- Unlabeled fallbacks for name / address. ---
  const phoneDigits = result.phone ? digits(result.phone) : ""
  const remaining = unlabeled.filter((l) => {
    if (result.email && l.includes(result.email)) return false
    if (phoneDigits && digits(l).includes(phoneDigits)) return false
    return true
  })

  if (!result.name) {
    result.name = remaining.find((l) => !/\d/.test(l) && l.length <= 40)
  }

  // Whatever unlabeled lines are left (minus the name) are treated as the
  // address — appended to a labeled address so multi-line addresses survive.
  const addressExtra = remaining.filter((l) => l !== result.name).join(", ")
  if (addressExtra) {
    result.address = result.address ? `${result.address}, ${addressExtra}` : addressExtra
  }

  return result
}
