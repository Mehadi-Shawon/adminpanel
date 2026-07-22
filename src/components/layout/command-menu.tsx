import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useOrders } from "@/hooks/use-orders"
import { useProducts } from "@/hooks/use-products"
import { useCustomers } from "@/hooks/use-customers"

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate()
  const orders = useOrders().data ?? []
  const products = useProducts().data ?? []
  const customers = useCustomers().data ?? []

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  function go(path: string) {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
      <CommandInput placeholder="Search orders, products, customers..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/orders")}>
            <ShoppingCart /> Orders
          </CommandItem>
          <CommandItem onSelect={() => go("/products")}>
            <Package /> Products
          </CommandItem>
          <CommandItem onSelect={() => go("/customers")}>
            <Users /> Customers
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Orders">
          {orders.map((order) => (
            <CommandItem
              key={order.id}
              value={`${order.orderNumber} ${order.customerName}`}
              onSelect={() => go(`/orders/${order.id}`)}
            >
              {order.orderNumber} — {order.customerName}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Products">
          {products.map((product) => (
            <CommandItem
              key={product.id}
              value={`${product.name} ${product.sku}`}
              onSelect={() => go(`/products?highlight=${product.id}`)}
            >
              {product.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Customers">
          {customers.map((customer) => (
            <CommandItem
              key={customer.id}
              value={`${customer.name} ${customer.email}`}
              onSelect={() => go(`/customers/${customer.id}`)}
            >
              {customer.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  )
}
