import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Order } from "@/types"

const ADVANCE_RATE = 0.1
const PAGE_WIDTH = 595.28 // A4 in pt
const PAGE_HEIGHT = 841.89
const MARGIN_X = 40
const RIGHT_EDGE = PAGE_WIDTH - MARGIN_X

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

export async function buildInvoicePdf(order: Order): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  let y = 40

  try {
    const logo = await loadImageAsDataUrl("/hobinh-logo.png")
    const logoWidth = 90
    const logoHeight = (logo.height / logo.width) * logoWidth
    doc.addImage(logo.dataUrl, "PNG", MARGIN_X, y, logoWidth, logoHeight)
  } catch {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("Hobinh", MARGIN_X, y + 20)
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("INVOICE", RIGHT_EDGE, y + 12, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Order ${order.orderNumber}`, RIGHT_EDGE, y + 28, { align: "right" })
  doc.text(formatDate(order.createdAt, "MMM d, yyyy"), RIGHT_EDGE, y + 42, { align: "right" })

  y += 70
  doc.setDrawColor(210)
  doc.line(MARGIN_X, y, RIGHT_EDGE, y)

  y += 24
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Bill To", MARGIN_X, y)

  doc.setFont("helvetica", "normal")
  y += 14
  doc.text(order.customerName, MARGIN_X, y)
  y += 14
  doc.text(order.customerPhone, MARGIN_X, y)
  y += 14
  doc.text(
    `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`,
    MARGIN_X,
    y
  )
  y += 14
  doc.text(order.shippingAddress.country, MARGIN_X, y)

  y += 26
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Items", MARGIN_X, y)
  y += 8

  const tableWidth = RIGHT_EDGE - MARGIN_X

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_X, right: MARGIN_X },
    tableWidth,
    head: [["Product", "Qty", "Unit price", "Amount"]],
    body: order.items.map((item) => [
      item.productName,
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity * item.unitPrice),
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [237, 237, 240], textColor: [40, 40, 40], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: tableWidth - 40 - 90 - 95, halign: "left" },
      1: { cellWidth: 40, halign: "right" },
      2: { cellWidth: 95, halign: "right" },
      3: { cellWidth: 90, halign: "right" },
    },
  })

  const { finalY } = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
  y = finalY + 28

  const advance = Math.round(order.total * ADVANCE_RATE)
  const due = order.total - advance
  const labelX = RIGHT_EDGE - 200

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Subtotal", labelX, y)
  doc.text(formatCurrency(order.subtotal), RIGHT_EDGE, y, { align: "right" })
  y += 16
  doc.text("Shipping", labelX, y)
  doc.text(order.shipping === 0 ? "Free" : formatCurrency(order.shipping), RIGHT_EDGE, y, { align: "right" })

  y += 10
  doc.setDrawColor(210)
  doc.line(labelX, y, RIGHT_EDGE, y)
  y += 16

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Total", labelX, y)
  doc.text(formatCurrency(order.total), RIGHT_EDGE, y, { align: "right" })

  y += 22
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Advance paid (10%)", labelX, y)
  doc.text(formatCurrency(advance), RIGHT_EDGE, y, { align: "right" })
  y += 16
  doc.setFont("helvetica", "bold")
  doc.text("Due on delivery", labelX, y)
  doc.text(formatCurrency(due), RIGHT_EDGE, y, { align: "right" })

  y += 26
  const noteText = `Note: A 10% advance payment (${formatCurrency(advance)}) is required to confirm this order. The remaining ${formatCurrency(due)} is due on delivery.`
  doc.setFont("helvetica", "italic")
  doc.setFontSize(9)
  const noteLines = doc.splitTextToSize(noteText, RIGHT_EDGE - MARGIN_X - 20)
  const noteBoxHeight = noteLines.length * 12 + 16

  doc.setFillColor(247, 247, 240)
  doc.roundedRect(MARGIN_X, y, RIGHT_EDGE - MARGIN_X, noteBoxHeight, 4, 4, "F")
  doc.setTextColor(90)
  doc.text(noteLines, MARGIN_X + 10, y + 16)

  doc.setDrawColor(230)
  doc.line(MARGIN_X, PAGE_HEIGHT - 66, RIGHT_EDGE, PAGE_HEIGHT - 66)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text("Thank you for shopping with Hobinh — Your Trusted Place!", PAGE_WIDTH / 2, PAGE_HEIGHT - 48, {
    align: "center",
  })
  doc.setFontSize(8)
  doc.text("hobinh.com  •  service@hobinh.com", PAGE_WIDTH / 2, PAGE_HEIGHT - 34, { align: "center" })

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
