import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useCreateProduct, useProductCategories, useUploadMedia } from "@/hooks/use-products"
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUSES } from "@/lib/product-taxonomy"
import { cn } from "@/lib/utils"
import { productFormSchema, type ProductFormValues } from "./product-schema"

export function AddProductPage() {
  const navigate = useNavigate()
  const categories = useProductCategories()
  const createProduct = useCreateProduct()
  const uploadMedia = useUploadMedia()
  const [isDragging, setIsDragging] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      status: "draft",
      images: [],
    },
  })

  const images = watch("images")

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.")
      return
    }
    uploadMedia.mutate(file, {
      onSuccess: (image) => setValue("images", [image], { shouldValidate: true, shouldDirty: true }),
      onError: () => toast.error("Failed to upload image. Please try again."),
    })
  }

  function onSubmit(values: ProductFormValues) {
    const category = (categories.data ?? []).find((c) => c.id === values.categoryId)
    createProduct.mutate(
      {
        name: values.name,
        sku: values.sku,
        description: values.description,
        shortDescription: values.shortDescription,
        categories: category ? [category] : [],
        price: values.price,
        compareAtPrice: values.compareAtPrice,
        stock: values.stock,
        status: values.status,
        images: values.images,
      },
      {
        onSuccess: (product) => {
          toast.success("Product created", { description: `${product.name} was added to the store.` })
          navigate("/products")
        },
        onError: () => toast.error("Failed to create product. Please try again."),
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
        <h1 className="mt-2 font-heading text-2xl font-semibold">Add product</h1>
        <p className="text-sm text-muted-foreground">Create a new product in your store.</p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.sku}>
                <FieldLabel htmlFor="sku">SKU</FieldLabel>
                <Input id="sku" placeholder="Auto-generated if left blank" {...register("sku")} />
                <FieldError errors={[errors.sku]} />
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  rows={3}
                  {...register("description")}
                  aria-invalid={!!errors.description}
                />
                <FieldError errors={[errors.description]} />
              </Field>

              <Field data-invalid={!!errors.shortDescription}>
                <FieldLabel htmlFor="shortDescription">Short description</FieldLabel>
                <Textarea
                  id="shortDescription"
                  rows={2}
                  placeholder="A brief teaser shown in listings and quick views"
                  {...register("shortDescription")}
                  aria-invalid={!!errors.shortDescription}
                />
                <FieldError errors={[errors.shortDescription]} />
              </Field>

              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.categoryId}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.categoryId]} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.price}>
                  <FieldLabel htmlFor="price">Price (BDT)</FieldLabel>
                  <Input
                    id="price"
                    type="number"
                    step="1"
                    {...register("price", { valueAsNumber: true })}
                    aria-invalid={!!errors.price}
                  />
                  <FieldError errors={[errors.price]} />
                </Field>

                <Field data-invalid={!!errors.compareAtPrice}>
                  <FieldLabel htmlFor="compareAtPrice">Compare-at price</FieldLabel>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="1"
                    {...register("compareAtPrice", {
                      setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    })}
                    aria-invalid={!!errors.compareAtPrice}
                  />
                  <FieldError errors={[errors.compareAtPrice]} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.stock}>
                  <FieldLabel htmlFor="stock">Stock</FieldLabel>
                  <Input
                    id="stock"
                    type="number"
                    step="1"
                    {...register("stock", { valueAsNumber: true })}
                    aria-invalid={!!errors.stock}
                  />
                  <FieldError errors={[errors.stock]} />
                </Field>

                <Field data-invalid={!!errors.status}>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="status" className="w-full" aria-invalid={!!errors.status}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {PRODUCT_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.status]} />
                </Field>
              </div>

              <Field data-invalid={!!errors.images}>
                <FieldLabel htmlFor="image-upload">Product image</FieldLabel>
                <div
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-input"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFile(file)
                  }}
                >
                  {images?.[0]?.src ? (
                    <img
                      src={images[0].src}
                      alt="Preview"
                      className="size-20 rounded-md object-cover ring-1 ring-foreground/10"
                    />
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer font-medium text-primary hover:underline"
                    >
                      {uploadMedia.isPending ? "Uploading..." : "Click to upload"}
                    </label>
                    {!uploadMedia.isPending && <span>or drag and drop</span>}
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadMedia.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(file)
                      e.target.value = ""
                    }}
                  />
                </div>
                <FieldError errors={[errors.images]} />
              </Field>
            </FieldGroup>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isSubmitting || createProduct.isPending}>
                {createProduct.isPending ? "Creating..." : "Create product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
