import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProduct,
  getProduct,
  getProductCategories,
  getProducts,
  updateProduct,
  uploadMedia,
  type ProductInput,
  type ProductQuery,
} from "@/lib/api/products"

export function useProducts(params?: ProductQuery) {
  return useQuery({ queryKey: ["products", params], queryFn: () => getProducts(params) })
}

export function useProductCategories() {
  return useQuery({ queryKey: ["products", "categories"], queryFn: getProductCategories })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => getProduct(id as string),
    enabled: !!id,
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
