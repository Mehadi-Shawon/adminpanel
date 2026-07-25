import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
  type CreateOrderInput,
  type OrderQuery,
} from "@/lib/api/orders"
import type { OrderStatus } from "@/types"

export function useOrders(params?: OrderQuery) {
  return useQuery({ queryKey: ["orders", params], queryFn: () => getOrders(params) })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrder(id as string),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}
