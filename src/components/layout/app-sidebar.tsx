import { useState } from "react"
import {
  ChevronRight,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Loader2,
  MessagesSquare,
  Package,
  PackagePlus,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  Ticket,
  Users,
  Warehouse,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { NavUser } from "./nav-user"

// Each item carries an accent `color` used to tint its icon only while active,
// so the current tab pops with a splash of color against the neutral sidebar.
const WOO_COLOR = "#0f4c3a"

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, color: "#2a78d6" },
  { title: "Orders", url: "/orders", icon: ShoppingCart, color: "#eb6834" },
  { title: "Custom Order", url: "/custom-order", icon: MessagesSquare, color: "#0ea5e9" },
  { title: "Product Demand", url: "/product-demand", icon: ClipboardList, color: "#1baf7a" },
  { title: "Products", url: "/products", icon: Package, exact: true, color: "#7c3aed" },
  { title: "Add Product", url: "/products/new", icon: PackagePlus, color: "#16a34a" },
  { title: "Inventory", url: "/inventory", icon: Warehouse, color: "#ca8a04" },
  { title: "Customers", url: "/customers", icon: Users, color: "#db2777" },
]

const WOO_ITEMS = [
  { title: "Categories", url: "/woocommerce/categories", icon: FolderTree, color: "#2a78d6" },
  { title: "Brands", url: "/woocommerce/brands", icon: Tags, color: "#db2777" },
  { title: "Attributes", url: "/woocommerce/attributes", icon: SlidersHorizontal, color: "#4f46e5" },
  { title: "Coupons", url: "/woocommerce/coupons", icon: Ticket, color: "#e34948" },
]

// Navigation here is instant (no route loaders — each page fetches its
// own data independently), so there's no real "waiting for the route"
// moment to reflect. This shows a brief spinner on the clicked item for
// clear visual feedback instead of tying it to an invisible transition.
const PENDING_DURATION_MS = 450

export function AppSidebar() {
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  const wooActive = location.pathname.startsWith("/woocommerce")
  const [wooOpen, setWooOpen] = useState(wooActive)

  function handleNavClick(url: string) {
    setPendingUrl(url)
    window.setTimeout(() => {
      setPendingUrl((current) => (current === url ? null : current))
    }, PENDING_DURATION_MS)
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <NavLink
          to="/dashboard"
          className="flex items-center px-2 py-1 group-data-[collapsible=icon]:hidden"
        >
          <img src="/hobinh-logo.png" alt="Hobinh" className="h-8 w-auto dark:invert" />
        </NavLink>
        <SidebarSeparator className="mx-0" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url)
                const isPending = pendingUrl === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} onClick={() => handleNavClick(item.url)}>
                        {isPending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <item.icon style={isActive ? { color: item.color } : undefined} />
                        )}
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="WooCommerce"
                  isActive={wooActive}
                  onClick={() => setWooOpen((open) => !open)}
                >
                  <Store style={wooActive ? { color: WOO_COLOR } : undefined} />
                  <span>WooCommerce</span>
                  <ChevronRight
                    className={cn(
                      "ml-auto transition-transform duration-200",
                      wooOpen && "rotate-90"
                    )}
                  />
                </SidebarMenuButton>
                {wooOpen && (
                  <SidebarMenuSub>
                    {WOO_ITEMS.map((item) => {
                      const subActive = location.pathname === item.url
                      return (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton asChild isActive={subActive}>
                            <NavLink to={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                              <item.icon style={subActive ? { color: item.color } : undefined} />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
