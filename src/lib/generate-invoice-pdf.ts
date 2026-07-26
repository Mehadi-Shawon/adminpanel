import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency, formatDate } from "@/lib/format"
import { advanceLabel, getAdvanceBreakdown } from "@/lib/order-advance"
import type { Order } from "@/types"

const PAGE_WIDTH = 595.28 // A4 in pt
const PAGE_HEIGHT = 841.89
const MARGIN_X = 44
const RIGHT_EDGE = PAGE_WIDTH - MARGIN_X
const CONTENT_WIDTH = RIGHT_EDGE - MARGIN_X
const FOOTER_TOP = PAGE_HEIGHT - 62

type Rgb = [number, number, number]

// Monochrome palette with one dark accent — the brand logo is a flat black
// mark, and this keeps the invoice legible when printed in greyscale.
const INK: Rgb = [17, 24, 39]
const BODY: Rgb = [55, 65, 81]
const MUTED: Rgb = [120, 128, 142]
const RULE: Rgb = [226, 231, 238]
const PANEL: Rgb = [248, 250, 252]
const WHITE: Rgb = [255, 255, 255]

const COMPANY = {
  name: "Hobinh",
  site: "www.hobinh.com",
  email: "support@hobinh.com",
}

function loadImageAsDataUrl(src: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve({ dataUrl: canvas.toDataURL("image/png"), width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => reject(new Error("Failed to load logo image"))
    img.src = src
  })
}

// jsPDF's built-in helvetica is WinAnsi-encoded, so anything outside Latin-1
// (currency symbols, typographic minus) renders as garbage. formatCurrency
// already yields an ASCII "BDT 1,500"; this guards the rest.
function ascii(value: string) {
  return value.replace(/−/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/** Draws a label/value pair stacked vertically, returns the next y. */
function drawStackedRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueX: number
) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  doc.text(label.toUpperCase(), x, y)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text(value, valueX, y, { align: "right" })
  return y + 15
}

function drawHeader(doc: jsPDF, order: Order, logo: { dataUrl: string; width: number; height: number } | null) {
  let y = 46

  if (logo) {
    const logoWidth = 118
    const logoHeight = (logo.height / logo.width) * logoWidth
    doc.addImage(logo.dataUrl, "PNG", MARGIN_X, y - 6, logoWidth, logoHeight)
    y += logoHeight - 2
  } else {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.setTextColor(...INK)
    doc.text(COMPANY.name, MARGIN_X, y + 14)
    y += 24
  }

  // Right side: the word INVOICE, tracked out, over the identifying details.
  doc.setFont("helvetica", "bold")
  doc.setFontSize(19)
  doc.setTextColor(...INK)
  doc.text("INVOICE", RIGHT_EDGE, 64, { align: "right", charSpace: 1.6 })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(`${order.orderNumber}  •  ${formatDate(order.createdAt, "MMM d, yyyy")}`, RIGHT_EDGE, 82, {
    align: "right",
  })

  const ruleY = Math.max(y + 18, 100)
  doc.setFillColor(...INK)
  doc.rect(MARGIN_X, ruleY, CONTENT_WIDTH, 2, "F")
  return ruleY + 26
}

