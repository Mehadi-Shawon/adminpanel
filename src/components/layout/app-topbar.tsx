import { useLocation } from "react-router-dom"
import { Search } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

const SECTION_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  products: "Products",
  inventory: "Inventory",
  customers: "Customers",
}

const DETAIL_TITLES: Record<string, string> = {
  "products/new": "Add product",
}

interface AppTopbarProps {
  onOpenSearch: () => void
}

export function AppTopbar({ onOpenSearch }: AppTopbarProps) {
  const location = useLocation()
  const segments = location.pathname.split("/").filter(Boolean)
  const section = segments[0]
  const detailSegment = segments.length > 1 ? segments[1] : undefined
  const detailLabel = detailSegment
    ? (DETAIL_TITLES[`${section}/${detailSegment}`] ?? detailSegment)
    : undefined

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/70 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{SECTION_TITLES[section] ?? "Dashboard"}</BreadcrumbPage>
          </BreadcrumbItem>
          {detailLabel && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">{detailLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={onOpenSearch}
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden rounded bg-muted px-1.5 py-0.5 text-xs sm:inline-block">⌘K</kbd>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
