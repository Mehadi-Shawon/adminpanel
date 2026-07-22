import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Package, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { useProductCategories, useProducts } from "@/hooks/use-products"
import type { Product, ProductStatus } from "@/types"
import { getProductsColumns } from "./components/products-columns"

export function ProductsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string>("all")
  const [status, setStatus] = useState<ProductStatus | "all">("all")

  const categories = useProductCategories()
  const products = useProducts({
    search: search || undefined,
    categoryId: categoryId === "all" ? undefined : Number(categoryId),
    status: status === "all" ? undefined : status,
  })

  function handleEdit(product: Product) {
    navigate(`/products/${product.id}/edit`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Your store's catalog.</p>
        </div>
        <Button asChild className="self-start">
          <Link to="/products/new">
            <Plus className="size-4" />
            Add product
          </Link>
        </Button>
      </div>

      {products.isPending ? (
        <DataTableSkeleton columns={6} />
      ) : (
        <DataTable
          columns={getProductsColumns(handleEdit)}
          data={products.data ?? []}
          emptyMessage="No products match your filters."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => setStatus(value as ProductStatus | "all")}>
                <SelectTrigger className="sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="publish">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              {products.data && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground sm:ml-auto">
                  <Package className="size-4" />
                  {products.data.length} product{products.data.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          }
        />
      )}
    </div>
  )
}
