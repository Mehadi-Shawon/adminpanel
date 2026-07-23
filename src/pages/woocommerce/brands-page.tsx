import { useState } from "react"
import { toast } from "sonner"
import { Plus, Tag, Tags, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  useCreateProductBrand,
  useDeleteProductBrand,
  useProductBrands,
} from "@/hooks/use-products"
import type { Brand } from "@/types"

export function BrandsPage() {
  const brands = useProductBrands()
  const createBrand = useCreateProductBrand()
  const deleteBrand = useDeleteProductBrand()
  const [name, setName] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Brand | null>(null)

  const all = brands.data ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createBrand.mutate(
      { name: trimmed },
      {
        onSuccess: (brand) => {
          toast.success("Brand added", { description: `${brand.name} was created.` })
          setName("")
        },
        onError: (error) =>
          toast.error("Failed to add brand", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      }
    )
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const target = pendingDelete
    deleteBrand.mutate(target.id, {
      onSuccess: () => {
        toast.success("Brand deleted", { description: `${target.name} was removed.` })
        setPendingDelete(null)
      },
      onError: (error) =>
        toast.error("Failed to delete brand", {
          description: error instanceof Error ? error.message : "Please try again.",
        }),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg shadow-foreground/20">
            <Tags className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Brands</h1>
            <p className="text-sm text-muted-foreground">Manage the brands you assign to products.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <StatPill icon={Tags} value={all.length} label="Brands" />
        </div>
      </div>

      {brands.isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            Couldn&apos;t load brands. This store may not have the WooCommerce Brands feature enabled
            (WooCommerce 9.6+ or the Brands plugin).
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Add form */}
        <Card className="shadow-sm lg:col-span-2 lg:sticky lg:top-6">
          <CardHeader className="border-b border-dotted border-border">
            <CardTitle className="text-base">Add Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="brand-name">Name</FieldLabel>
                  <Input
                    id="brand-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cetaphil"
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full shadow-md shadow-black/10 transition-shadow hover:shadow-lg dark:shadow-none"
                disabled={!name.trim() || createBrand.isPending}
              >
                <Plus className="size-4" />
                {createBrand.isPending ? "Adding..." : "Add brand"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">All Brands</CardTitle>
            {all.length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {all.length}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {brands.isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : all.length === 0 ? (
              <EmptyState icon={Tags} title="No brands yet" hint="Add your first one on the left." />
            ) : (
              <ul className="flex flex-col">
                {all.map((brand, index) => (
                  <li key={brand.id} className="flex flex-col">
                    {index > 0 && <Separator className="my-1.5" />}
                    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                        <Tag className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-sm font-medium">{brand.name}</span>
                        <span className="truncate text-xs text-muted-foreground">/{brand.slug}</span>
                      </div>
                      {typeof brand.count === "number" && (
                        <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                          {brand.count} {brand.count === 1 ? "product" : "products"}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className={
                          "shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100" +
                          (typeof brand.count !== "number" ? " ml-auto" : "")
                        }
                        onClick={() => setPendingDelete(brand)}
                        aria-label={`Delete ${brand.name}`}
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
        title={pendingDelete ? `Delete “${pendingDelete.name}”?` : "Delete brand?"}
        description="This permanently removes the brand from your store. Products keep their other data — they just lose this brand."
        loading={deleteBrand.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Tags
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2 shadow-sm">
      <Icon className="size-4 text-muted-foreground" />
      <div className="flex flex-col leading-none">
        <span className="font-heading text-base font-semibold tabular-nums">{value}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Tags
  title: string
  hint: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
