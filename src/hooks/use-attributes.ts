import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createAttribute,
  deleteAttribute,
  getAttributes,
  type AttributeInput,
} from "@/lib/api/attributes"

export function useAttributes() {
  return useQuery({ queryKey: ["attributes"], queryFn: getAttributes })
}

export function useCreateAttribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AttributeInput) => createAttribute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  })
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAttribute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  })
}
