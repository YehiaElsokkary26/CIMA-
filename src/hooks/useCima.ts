import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cimaApi, apiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

export function useCima() {
  return useQuery({
    queryKey: ['cima', 'mine'],
    queryFn: async () => (await cimaApi.mine()).data,
  })
}

export function useCimaCrewOf(userId: string) {
  return useQuery({
    queryKey: ['cima', 'crew', userId],
    queryFn: async () => (await cimaApi.crewOf(userId)).data,
    enabled: !!userId,
  })
}

export function useSendCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (toUserId: string) => cimaApi.sendRequest(toUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not send Cima request')),
  })
}

export function useAcceptCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.acceptRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not accept request')),
  })
}

export function useDeclineCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.declineRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not decline request')),
  })
}

export function useCancelCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.cancelRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cima'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not cancel request')),
  })
}
