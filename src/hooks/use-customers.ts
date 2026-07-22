import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getCustomer,
  getCustomerOrders,
  getCustomers,
  toggleCustomerStatus,
  type CustomerQuery,
} from "@/lib/api/customers"

export function useCustomers(params?: CustomerQuery) {
  return useQuery({ queryKey: ["customers", params], queryFn: () => getCustomers(params) })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => getCustomer(id as string),
    enabled: !!id,
  })
}

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ["customers", "orders", customerId],
    queryFn: () => getCustomerOrders(customerId as string),
    enabled: !!customerId,
  })
}

export function useToggleCustomerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleCustomerStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  })
}
