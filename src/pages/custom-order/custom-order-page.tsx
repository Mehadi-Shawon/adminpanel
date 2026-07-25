import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Home,
  Mail,
  MapPin,
  Minus,
  NotebookPen,
  Phone,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useCreateOrder } from "@/hooks/use-orders"
import { parseOrderText } from "@/lib/parse-order-text"
import { formatCurrency } from "@/lib/format"
import { ProductPicker, type PickedItem } from "./components/product-picker"

interface LineDraft extends PickedItem {
  key: string
  quantity: number
}

const SOURCES = ["Facebook", "Instagram", "WhatsApp", "Phone", "Other"]

// Labeled skeleton inserted by "Use template" (only into an empty field), so
// the admin can drop values after each title for the most accurate extraction.
const PASTE_TEMPLATE = "Name: \nPhone: \nEmail: \nAddress: \nTown: \nCity: \nNote: "

function FieldTitle({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <FieldLabel htmlFor={htmlFor} className="gap-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      {children}
    </FieldLabel>
  )
}

export function CustomOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()

  const [rawText, setRawText] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [town, setTown] = useState("")
  const [city, setCity] = useState("")
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [source, setSource] = useState("Facebook")
  const [items, setItems] = useState<LineDraft[]>([])
  const [step, setStep] = useState<"form" | "preview">("form")

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const canPreview =
    name.trim() !== "" && phone.trim() !== "" && address.trim() !== "" && items.length > 0

  function handleExtract() {
    const parsed = parseOrderText(rawText)
    const found =
      parsed.name || parsed.phone || parsed.address || parsed.town || parsed.city || parsed.email || parsed.note
    if (!found) {
      toast.error("Couldn't find details", { description: "Fill the fields in manually below." })
      return
    }
    if (parsed.name) setName(parsed.name)
    if (parsed.phone) setPhone(parsed.phone)
    if (parsed.address) setAddress(parsed.address)
    if (parsed.town) setTown(parsed.town)
    if (parsed.city) setCity(parsed.city)
    if (parsed.email) setEmail(parsed.email)
    if (parsed.note) setNote(parsed.note)
    toast.success("Details extracted", { description: "Please verify them before continuing." })
  }

  function addItem(picked: PickedItem) {
    const key = `${picked.productId}|${picked.variationId ?? ""}`
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...picked, key, quantity: 1 }]
    })
  }

  function setQty(key: string, quantity: number) {
    if (quantity < 1) return
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)))
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  function handlePlace() {
    const trimmedName = name.trim()
    const [firstName, ...rest] = trimmedName.split(/\s+/)
    createOrder.mutate(
      {
        firstName: firstName || trimmedName,
        lastName: rest.join(" ") || undefined,
        phone: phone.trim(),
        address: address.trim(),
        town: town.trim() || undefined,
        city: city.trim() || undefined,
        email: email.trim() || undefined,
        note: note.trim() || undefined,
        source: source || undefined,
        status: "processing",
        items: items.map((i) => ({
          productId: i.productId,
          variationId: i.variationId,
          quantity: i.quantity,
        })),
      },
      {
        onSuccess: (order) => {
          toast.success("Order placed", { description: `${order.orderNumber} was created.` })
          navigate(`/orders?view=${order.id}`)
        },
        onError: (error) =>
          toast.error("Failed to place order", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      }
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Custom Order</h1>
        <p className="text-sm text-muted-foreground">
          Turn a message from Facebook, Instagram, or WhatsApp into a real order.
        </p>
      </div>

      {step === "form" ? (
        <>
          {/* 1 — Paste */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-dotted border-border">
              <CardTitle className="text-base">1 · Paste the customer's message</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={"Paste the customer's message here…"}
              />
              <p className="text-xs text-muted-foreground">
                Works best when lines are labeled —{" "}
                <span className="font-medium text-foreground">
                  Name: · Phone: · Email: · Address: · Town: · City: · Note:
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleExtract}
                  disabled={!rawText.trim()}
                  className="border-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-60"
                >
                  <Sparkles className="size-4" />
                  Extract details
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRawText(PASTE_TEMPLATE)}
                  disabled={rawText.trim() !== ""}
                >
                  Use template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2 — Customer */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-dotted border-border">
              <CardTitle className="text-base">2 · Customer details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldTitle htmlFor="co-name" icon={User}>Name</FieldTitle>
                    <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldTitle htmlFor="co-phone" icon={Phone}>Phone</FieldTitle>
                    <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                </div>
                <Field>
                  <FieldTitle htmlFor="co-address" icon={Home}>Address</FieldTitle>
                  <Textarea
                    id="co-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldTitle htmlFor="co-town" icon={MapPin}>Town</FieldTitle>
                    <Input id="co-town" value={town} onChange={(e) => setTown(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldTitle htmlFor="co-city" icon={Building2}>City</FieldTitle>
                    <Input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldTitle htmlFor="co-email" icon={Mail}>Email (optional)</FieldTitle>
                    <Input
                      id="co-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldTitle htmlFor="co-source" icon={Share2}>Order source</FieldTitle>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger id="co-source" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field>
                  <FieldTitle htmlFor="co-note" icon={NotebookPen}>Order note (optional)</FieldTitle>
                  <Textarea
                    id="co-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any special instructions for this order"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* 3 — Products */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-dotted border-border">
              <CardTitle className="text-base">3 · Products</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ProductPicker onAdd={addItem} />

              {items.length > 0 && (
                <div className="flex flex-col gap-1">
                  <Separator className="mb-1" />
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center gap-3 py-1.5">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="size-9 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
                        />
                      ) : (
                        <div className="size-9 shrink-0 rounded-md bg-muted" />
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.variationLabel ? `${item.variationLabel} · ` : ""}
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setQty(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setQty(item.key, item.quantity + 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <span className="w-20 text-right font-mono text-sm tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.key)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex items-center justify-between pr-9 text-sm font-medium">
                    <span>Subtotal (est.)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Will be created as <span className="font-medium text-foreground">Processing</span> ·
              Cash on Delivery
            </p>
            <Button onClick={() => setStep("preview")} disabled={!canPreview}>
              Preview order
            </Button>
          </div>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-dotted border-border">
            <CardTitle className="text-base">Preview order</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 rounded-lg border p-3">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-sm text-muted-foreground">{phone}</span>
              <span className="text-sm text-muted-foreground">{address}</span>
              {(town || city) && (
                <span className="text-sm text-muted-foreground">
                  {[town, city].filter(Boolean).join(", ")}
                </span>
              )}
              {email && <span className="text-sm text-muted-foreground">{email}</span>}
              {note && <span className="mt-1 text-sm text-muted-foreground">Note: {note}</span>}
              <span className="mt-1 text-xs text-muted-foreground">Source: {source}</span>
            </div>

            <div className="flex flex-col">
              {items.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <span className="min-w-0 truncate">
                    {item.name}
                    {item.variationLabel && (
                      <span className="text-muted-foreground"> — {item.variationLabel}</span>
                    )}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <Separator className="my-1.5" />
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Total (est.)</span>
                <span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Final total is calculated by WooCommerce. Created as Processing · Cash on Delivery.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handlePlace} disabled={createOrder.isPending}>
                {createOrder.isPending ? "Placing..." : "Place order"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={createOrder.isPending}
              >
                <ArrowLeft className="size-4" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
