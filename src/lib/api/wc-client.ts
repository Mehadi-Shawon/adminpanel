// Thin fetch client for the PHP proxy in server/wc-proxy.php. The proxy
// holds the real WooCommerce consumer key/secret server-side — this client
// only ever knows the proxy's public URL (safe to expose, it's just an
// endpoint), never the credentials themselves.

const PROXY_URL = import.meta.env.VITE_WC_PROXY_URL as string | undefined

type Query = Record<string, string | number | boolean | undefined>

// WooCommerce/WordPress error responses are JSON like
// { code: "product_invalid_sku", message: "Invalid or duplicated SKU.", data: { status: 400 } }.
// Surface that human-readable `message` (tags stripped) so the UI can show
// "Invalid or duplicated SKU." instead of a raw JSON blob. Falls back to the
// raw body when the response isn't the expected shape.
function extractErrorMessage(status: number, path: string, body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: unknown }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.replace(/<[^>]*>/g, "").trim()
    }
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return body.slice(0, 300) || `WooCommerce request failed (${status} ${path})`
}

function toSearchParams(path: string, query?: Query) {
  const params = new URLSearchParams({ path })
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value))
    }
  }
  return params
}

async function request(path: string, init: RequestInit, query?: Query) {
  if (!PROXY_URL) {
    throw new Error("VITE_WC_PROXY_URL is not configured — set it in .env")
  }
  const url = `${PROXY_URL}?${toSearchParams(path, query).toString()}`
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(extractErrorMessage(res.status, path, body))
  }
  return res
}

export interface WcListResult<T> {
  data: T[]
  total: number
  totalPages: number
}

// WooCommerce paginates server-side (100/page max). This fetches page 1 to
// learn X-WP-TotalPages, then — if there's more than one page — fetches the
// rest (2..totalPages) in parallel and concatenates everything in page
// order, so callers always get the store's complete list regardless of how
// many orders/products it has. A MAX_PAGES safety ceiling guards against a
// pathological/misconfigured response claiming an absurd page count; if the
// real totalPages exceeds it, only up to the ceiling is fetched and a
// console.warn notes how many pages were skipped (never truncate silently).
const MAX_PAGES = 50 // 50 * 100 per_page = up to 5000 records; a normal small-to-medium store won't get close

export async function wcGetList<T>(path: string, query?: Query): Promise<WcListResult<T>> {
  // page/per_page spread LAST so a caller-supplied query can never silently
  // override which page this specific request is for.
  const firstRes = await request(path, { method: "GET" }, { ...query, per_page: 100, page: 1 })
  const firstPageData = (await firstRes.json()) as T[]
  const total = Number(firstRes.headers.get("X-WP-Total") ?? firstPageData.length)
  const totalPages = Number(firstRes.headers.get("X-WP-TotalPages") ?? 1)

  if (totalPages <= 1) {
    return { data: firstPageData, total, totalPages }
  }

  const pagesToFetch = Math.min(totalPages, MAX_PAGES)
  if (totalPages > MAX_PAGES) {
    console.warn(
      `wcGetList(${path}): totalPages (${totalPages}) exceeds the safety ceiling of ${MAX_PAGES} — ` +
        `only fetching pages 1-${MAX_PAGES} (${(totalPages - MAX_PAGES) * 100} records skipped, roughly).`
    )
  }

  // allSettled, not all: one flaky page (a transient 500/429/timeout) should
  // not throw away every other page that fetched fine. Failed pages are
  // dropped with a loud warning rather than silently, and rather than
  // rejecting the whole list.
  const settled = await Promise.allSettled(
    Array.from({ length: pagesToFetch - 1 }, (_, i) => {
      const page = i + 2
      return request(path, { method: "GET" }, { ...query, per_page: 100, page }).then(
        (res) => res.json() as Promise<T[]>
      )
    })
  )

  const restPages: T[][] = []
  const failedPages: number[] = []
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      restPages.push(result.value)
    } else {
      failedPages.push(i + 2)
    }
  })
  if (failedPages.length > 0) {
    console.warn(
      `wcGetList(${path}): failed to fetch page(s) ${failedPages.join(", ")} of ${pagesToFetch} — ` +
        `returning the pages that did succeed instead of discarding everything.`
    )
  }

  const data = [firstPageData, ...restPages].flat()
  return { data, total, totalPages }
}

export async function wcGet<T>(path: string, query?: Query): Promise<T> {
  const res = await request(path, { method: "GET" }, query)
  return res.json()
}

export async function wcPost<T>(path: string, body: unknown): Promise<T> {
  const res = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function wcPut<T>(path: string, body: unknown): Promise<T> {
  const res = await request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.json()
}

export interface WcMedia {
  id: number
  source_url: string
}

// WordPress's media endpoint takes the raw file bytes as the body with
// Content-Type/Content-Disposition describing the file — not multipart form
// data. This mirrors what server/wc-proxy.php forwards untouched.
export async function wcUploadMedia(file: File): Promise<WcMedia> {
  if (!PROXY_URL) {
    throw new Error("VITE_WC_PROXY_URL is not configured — set it in .env")
  }
  const url = `${PROXY_URL}?${toSearchParams("media").toString()}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.name}"`,
    },
    body: file,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(extractErrorMessage(res.status, "media", body))
  }
  return res.json()
}
