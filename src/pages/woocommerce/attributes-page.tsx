import { useState } from "react"
import { toast } from "sonner"
import { Plus, SlidersHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAttributes, useCreateAttribute, useDeleteAttribute } from "@/hooks/use-attributes"
import type { AttributeType, GlobalAttribute } from "@/types"

const TYPE_LABELS: Record<AttributeType, string> = {
  select: "Select (predefined values)",
  text: "Text (free-form)",
}

export function AttributesPage() {
  const attributes = useAttributes()
  const createAttribute = useCreateAttribute()
  const deleteAttribute = useDeleteAttribute()
  const [name, setName] = useState("")
  const [type, setType] = useState<AttributeType>("select")
  const [pendingDelete, setPendingDelete] = useState<GlobalAttribute | null>(null)

  const all = attributes.data ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createAttribute.mutate(
      { name: trimmed, type },
      {
        onSuccess: (attribute) => {
          toast.success("Attribute added", { description: `${attribute.name} was created.` })
          setName("")
          setType("select")
        },
        onError: (error) =>
          toast.error("Failed to add attribute", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      }
    )
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const target = pendingDelete
    deleteAttribute.mutate(target.id, {
      onSuccess: () => {
        toast.success("Attribute deleted", { description: `${target.name} was removed.` })
        setPendingDelete(null)
      },
      onError: (error) =>
        toast.error("Failed to delete attribute", {
          description: error instanceof Error ? error.message : "Please try again.",
        }),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg shadow-foreground/20">
            <SlidersHorizontal className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Attributes</h1>
            <p className="text-sm text-muted-foreground">
              Store-wide product attributes like Color or Size.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2 shadow-sm">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <div className="flex flex-col leading-none">
            <span className="font-heading text-base font-semibold tabular-nums">{all.length}</span>
            <span className="text-[11px] text-muted-foreground">Attributes</span>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="shadow-sm lg:col-span-2 lg:sticky lg:top-6">
          <CardHeader className="border-b border-dotted border-border">
            <CardTitle className="text-base">Add Attribute</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="attr-name">Name</FieldLabel>
                  <Input
                    id="attr-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Color"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="attr-type">Type</FieldLabel>
                  <Select value={type} onValueChange={(v) => setType(v as AttributeType)}>
                    <SelectTrigger id="attr-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">{TYPE_LABELS.select}</SelectItem>
                      <SelectItem value="text">{TYPE_LABELS.text}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    “Select” attributes get predefined terms you assign to products; “Text” is free-form.
                  </p>
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full shadow-md shadow-black/10 transition-shadow hover:shadow-lg dark:shadow-none"
                disabled={!name.trim() || createAttribute.isPending}
              >
                <Plus className="size-4" />
                {createAttribute.isPending ? "Adding..." : "Add attribute"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">All Attributes</CardTitle>
            {all.length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {all.length}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {attributes.isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : all.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <SlidersHorizontal className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No attributes yet</p>
                  <p className="text-xs text-muted-foreground">Add your first one on the left.</p>
                </div>
              </div>
            ) : (
              <ul className="flex flex-col">
                {all.map((attribute, index) => (
                  <li key={attribute.id} className="flex flex-col">
                    {index > 0 && <Separator className="my-1.5" />}
                    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                        <SlidersHorizontal className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-sm font-medium">{attribute.name}</span>
                        <span className="truncate text-xs text-muted-foreground">/{attribute.slug}</span>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                        {attribute.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        onClick={() => setPendingDelete(attribute)}
                        aria-label={`Delete ${attribute.name}`}
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
        title={pendingDelete ? `Delete “${pendingDelete.name}”?` : "Delete attribute?"}
        description="This permanently removes the attribute (and its terms) from your store. Products keep their other data."
        loading={deleteAttribute.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
