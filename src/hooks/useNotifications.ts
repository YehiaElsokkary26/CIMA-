import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi, apiErrorMessage } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'

export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationsApi.list()).data,
    enabled: isLoggedIn,
  })

  // Live updates: Supabase Realtime on the notifications table (RLS-scoped to
  // the signed-in user), so new notifications appear without polling. This is
  // a read-only subscription — all writes still go through Express.
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ['notifications'] }),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, qc])

  return query
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update notification')),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update notifications')),
  })
}
