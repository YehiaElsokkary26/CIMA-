import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCimaMine, sendCimaRequest, acceptCimaRequest, declineCimaRequest } from '@/lib/supabaseApi'

export function useCima() {
  return useQuery({
    queryKey: ['cima', 'mine'],
    queryFn: getCimaMine,
  })
}

export function useSendCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetUserId: string) => sendCimaRequest(targetUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
  })
}

export function useAcceptCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => acceptCimaRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
  })
}

export function useDeclineCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => declineCimaRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
  })
}
