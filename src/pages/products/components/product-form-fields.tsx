import { Controller, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUSES } from "@/lib/product-taxonomy"
import { useProductBrands } from "@/hooks/use-products"
import { cn } from "@/lib/utils"
import type { Category } from "@/types"
import type { ProductFormValues } from "../product-schema"
import { AttributeBuilder } from "./attribute-builder"
import { VariationMatrix } from "./variation-matrix"
import { ProductImageUploader } from "./product-image-uploader"

interface ProductFormFieldsProps {
  categories: Category[]
}

// The full set of product form fields, shared by the Add and Edit pages via a
// surrounding <FormProvider>. Both pages own their own submit + layout.
export function ProductFormFields({ categories }: ProductFormFieldsProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>()
  const brands = useProductBrands()

  const productType = watch("type")
  const selectedCategoryId = watch("categoryId")
  const images = watch("images")
  const topLevelCategories = categories.filter((c) => !c.parent)
  const subCategories = categories.filter((c) => c.parent === selectedCategoryId)

  // Status applies to both product types; extracted so it can sit beside Stock
  // for simple products and stand alone for variable ones without duplication.
  const statusField = (
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
  )

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">Product name</FieldLabel>
        <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={!!errors.sku}>
        <FieldLabel htmlFor="sku">SKU</FieldLabel>
        <Input id="sku" placeholder="Optional — leave blank for none" {...register("sku")} />
        <FieldError errors={[errors.sku]} />
      </Field>

      <Field data-invalid={!!errors.description}>
        <FieldLabel>Description</FieldLabel>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <RichTextEditor
              value={field.value ?? ""}
              onChange={field.onChange}
              rows={4}
              invalid={!!errors.description}
            />
          )}
        />
        <FieldError errors={[errors.description]} />
      </Field>

      <Field data-invalid={!!errors.shortDescription}>
        <FieldLabel>Product short description</FieldLabel>
        <Controller
          control={control}
          name="shortDescription"
          render={({ field }) => (
            <RichTextEditor
              value={field.value ?? ""}
              onChange={field.onChange}
              rows={2}
              placeholder="A brief teaser shown in listings and quick views"
              invalid={!!errors.shortDescription}
            />
          )}
        />
        <FieldError errors={[errors.shortDescription]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors.categoryId}>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) => {
                  field.onChange(Number(value))
                  // Clear any sub-category from the previous parent.
                  setValue("subCategoryId", undefined)
                }}
              >
                <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.categoryId}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {topLevelCategories.map((c) => (
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

        <Field data-invalid={!!errors.subCategoryId}>
          <FieldLabel htmlFor="subcategory">Sub-category</FieldLabel>
          <Controller
            control={control}
            name="subCategoryId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={subCategories.length === 0}
              >
                <SelectTrigger id="subcategory" className="w-full" aria-invalid={!!errors.subCategoryId}>
                  <SelectValue
                    placeholder={
                      !selectedCategoryId
                        ? "Choose a category first"
                        : subCategories.length === 0
                          ? "No sub-categories"
                          : "Select a sub-category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.subCategoryId]} />
        </Field>
      </div>

      <Field>
        <FieldLabel>Brands</FieldLabel>
        <Controller
          control={control}
          name="brands"
          render={({ field }) => {
            const selected = field.value ?? []
            const options = brands.data ?? []
            const toggle = (id: number) =>
              field.onChange(
                selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
              )
            if (brands.isPending) {
              return <p className="text-sm text-muted-foreground">Loading brands…</p>
            }
            if (options.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  No brands yet — add them under WooCommerce → Brands.
                </p>
              )
            }
            return (
              <div className="flex flex-wrap gap-1.5">
                {options.map((brand) => {
                  const on = selected.includes(brand.id)
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => toggle(brand.id)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {brand.name}
                    </button>
                  )
                })}
              </div>
            )
          }}
        />
      </Field>

      <Field>
        <FieldLabel>Product type</FieldLabel>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div className="flex items-center gap-1 self-start rounded-lg border p-1">
              {(["simple", "variable"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={field.value === t ? "secondary" : "ghost"}
                  onClick={() => field.onChange(t)}
                >
                  {t === "simple" ? "Simple product" : "Variable product"}
                </Button>
              ))}
            </div>
          )}
        />
        <p className="text-xs text-muted-foreground">
          {productType === "variable"
            ? "Sold in variations (e.g. by colour or size), each with its own price and stock."
            : "A single product with one price and stock level."}
        </p>
      </Field>

      {productType === "simple" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.regularPrice}>
              <FieldLabel htmlFor="regularPrice">Regular price (৳)</FieldLabel>
              <Input
                id="regularPrice"
                type="number"
                step="1"
                {...register("regularPrice", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                aria-invalid={!!errors.regularPrice}
              />
              <FieldError errors={[errors.regularPrice]} />
            </Field>

            <Field data-invalid={!!errors.salePrice}>
              <FieldLabel htmlFor="salePrice">Sale price (৳)</FieldLabel>
              <Input
                id="salePrice"
                type="number"
                step="1"
                {...register("salePrice", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                aria-invalid={!!errors.salePrice}
              />
              <FieldError errors={[errors.salePrice]} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.stock}>
              <FieldLabel htmlFor="stock">Stock quantity</FieldLabel>
              <Input
                id="stock"
                type="number"
                step="1"
                {...register("stock", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                aria-invalid={!!errors.stock}
              />
              <FieldError errors={[errors.stock]} />
            </Field>

            {statusField}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <AttributeBuilder control={control} />
            {typeof errors.attributes?.message === "string" && (
              <p className="text-sm text-destructive">{errors.attributes.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <VariationMatrix control={control} />
            {typeof errors.variations?.message === "string" && (
              <p className="text-sm text-destructive">{errors.variations.message}</p>
            )}
          </div>
          {statusField}
        </>
      )}

      <Field data-invalid={!!errors.images}>
        <FieldLabel htmlFor="image-upload">Product images</FieldLabel>
        <ProductImageUploader
          value={images ?? []}
          onChange={(imgs) => setValue("images", imgs, { shouldValidate: true, shouldDirty: true })}
          invalid={!!errors.images}
        />
        <FieldError errors={[errors.images]} />
      </Field>
    </FieldGroup>
  )
}
