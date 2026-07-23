import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { SortingState } from "@tanstack/react-table"
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
import { useProductCategories, useProductsPage } from "@/hooks/use-products"
import type { Product, ProductStatus } from "@/types"
import { cn } from "@/lib/utils"
import { getProductsColumns } from "./components/products-columns"

const PAGE_SIZE = 20

// Maps a sortable column id to WooCommerce's `orderby` value. Only columns
// WooCommerce can actually sort are listed (others aren't made sortable).
const SORT_MAP: Record<string, "title" | "price"> = {
  name: "title",
  regularPrice: "price",
}

export function ProductsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string>("all")
  const [status, setStatus] = useState<ProductStatus | "all">("all")
  const [pageIndex, setPageIndex] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])

  // Any filter or sort change goes back to the first page.
  useEffect(() => {
    setPageIndex(0)
  }, [search, categoryId, status, sorting])

  const activeSort = sorting[0]
  const categories = useProductCategories()
  const products = useProductsPage({
    search: search || undefined,
    categoryId: categoryId === "all" ? undefined : Number(categoryId),
    status: status === "all" ? undefined : status,
    page: pageIndex + 1,
    perPage: PAGE_SIZE,
    orderby: activeSort ? SORT_MAP[activeSort.id] : undefined,
    order: activeSort ? (activeSort.desc ? "desc" : "asc") : undefined,
  })

  const total = products.data?.total ?? 0
  const totalPages = products.data?.totalPages ?? 0

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
        <div className={cn("transition-opacity", products.isFetching && "opacity-60")}>
          <DataTable
            columns={getProductsColumns(handleEdit)}
            data={products.data?.products ?? []}
            emptyMessage="No products match your filters."
            server={{
              pageIndex,
              pageSize: PAGE_SIZE,
              pageCount: totalPages,
              onPageChange: setPageIndex,
              sorting,
              onSortingChange: setSorting,
            }}
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
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground sm:ml-auto">
                  <Package className="size-4" />
                  {total} product{total === 1 ? "" : "s"}
                </span>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
