import { useState } from "react"
import { Controller, useFieldArray, type Control } from "react-hook-form"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import type { ProductFormValues } from "../product-schema"

interface AttributeBuilderProps {
  control: Control<ProductFormValues>
}

// Builds the custom, product-level attributes that a WooCommerce variable
// product's variations combine (e.g. Color: Red/Blue, Size: S/M/L). Each row
// is one attribute with a name and a set of option chips.
export function AttributeBuilder({ control }: AttributeBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "attributes" })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <FieldLabel>Attributes</FieldLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: "", options: [] })}
        >
          <Plus className="size-4" />
          Add attribute
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add attributes like Color or Size — the values here become the options buyers choose from.
        </p>
      ) : (
        fields.map((field, index) => (
          <AttributeRow
            key={field.id}
            control={control}
            index={index}
            onRemove={() => remove(index)}
          />
        ))
      )}
    </div>
  )
}

interface AttributeRowProps {
  control: Control<ProductFormValues>
  index: number
  onRemove: () => void
}

function AttributeRow({ control, index, onRemove }: AttributeRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name={`attributes.${index}.name`}
          render={({ field, fieldState }) => (
            <Input
              placeholder="Attribute name (e.g. Color)"
              aria-invalid={!!fieldState.error}
              {...field}
            />
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={onRemove}
          aria-label="Remove attribute"
        >
          <X className="size-4" />
        </Button>
      </div>
      <Controller
        control={control}
        name={`attributes.${index}.options`}
        render={({ field, fieldState }) => (
          <OptionsInput
            value={field.value ?? []}
            onChange={field.onChange}
            invalid={!!fieldState.error}
            error={fieldState.error?.message}
          />
        )}
      />
    </div>
  )
}

interface OptionsInputProps {
  value: string[]
  onChange: (value: string[]) => void
  invalid: boolean
  error?: string
}

function OptionsInput({ value, onChange, invalid, error }: OptionsInputProps) {
  const [draft, setDraft] = useState("")

  function commit() {
    const next = draft.trim()
    if (next && !value.includes(next)) {
      onChange([...value, next])
    }
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-1.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((option) => (
            <span
              key={option}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm"
            >
              {option}
              <button
                type="button"
                onClick={() => onChange(value.filter((o) => o !== option))}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Remove ${option}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            commit()
          } else if (e.key === "Backspace" && !draft && value.length > 0) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={commit}
        placeholder="Type an option and press Enter"
        aria-invalid={invalid}
      />
      {error && <p className={cn("text-sm text-destructive")}>{error}</p>}
    </div>
  )
}
