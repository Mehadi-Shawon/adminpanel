import { useState } from "react"
import { toast } from "sonner"
import { FolderTree, Layers, Plus, Trash2 } from "lucide-react"
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
import {
  useCreateProductCategory,
  useDeleteProductCategory,
  useProductCategories,
} from "@/hooks/use-products"
import type { Category } from "@/types"
import { cn } from "@/lib/utils"

export function CategoriesPage() {
  const categories = useProductCategories()
  const createCategory = useCreateProductCategory()
  const deleteCategory = useDeleteProductCategory()
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState("0")
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)

  const all = categories.data ?? []
  const topLevel = all.filter((c) => !c.parent)
  const subCount = all.length - topLevel.length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createCategory.mutate(
      { name: trimmed, parent: Number(parentId) },
      {
        onSuccess: (category) => {
          toast.success(parentId === "0" ? "Category added" : "Sub-category added", {
            description: `${category.name} was created.`,
          })
          setName("")
          setParentId("0")
        },
        onError: (error) =>
          toast.error("Failed to add category", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      }
    )
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const target = pendingDelete
    deleteCategory.mutate(target.id, {
      onSuccess: () => {
        toast.success("Category deleted", { description: `${target.name} was removed.` })
        setPendingDelete(null)
      },
      onError: (error) =>
        toast.error("Failed to delete category", {
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
            <FolderTree className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Product Categories</h1>
            <p className="text-sm text-muted-foreground">
              Organize your catalog into categories and sub-categories.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <StatPill icon={FolderTree} value={topLevel.length} label="Categories" />
          <StatPill icon={Layers} value={subCount} label="Sub-categories" />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Add form */}
        <Card className="shadow-sm lg:col-span-2 lg:sticky lg:top-6">
          <CardHeader className="border-b border-dotted border-border">
            <CardTitle className="text-base">Add Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="category-name">Name</FieldLabel>
                  <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Skincare"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="parent">Parent category</FieldLabel>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger id="parent" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None (top-level category)</SelectItem>
                      {topLevel.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave as “None” for a top-level category, or pick a parent to add a sub-category.
                  </p>
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full shadow-md shadow-black/10 transition-shadow hover:shadow-lg dark:shadow-none"
                disabled={!name.trim() || createCategory.isPending}
              >
                <Plus className="size-4" />
                {createCategory.isPending ? "Adding..." : "Add category"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">All Categories</CardTitle>
            {all.length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {all.length}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {categories.isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : topLevel.length === 0 ? (
              <EmptyState icon={FolderTree} title="No categories yet" hint="Add your first one on the left." />
            ) : (
              <ul className="flex flex-col">
                {topLevel.map((parent, index) => {
                  const children = all.filter((c) => c.parent === parent.id)
                  return (
                    <li key={parent.id} className="flex flex-col">
                      {index > 0 && <Separator className="my-1.5" />}
                      <CategoryRow category={parent} level="parent" onDelete={() => setPendingDelete(parent)} />
                      {children.length > 0 && (
                        <ul className="ml-5 flex flex-col border-l border-dashed pl-4">
                          {children.map((child) => (
                            <li key={child.id}>
                              <CategoryRow
                                category={child}
                                level="child"
                                onDelete={() => setPendingDelete(child)}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={pendingDelete ? `Delete “${pendingDelete.name}”?` : "Delete category?"}
        description="This permanently removes the category from your store. Products in it aren't deleted — they just lose this category."
        loading={deleteCategory.isPending}
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
  icon: typeof FolderTree
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
  icon: typeof FolderTree
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

interface CategoryRowProps {
  category: Category
  level: "parent" | "child"
  onDelete: () => void
}

function CategoryRow({ category, level, onDelete }: CategoryRowProps) {
  const isParent = level === "parent"
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg",
          isParent ? "size-8 bg-foreground/5 text-foreground" : "size-7 bg-muted text-muted-foreground"
        )}
      >
        {isParent ? <FolderTree className="size-4" /> : <Layers className="size-3.5" />}
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className={cn("truncate text-sm", isParent ? "font-medium" : "text-foreground/90")}>
          {category.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">/{category.slug}</span>
      </div>
      {typeof category.count === "number" && (
        <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {category.count} {category.count === 1 ? "product" : "products"}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100",
          typeof category.count !== "number" && "ml-auto"
        )}
        onClick={onDelete}
        aria-label={`Delete ${category.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
