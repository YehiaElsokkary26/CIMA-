import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { filmsApi } from '@/lib/api'

export function useRating(filmId: string, initialRating?: number) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number>(initialRating ?? 0)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (rating: number) => filmsApi.rate(filmId, rating),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['film', filmId] }),
  })

  const displayRating = hovered ?? selected

  const submit = (rating: number) => {
    setSelected(rating)
    mutation.mutate(rating)
  }

  return {
    displayRating,
    selected,
    hovered,
    setHovered,
    submit,
    isPending: mutation.isPending,
  }
}
