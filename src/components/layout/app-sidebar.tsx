import { useState } from "react"
import {
  ChevronRight,
  FolderTree,
  LayoutDashboard,
  Loader2,
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

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Products", url: "/products", icon: Package, exact: true },
  { title: "Add Product", url: "/products/new", icon: PackagePlus },
  { title: "Inventory", url: "/inventory", icon: Warehouse },
  { title: "Customers", url: "/customers", icon: Users },
]

const WOO_ITEMS = [
  { title: "Categories", url: "/woocommerce/categories", icon: FolderTree },
  { title: "Brands", url: "/woocommerce/brands", icon: Tags },
  { title: "Attributes", url: "/woocommerce/attributes", icon: SlidersHorizontal },
  { title: "Coupons", url: "/woocommerce/coupons", icon: Ticket },
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
                        {isPending ? <Loader2 className="animate-spin" /> : <item.icon />}
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
                  <Store />
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
                    {WOO_ITEMS.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton asChild isActive={location.pathname === item.url}>
                          <NavLink to={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                            <item.icon />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
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
