import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cimaApi, apiErrorMessage, type CimaStatus } from '@/lib/api'
import { toast } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'

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
    onSuccess: (_res, toUserId) => {
      qc.invalidateQueries({ queryKey: ['cima'] })
      qc.invalidateQueries({ queryKey: ['cima', 'status', toUserId] })
      qc.invalidateQueries({ queryKey: ['cima', 'statuses'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not send Cima request')),
  })
}

export function useAcceptCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.acceptRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cima'] })
      qc.invalidateQueries({ queryKey: ['cima', 'status'] })
      qc.invalidateQueries({ queryKey: ['cima', 'statuses'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not accept request')),
  })
}

export function useDeclineCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.declineRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cima'] })
      qc.invalidateQueries({ queryKey: ['cima', 'status'] })
      qc.invalidateQueries({ queryKey: ['cima', 'statuses'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not decline request')),
  })
}

export function useCancelCimaRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cimaApi.cancelRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cima'] })
      qc.invalidateQueries({ queryKey: ['cima', 'status'] })
      qc.invalidateQueries({ queryKey: ['cima', 'statuses'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not cancel request')),
  })
}

/** My relationship with a single user — persists across reloads (server-backed). */
export function useCimaStatus(userId: string | undefined) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery({
    queryKey: ['cima', 'status', userId],
    queryFn: async () => (await cimaApi.status(userId as string)).data.status,
    enabled: isLoggedIn && !!userId,
    staleTime: 30 * 1000,
  })
}

/** My relationship with several users at once (avoids one request per card). */
export function useCimaStatuses(userIds: string[]) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const key = [...new Set(userIds)].sort()
  return useQuery({
    queryKey: ['cima', 'statuses', key],
    queryFn: async () => (await cimaApi.statuses(key)).data.statuses,
    enabled: isLoggedIn && key.length > 0,
    staleTime: 30 * 1000,
  })
}

export const EMPTY_CIMA_STATUSES: Record<string, CimaStatus> = {}
