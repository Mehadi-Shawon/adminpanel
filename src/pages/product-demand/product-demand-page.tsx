import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ClipboardList, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "@/components/order-status-badge"
import { useOrders } from "@/hooks/use-orders"
import { formatCurrency } from "@/lib/format"
import type { OrderStatus } from "@/types"

// One aggregated line: a distinct product+variation summed across the orders
// that match the selected status.
interface DemandRow {
  key: string
  productName: string
  variationLabel?: string
  imageUrl: string
  units: number
  orders: number
  value: number
}

type StatusFilter = OrderStatus | "all"

const columns: ColumnDef<DemandRow>[] = [
  {
    id: "product",
    header: "Product",
    accessorFn: (r) => r.productName,
    cell: ({ row }) => {
      const r = row.original
      return (
        <div className="flex items-center gap-2.5">
          {r.imageUrl ? (
            <img
              src={r.imageUrl}
              alt=""
              className="size-9 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
            />
          ) : (
            <div className="size-9 shrink-0 rounded-md bg-muted" />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{r.productName}</span>
            {r.variationLabel && (
              <span className="truncate text-xs text-muted-foreground">{r.variationLabel}</span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "units",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Units" />,
    cell: ({ row }) => (
      <span className="font-mono text-sm font-semibold tabular-nums">{row.original.units}</span>
    ),
  },
  {
    accessorKey: "orders",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">{row.original.orders}</span>
    ),
  },
  {
    accessorKey: "value",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.value)}</span>
    ),
  },
]

export function ProductDemandPage() {
  const [status, setStatus] = useState<StatusFilter>("processing")
  const orders = useOrders({ status: status === "all" ? undefined : status })

  const rows = useMemo<DemandRow[]>(() => {
    const map = new Map<string, DemandRow>()
    const ordersSeen = new Map<string, Set<string>>()
    for (const order of orders.data ?? []) {
      for (const item of order.items) {
        const key = `${item.productId}|${item.variationId ?? ""}`
        let row = map.get(key)
        if (!row) {
          row = {
            key,
            productName: item.productName,
            variationLabel: item.variationLabel,
            imageUrl: item.imageUrl,
            units: 0,
            orders: 0,
            value: 0,
          }
          map.set(key, row)
          ordersSeen.set(key, new Set())
        }
        row.units += item.quantity
        row.value += item.quantity * item.unitPrice
        const seen = ordersSeen.get(key)!
        if (!seen.has(order.id)) {
          seen.add(order.id)
          row.orders += 1
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.units - a.units)
  }, [orders.data])

  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0)
  const statusLabel = status === "all" ? "All statuses" : ORDER_STATUS_LABELS[status]

  function exportCsv() {
    const esc = (v: string | number) => {
      const s = String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = ["Product", "Variation", "Units", "Orders", "Value"]
    const body = rows.map((r) =>
      [r.productName, r.variationLabel ?? "", r.units, r.orders, r.value].map(esc).join(",")
    )
    const csv = [header.join(","), ...body].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `product-demand-${status}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printList() {
    const win = window.open("", "_blank")
    if (!win) return
    const esc = (s: string) =>
      s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c)
    const rowsHtml = rows
      .map(
        (r) =>
          `<tr><td>${esc(r.productName)}${
            r.variationLabel ? ` <span class="v">— ${esc(r.variationLabel)}</span>` : ""
          }</td><td class="n">${r.units}</td><td class="n">${r.orders}</td><td class="n">${esc(
            formatCurrency(r.value)
          )}</td></tr>`
      )
      .join("")
    win.document.write(
      `<!doctype html><html><head><title>Product Demand</title><meta charset="utf-8"/>
      <style>
        body{font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;margin:40px}
        h1{font-size:20px;margin:0 0 4px}
        .sub{color:#8a8a8a;font-size:12px;margin:0 0 20px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{text-align:left;text-transform:uppercase;font-size:9px;letter-spacing:.06em;color:#8a8a8a;border-bottom:1px solid #1a1a1a;padding:8px 6px}
        td{padding:8px 6px;border-bottom:1px solid #e3e8e5}
        .n{text-align:right;font-variant-numeric:tabular-nums}
        th.n{text-align:right}
        .v{color:#8a8a8a}
      </style></head><body>
      <h1>Product Demand</h1>
      <p class="sub">${esc(statusLabel)} &bull; ${rows.length} products &bull; ${totalUnits} units</p>
      <table><thead><tr><th>Product</th><th class="n">Units</th><th class="n">Orders</th><th class="n">Value</th></tr></thead>
      <tbody>${rowsHtml}</tbody></table>
      </body></html>`
    )
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold">
          <ClipboardList className="size-6 text-muted-foreground" />
          Product Demand
        </h1>
        <p className="text-sm text-muted-foreground">
          Every product across orders, counted separately by variation — so you know exactly how
          many of each to prepare.
        </p>
      </div>

      {orders.isPending ? (
        <DataTableSkeleton columns={4} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          initialSorting={[{ id: "units", desc: true }]}
          emptyMessage="No items in orders matching this status."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: ORDER_STATUS_COLOR[s] }}
                        />
                        {ORDER_STATUS_LABELS[s]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm text-muted-foreground sm:ml-2">
                {rows.length} product{rows.length === 1 ? "" : "s"} · {totalUnits} unit
                {totalUnits === 1 ? "" : "s"}
              </span>

              <div className="flex gap-2 sm:ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  disabled={rows.length === 0}
                >
                  <Download className="size-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={printList}
                  disabled={rows.length === 0}
                >
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  )
}