/** Bill To panel on the left, order summary panel on the right. */
function drawPartyPanels(doc: jsPDF, order: Order, startY: number) {
  const gap = 20
  const colWidth = (CONTENT_WIDTH - gap) / 2
  const leftX = MARGIN_X
  const rightX = MARGIN_X + colWidth + gap

  const fields = [
    order.customerName,
    order.customerPhone,
    order.shippingAddress.line1,
    [order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip]
      .filter(Boolean)
      .join(", "),
    order.shippingAddress.country,
  ]
    .map((line) => (line ?? "").trim())
    .filter(Boolean)

  // Wrap up front so the panel is sized to the text it actually holds — a long
  // street address would otherwise spill past the rounded rect.
  const textWidth = colWidth - 28
  const addressLines = fields.flatMap((line, index) => {
    doc.setFont("helvetica", index === 0 ? "bold" : "normal")
    doc.setFontSize(index === 0 ? 10 : 9)
    const wrapped: string[] = doc.splitTextToSize(ascii(line), textWidth)
    return wrapped.map((text) => ({ text, emphasis: index === 0 }))
  })

  const details: Array<[string, string]> = [
    ["Invoice No.", order.orderNumber.replace("#", "")],
    ["Order Date", formatDate(order.createdAt, "MMM d, yyyy")],
    ["Status", titleCase(order.status)],
  ]

  const rows = Math.max(addressLines.length, details.length)
  const panelHeight = 30 + rows * 15 + 6

  doc.setFillColor(...PANEL)
  doc.roundedRect(leftX, startY, colWidth, panelHeight, 5, 5, "F")
  doc.roundedRect(rightX, startY, colWidth, panelHeight, 5, 5, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text("BILL TO", leftX + 14, startY + 20, { charSpace: 0.8 })
  doc.text("ORDER DETAILS", rightX + 14, startY + 20, { charSpace: 0.8 })

  let ly = startY + 38
  addressLines.forEach((line) => {
    doc.setFont("helvetica", line.emphasis ? "bold" : "normal")
    doc.setFontSize(line.emphasis ? 10 : 9)
    doc.setTextColor(...(line.emphasis ? INK : BODY))
    doc.text(line.text, leftX + 14, ly)
    ly += 15
  })

  let ry = startY + 38
  details.forEach(([label, value]) => {
    ry = drawStackedRow(doc, label, ascii(value), rightX + 14, ry, rightX + colWidth - 14)
  })

  return startY + panelHeight + 26
}

function drawItemsTable(doc: jsPDF, order: Order, startY: number) {
  const qtyW = 44
  const priceW = 92
  const amountW = 96
  const productW = CONTENT_WIDTH - qtyW - priceW - amountW

  // Variation labels are emitted as their own muted row beneath the product so
  // the product name keeps its weight; `isVariantRow` marks them for styling
  // and tells the group-separator hook not to draw a rule yet.
  const body: Array<Array<string | { content: string; styles: Record<string, unknown> }>> = []
  const variantRowIndexes = new Set<number>()

  order.items.forEach((item) => {
    body.push([
      ascii(item.productName),
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity * item.unitPrice),
    ])
    if (item.variationLabel) {
      variantRowIndexes.add(body.length)
      body.push([
        {
          content: ascii(item.variationLabel),
          styles: {
            fontSize: 8,
            textColor: MUTED,
            cellPadding: { top: 0, right: 10, bottom: 9, left: 10 },
          },
        },
        "",
        "",
        "",
      ])
    }
  })

  autoTable(doc, {
    startY,
    theme: "plain",
    margin: { left: MARGIN_X, right: MARGIN_X, top: 56, bottom: 80 },
    tableWidth: CONTENT_WIDTH,
    head: [["Product", "Qty", "Unit Price", "Amount"]],
    body,
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      textColor: BODY,
      cellPadding: { top: 9, right: 10, bottom: 9, left: 10 },
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: INK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 9, right: 10, bottom: 9, left: 10 },
    },
    columnStyles: {
      0: { cellWidth: productW, halign: "left", textColor: INK, fontStyle: "bold" },
      1: { cellWidth: qtyW, halign: "right" },
      2: { cellWidth: priceW, halign: "right" },
      3: { cellWidth: amountW, halign: "right", textColor: INK, fontStyle: "bold" },
    },
    // Hairline under each item, skipped between a product and its variation so
    // the pair reads as one entry.
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 3) return
      if (variantRowIndexes.has(data.row.index + 1)) return
      const lineY = data.cell.y + data.cell.height
      doc.setDrawColor(...RULE)
      doc.setLineWidth(0.5)
      doc.line(MARGIN_X, lineY, RIGHT_EDGE, lineY)
    },
  })

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

