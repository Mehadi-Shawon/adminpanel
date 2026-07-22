import { useEffect, useRef } from "react"
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  invalid?: boolean
  rows?: number
}

// A lightweight WYSIWYG editor backed by contentEditable. It reads/writes the
// element's innerHTML directly, so the product's original WooCommerce HTML is
// preserved rather than normalised through an editor schema — only the exact
// formatting the user changes is touched.
export function RichTextEditor({ value, onChange, placeholder, invalid, rows = 4 }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Push external value changes (loading/resetting a product) into the DOM, but
  // never while the user is typing in it — that would jump the caret.
  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerHTML !== (value || "")) {
      el.innerHTML = value || ""
    }
  }, [value])

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg)
    emit()
  }

  const tools = [
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", run: () => exec("insertOrderedList") },
    {
      icon: LinkIcon,
      label: "Link",
      run: () => {
        const url = window.prompt("Link URL")
        if (url) exec("createLink", url)
      },
    },
  ]

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-transparent focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
        invalid && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-input bg-muted/40 p-1">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            // Keep the editor's selection when clicking a toolbar button.
            onMouseDown={(e) => e.preventDefault()}
            onClick={tool.run}
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label={tool.label}
            title={tool.label}
          >
            <tool.icon className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={emit}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.5}rem` }}
        className={cn(
          "px-3 py-2 text-sm focus:outline-none",
          "[&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_a]:text-primary [&_a]:underline [&_h1]:text-base [&_h1]:font-semibold [&_h2]:font-semibold",
          "[&:empty]:before:text-muted-foreground [&:empty]:before:content-[attr(data-placeholder)]"
        )}
      />
    </div>
  )
}
