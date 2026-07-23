import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createCoupon, deleteCoupon, getCoupons, type CouponInput } from "@/lib/api/coupons"

export function useCoupons() {
  return useQuery({ queryKey: ["coupons"], queryFn: getCoupons })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CouponInput) => createCoupon(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  })
}
