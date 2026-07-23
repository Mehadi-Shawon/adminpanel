import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProduct,
  createProductBrand,
  createProductCategory,
  deleteProductBrand,
  deleteProductCategory,
  getProduct,
  getProductBrands,
  getProductCategories,
  getProducts,
  getProductsPage,
  getProductVariations,
  updateProduct,
  uploadMedia,
  type CategoryInput,
  type ProductInput,
  type ProductPageQuery,
  type ProductQuery,
} from "@/lib/api/products"

export function useProducts(params?: ProductQuery) {
  return useQuery({ queryKey: ["products", params], queryFn: () => getProducts(params) })
}

// Server-side paginated products for the Products/Inventory tables.
// keepPreviousData keeps the current page visible while the next one loads.
export function useProductsPage(params: ProductPageQuery) {
  return useQuery({
    queryKey: ["products", "page", params],
    queryFn: () => getProductsPage(params),
    placeholderData: keepPreviousData,
  })
}

export function useProductCategories() {
  return useQuery({ queryKey: ["products", "categories"], queryFn: getProductCategories })
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => createProductCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", "categories"] }),
  })
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProductCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", "categories"] }),
  })
}

export function useProductBrands() {
  return useQuery({ queryKey: ["products", "brands"], queryFn: getProductBrands })
}

export function useCreateProductBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string }) => createProductBrand(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", "brands"] }),
  })
}

export function useDeleteProductBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProductBrand(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", "brands"] }),
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => getProduct(id as string),
    enabled: !!id,
  })
}

export function useProductVariations(productId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["products", "variations", productId],
    queryFn: () => getProductVariations(productId as string),
    enabled: !!productId && enabled,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => updateProduct(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  })
}

export function useUploadMedia() {
  return useMutation({ mutationFn: (file: File) => uploadMedia(file) })
}
