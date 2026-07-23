import { Link, useNavigate } from "react-router-dom"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCreateProduct, useProductCategories } from "@/hooks/use-products"
import type { Category } from "@/types"
import { productFormSchema, type ProductFormValues } from "./product-schema"
import { toVariationInputs } from "./variations"
import { ProductFormFields } from "./components/product-form-fields"

export function AddProductPage() {
  const navigate = useNavigate()
  const categories = useProductCategories()
  const createProduct = useCreateProduct()
  const allCategories = categories.data ?? []

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      status: "draft",
      type: "simple",
      attributes: [],
      variations: {},
      brands: [],
      images: [],
    },
  })

  function onSubmit(values: ProductFormValues) {
    const category = allCategories.find((c) => c.id === values.categoryId)
    const subCategory = values.subCategoryId
      ? allCategories.find((c) => c.id === values.subCategoryId)
      : undefined
    // Assign both the parent and the chosen sub-category so the product shows
    // under both in the storefront's category hierarchy.
    const selectedCategories = [category, subCategory].filter((c): c is Category => Boolean(c))
    createProduct.mutate(
      {
        name: values.name,
        sku: values.sku,
        description: values.description,
        shortDescription: values.shortDescription,
        categories: selectedCategories,
        brands: values.brands,
        type: values.type,
        regularPrice: values.regularPrice,
        salePrice: values.salePrice,
        stock: values.stock,
        attributes: values.attributes,
        variations: values.type === "variable" ? toVariationInputs(values) : undefined,
        status: values.status,
        images: values.images,
      },
      {
        onSuccess: (product) => {
          toast.success("Product created", { description: `${product.name} was added to the store.` })
          navigate("/products")
        },
        onError: (error) =>
          toast.error("Failed to create product", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      }
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link to="/products">
            <ArrowLeft className="size-4" />
            Back to products
          </Link>
        </Button>
        <h1 className="mt-2 font-heading text-2xl font-semibold">Add Product</h1>
        <p className="text-sm text-muted-foreground">Create a new product in your store.</p>
      </div>

      <Card>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <ProductFormFields categories={allCategories} />

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={methods.formState.isSubmitting || createProduct.isPending}>
                  {createProduct.isPending ? "Creating..." : "Create product"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                  Cancel
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}