function drawTotals(doc: jsPDF, order: Order, startY: number) {
  const blockWidth = 250
  const blockX = RIGHT_EDGE - blockWidth
  const labelX = blockX
  const breakdown = getAdvanceBreakdown(order)

  // `strong` marks the gross order total, which sits above the advance
  // deduction and reads as a subtotal for the block.
  const rows: Array<{ label: string; value: string; strong?: boolean; rule?: boolean }> = [
    { label: "Subtotal", value: formatCurrency(order.subtotal) },
    { label: "Shipping", value: order.shipping === 0 ? "Free" : formatCurrency(order.shipping) },
    { label: "Order total", value: formatCurrency(breakdown.orderValue), strong: true, rule: true },
    { label: advanceLabel(breakdown), value: `- ${formatCurrency(breakdown.advance)}` },
  ]

  const bandHeight = 36
  const blockHeight = rows.length * 17 + 26 + bandHeight

  // Keep the whole totals block together rather than letting it split.
  let y = startY + 28
  if (y + blockHeight > FOOTER_TOP - 20) {
    doc.addPage()
    y = 76
  }

  rows.forEach((row) => {
    if (row.rule) {
      y -= 4
      doc.setDrawColor(...RULE)
      doc.setLineWidth(0.5)
      doc.line(blockX, y, RIGHT_EDGE, y)
      y += 14
    }
    doc.setFontSize(row.strong ? 10 : 9.5)
    doc.setFont("helvetica", row.strong ? "bold" : "normal")
    doc.setTextColor(...(row.strong ? INK : MUTED))
    doc.text(row.label, labelX, y)
    doc.setTextColor(...(row.strong ? INK : BODY))
    doc.text(ascii(row.value), RIGHT_EDGE, y, { align: "right" })
    y += 17
  })

  y += 2
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.5)
  doc.line(blockX, y, RIGHT_EDGE, y)
  y += 12

  doc.setFillColor(...INK)
  doc.roundedRect(blockX, y, blockWidth, bandHeight, 5, 5, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...WHITE)
  doc.text("DUE ON DELIVERY", blockX + 14, y + 22, { charSpace: 0.6 })
  doc.setFontSize(13)
  doc.text(ascii(formatCurrency(breakdown.due)), RIGHT_EDGE - 14, y + 23, { align: "right" })

  return y + bandHeight
}

function drawFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)

    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.5)
    doc.line(MARGIN_X, FOOTER_TOP, RIGHT_EDGE, FOOTER_TOP)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...INK)
    doc.text(`Thank you for shopping with ${COMPANY.name}`, MARGIN_X, FOOTER_TOP + 18)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`${COMPANY.site}  •  ${COMPANY.email}`, MARGIN_X, FOOTER_TOP + 32)

    doc.text(`Page ${page} of ${pageCount}`, RIGHT_EDGE, FOOTER_TOP + 32, { align: "right" })
  }
}

export async function buildInvoicePdf(order: Order): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  doc.setProperties({
    title: `Invoice ${order.orderNumber} — ${COMPANY.name}`,
    subject: `Invoice for order ${order.orderNumber}`,
    author: COMPANY.name,
  })

  let logo: { dataUrl: string; width: number; height: number } | null = null
  try {
    logo = await loadImageAsDataUrl("/hobinh-logo.png")
  } catch {
    logo = null
  }

  const afterHeader = drawHeader(doc, order, logo)
  const afterPanels = drawPartyPanels(doc, order, afterHeader)
  const afterTable = drawItemsTable(doc, order, afterPanels)
  drawTotals(doc, order, afterTable)
  drawFooters(doc)

  return doc
}

export function invoiceFilename(order: Order) {
  return `invoice-${order.orderNumber.replace("#", "")}.pdf`
}

export async function generateInvoicePdf(order: Order) {
  const previewWindow = window.open("", "_blank")
  const doc = await buildInvoicePdf(order)
  const blobUrl = String(doc.output("bloburl"))

  if (previewWindow) {
    previewWindow.location.href = blobUrl
  } else {
    doc.save(invoiceFilename(order))
  }
}
