import { useState } from "react"
import { toast } from "sonner"
import { ImageIcon, Star, X } from "lucide-react"
import { useUploadMedia } from "@/hooks/use-products"
import { cn } from "@/lib/utils"
import type { ProductImage } from "@/types"

interface ProductImageUploaderProps {
  value: ProductImage[]
  onChange: (images: ProductImage[]) => void
  invalid?: boolean
}

// Manages a product's image gallery. WooCommerce treats the first image in the
// array as the featured image and the rest as the gallery, so ordering matters
// here — "Make featured" simply moves an image to the front.
export function ProductImageUploader({ value, onChange, invalid }: ProductImageUploaderProps) {
  const uploadMedia = useUploadMedia()
  const [isDragging, setIsDragging] = useState(false)

  async function handleFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"))
    if (images.length < files.length) {
      toast.error("Only image files can be uploaded.")
    }
    if (images.length === 0) return

    try {
      const uploaded = await Promise.all(images.map((file) => uploadMedia.mutateAsync(file)))
      // Append, skipping any media already in the gallery (same id).
      const merged = [...value]
      for (const img of uploaded) {
        if (!merged.some((m) => m.id === img.id)) merged.push(img)
      }
      onChange(merged)
    } catch (error) {
      toast.error("Failed to upload image", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  function removeImage(id: number) {
    onChange(value.filter((img) => img.id !== id))
  }

  function makeFeatured(id: number) {
    const target = value.find((img) => img.id === id)
    if (!target) return
    onChange([target, ...value.filter((img) => img.id !== id)])
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((img, index) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-md ring-1 ring-foreground/10"
            >
              <img src={img.src} alt="" className="size-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                  Featured
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeFeatured(img.id)}
                    className="rounded bg-background/90 p-1.5 text-foreground transition-colors hover:bg-background"
                    aria-label="Make featured"
                    title="Make featured"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="rounded bg-background/90 p-1.5 text-destructive transition-colors hover:bg-background"
                  aria-label="Remove image"
                  title="Remove"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input",
          invalid && "border-destructive"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          void handleFiles(Array.from(e.dataTransfer.files ?? []))
        }}
      >
        <ImageIcon className="size-8 text-muted-foreground" />
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <label htmlFor="image-upload" className="cursor-pointer font-medium text-primary hover:underline">
            {uploadMedia.isPending ? "Uploading..." : "Click to upload"}
          </label>
          {!uploadMedia.isPending && <span>or drag and drop — you can add several at once</span>}
        </div>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploadMedia.isPending}
          onChange={(e) => {
            void handleFiles(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
