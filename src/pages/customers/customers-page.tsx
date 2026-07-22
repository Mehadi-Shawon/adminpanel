import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { useCustomers } from "@/hooks/use-customers"
import type { CustomerStatus } from "@/types"
import { customersColumns } from "./components/customers-columns"

export function CustomersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CustomerStatus | "all">("all")

  const customers = useCustomers({
    search: search || undefined,
    status: status === "all" ? undefined : status,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">Everyone who has ever placed an order.</p>
      </div>

      {customers.isPending ? (
        <DataTableSkeleton columns={5} />
      ) : (
        <DataTable
          columns={customersColumns}
          data={customers.data ?? []}
          initialSorting={[{ id: "totalSpent", desc: true }]}
          onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
          emptyMessage="No customers match your filters."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={status} onValueChange={(value) => setStatus(value as CustomerStatus | "all")}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {customers.data && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground sm:ml-auto">
                  <Users className="size-4" />
                  {customers.data.length} customer{customers.data.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          }
        />
      )}
    </div>
  )
}
