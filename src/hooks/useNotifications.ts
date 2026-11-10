import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Notification } from '@/types'

// Both queries share the ['notifications', userId] prefix, so one
// invalidation refreshes the list and the badge together.
const keys = {
  all: (userId?: string) => ['notifications', userId] as const,
  unread: (userId?: string) => ['notifications', userId, 'unread'] as const,
}

export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: keys.all(userId),
    queryFn: async () => (await notificationsApi.list()).data,
    enabled: !!userId,
  })
}

/** Unread count for the bell badge. */
export function useUnreadCount() {
  const userId = useAuthStore((s) => s.user?.id)
  const { data } = useQuery({
    queryKey: keys.unread(userId),
    queryFn: async () => (await notificationsApi.unreadCount()).data.count,
    enabled: !!userId,
    // Realtime covers new rows; this catches anything missed while offline.
    refetchInterval: 2 * 60 * 1000,
  })
  return data ?? 0
}

export function useMarkRead() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: (id) => {
      // Update the list and badge straight away.
      qc.setQueryData<Notification[]>(keys.all(userId), (list) => list?.map((n) => (n.id === id ? { ...n, read: true } : n)))
      qc.setQueryData<number>(keys.unread(userId), (c) => Math.max(0, (c ?? 1) - 1))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all(userId) }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: () => {
      qc.setQueryData<Notification[]>(keys.all(userId), (list) => list?.map((n) => ({ ...n, read: true })))
      qc.setQueryData<number>(keys.unread(userId), 0)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all(userId) }),
  })
}

/**
 * Listens for new notifications over Supabase Realtime while signed in.
 * Mounted once in the app shell, so the badge updates on every screen.
 */
export function useLiveNotifications() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: keys.all(userId) }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, qc])
}
