import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cimaApi } from '@/lib/api'

export function useCima() {
  return useQuery({
    queryKey: ['cima', 'mine'],
    queryFn: async () => {
      const res = await cimaApi.mine()
      return res.data
    },
  })
}

export function useSendCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetUserId: string) => cimaApi.sendRequest(targetUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
  })
}

export function useAcceptCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.acceptRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
  })
}

export function useDeclineCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.declineRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
  })
}
