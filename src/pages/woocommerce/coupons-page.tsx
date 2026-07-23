import { useState } from "react"
import { toast } from "sonner"
import { CalendarClock, Plus, Ticket, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useCoupons, useCreateCoupon, useDeleteCoupon } from "@/hooks/use-coupons"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Coupon, CouponDiscountType } from "@/types"

const DISCOUNT_LABELS: Record<CouponDiscountType, string> = {
  percent: "Percentage discount",
  fixed_cart: "Fixed cart discount",
  fixed_product: "Fixed product discount",
}

function formatAmount(coupon: Coupon) {
  const value = parseFloat(coupon.amount) || 0
  return coupon.discountType === "percent" ? `${value}%` : formatCurrency(value)
}

export function CouponsPage() {
  const coupons = useCoupons()
  const createCoupon = useCreateCoupon()
  const deleteCoupon = useDeleteCoupon()
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<CouponDiscountType>("percent")
  const [amount, setAmount] = useState("")
  const [dateExpires, setDateExpires] = useState("")
  const [description, setDescription] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null)

  const all = coupons.data ?? []
  const canSubmit = code.trim() !== "" && amount.trim() !== "" && Number(amount) > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    createCoupon.mutate(
      {
        code: code.trim(),
        discountType,
        amount: amount.trim(),
        description: description.trim() || undefined,
        dateExpires: dateExpires || undefined,
      },
      {
        onSuccess: (coupon) => {
          toast.success("Coupon created", { description: `${coupon.code} was added.` })
          setCode("")
          setDiscountType("percent")
          setAmount("")
          setDateExpires("")
          setDescription("")
        },
        onError: (error) =>
          toast.error("Failed to create coupon", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      }
    )
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const target = pendingDelete
    deleteCoupon.mutate(target.id, {
      onSuccess: () => {
        toast.success("Coupon deleted", { description: `${target.code} was removed.` })
        setPendingDelete(null)
      },
      onError: (error) =>
        toast.error("Failed to delete coupon", {
          description: error instanceof Error ? error.message : "Please try again.",
        }),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg shadow-foreground/20">
            <Ticket className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Coupons</h1>
            <p className="text-sm text-muted-foreground">Create and manage discount coupons.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2 shadow-sm">
          <Ticket className="size-4 text-muted-foreground" />
          <div className="flex flex-col leading-none">
            <span className="font-heading text-base font-semibold tabular-nums">{all.length}</span>
            <span className="text-[11px] text-muted-foreground">Coupons</span>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="shadow-sm lg:col-span-2 lg:sticky lg:top-6">
          <CardHeader className="border-b border-dotted border-border">
            <CardTitle className="text-base">Add Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="coupon-code">Code</FieldLabel>
                  <Input
                    id="coupon-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. EID25"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="coupon-type">Discount type</FieldLabel>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as CouponDiscountType)}>
                    <SelectTrigger id="coupon-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">{DISCOUNT_LABELS.percent}</SelectItem>
                      <SelectItem value="fixed_cart">{DISCOUNT_LABELS.fixed_cart}</SelectItem>
                      <SelectItem value="fixed_product">{DISCOUNT_LABELS.fixed_product}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="coupon-amount">
                    Amount {discountType === "percent" ? "(%)" : "(৳)"}
                  </FieldLabel>
                  <Input
                    id="coupon-amount"
                    type="number"
                    step="1"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={discountType === "percent" ? "e.g. 25" : "e.g. 500"}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="coupon-expiry">Expiry date (optional)</FieldLabel>
                  <Input
                    id="coupon-expiry"
                    type="date"
                    value={dateExpires}
                    onChange={(e) => setDateExpires(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="coupon-description">Description (optional)</FieldLabel>
                  <Textarea
                    id="coupon-description"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Shown internally to describe the coupon"
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full shadow-md shadow-black/10 transition-shadow hover:shadow-lg dark:shadow-none"
                disabled={!canSubmit || createCoupon.isPending}
              >
                <Plus className="size-4" />
                {createCoupon.isPending ? "Creating..." : "Add coupon"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">All Coupons</CardTitle>
            {all.length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {all.length}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {coupons.isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : all.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <Ticket className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No coupons yet</p>
                  <p className="text-xs text-muted-foreground">Add your first one on the left.</p>
                </div>
              </div>
            ) : (
              <ul className="flex flex-col">
                {all.map((coupon, index) => (
                  <li key={coupon.id} className="flex flex-col">
                    {index > 0 && <Separator className="my-1.5" />}
                    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                        <Ticket className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate font-mono text-sm font-medium uppercase">{coupon.code}</span>
                        <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          {DISCOUNT_LABELS[coupon.discountType]}
                          {coupon.dateExpires && (
                            <>
                              <span className="text-border">•</span>
                              <CalendarClock className="size-3" />
                              {formatDate(coupon.dateExpires)}
                            </>
                          )}
                        </span>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-medium tabular-nums">
                        {formatAmount(coupon)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        onClick={() => setPendingDelete(coupon)}
                        aria-label={`Delete ${coupon.code}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={pendingDelete ? `Delete “${pendingDelete.code}”?` : "Delete coupon?"}
        description="This permanently removes the coupon from your store. Orders that already used it are unaffected."
        loading={deleteCoupon.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
