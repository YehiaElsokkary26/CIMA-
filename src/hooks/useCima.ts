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

export type CrewStatus = 'self' | 'crew' | 'sent' | 'received' | 'none'
type CrewData = ReturnType<typeof useCima>['data']

/**
 * Where you stand with someone, from your crew data: already crew,
 * call sheet sent, call sheet waiting for you (with its id), or nothing yet.
 */
export function crewStatusFor(
  data: CrewData,
  userId: string | undefined,
  meId: string | undefined,
): { status: CrewStatus; requestId?: string } {
  if (!userId || userId === meId) return { status: 'self' }
  if (data?.members.some((m) => m.user.id === userId)) return { status: 'crew' }
  if (data?.sent?.some((s) => s.toUserId === userId)) return { status: 'sent' }
  const incoming = data?.requests.find((r) => r.fromUserId === userId)
  if (incoming) return { status: 'received', requestId: incoming.id }
  return { status: 'none' }
}

export function useCrewStatus(userId: string | undefined, meId: string | undefined) {
  const { data, isPending } = useCima()
  return { ...crewStatusFor(data, userId, meId), isPending }
}
