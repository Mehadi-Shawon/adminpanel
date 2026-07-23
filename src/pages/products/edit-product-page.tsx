import { useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useProduct,
  useProductCategories,
  useProductVariations,
  useUpdateProduct,
} from "@/hooks/use-products"
import type { Category } from "@/types"
import { productFormSchema, type ProductFormValues } from "./product-schema"
import { comboKeyFromVariation, toVariationInputs } from "./variations"
import { ProductFormFields } from "./components/product-form-fields"

// A product's own categories array only carries id/name/slug, so we look each
// one up in the full (parent-aware) list to decide which is the top-level
// category and which the sub-category for the cascading selects.
function resolveCategorySelection(productCategories: Category[], allCategories: Category[]) {
  const byId = new Map(allCategories.map((c) => [c.id, c]))
  for (const pc of productCategories) {
    const full = byId.get(pc.id)
    if (full?.parent) {
      return { categoryId: full.parent, subCategoryId: full.id }
    }
  }
  return { categoryId: productCategories[0]?.id, subCategoryId: undefined }
}

export function EditProductPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const categories = useProductCategories()
  const allCategories = categories.data ?? []
  const productQuery = useProduct(productId)
  const product = productQuery.data
  const isVariable = product?.type === "variable"
  const variationsQuery = useProductVariations(productId, isVariable)
  const updateProduct = useUpdateProduct()

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
  })
  const { reset, setValue } = methods

  // Populate the form once the product and category list have loaded.
  useEffect(() => {
    if (!product || !categories.data) return
    const { categoryId, subCategoryId } = resolveCategorySelection(product.categories, categories.data)
    reset({
      name: product.name,
      sku: product.sku,
      description: product.description,
      shortDescription: product.shortDescription,
      categoryId,
      subCategoryId,
      brands: product.brands.map((b) => b.id),
      type: product.type,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      attributes: product.attributes.map((a) => ({ name: a.name, options: a.options })),
      variations: {},
      status: product.status,
      images: product.images,
    })
  }, [product, categories.data, reset])

  // Slot a variable product's existing variations into the form once loaded.
  useEffect(() => {
    if (!product || !isVariable || !variationsQuery.data) return
    const map: ProductFormValues["variations"] = {}
    for (const v of variationsQuery.data) {
      map[comboKeyFromVariation(v.attributes, product.attributes)] = {
        regularPrice: v.regularPrice,
        salePrice: v.salePrice,
        stock: v.stock,
        sku: v.sku,
        image: v.image,
      }
    }
    setValue("variations", map)
  }, [product, isVariable, variationsQuery.data, setValue])

  function onSubmit(values: ProductFormValues) {
    if (!product) return
    const category = allCategories.find((c) => c.id === values.categoryId)
    const subCategory = values.subCategoryId
      ? allCategories.find((c) => c.id === values.subCategoryId)
      : undefined
    const selectedCategories = [category, subCategory].filter((c): c is Category => Boolean(c))
    updateProduct.mutate(
      {
        id: product.id,
        input: {
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
      },
      {
        onSuccess: () => {
          toast.success("Product updated", { description: `${values.name} has been saved.` })
          navigate("/products")
        },
        onError: (error) =>
          toast.error("Failed to update product", {
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
        <h1 className="mt-2 font-heading text-2xl font-semibold">Edit Product</h1>
        <p className="text-sm text-muted-foreground">
          {product ? `Update the details for ${product.name}.` : "Update your product's details."}
        </p>
      </div>

      <Card>
        <CardContent>
          {productQuery.isPending ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
          ) : !product ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              This product could not be found.
            </p>
          ) : (
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <ProductFormFields categories={allCategories} />

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={methods.formState.isSubmitting || updateProduct.isPending}>
                    {updateProduct.isPending ? "Saving..." : "Save changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </FormProvider>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
