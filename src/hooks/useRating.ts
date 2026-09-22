import { useState } from 'react'
import { useRateFilm } from './useFilms'

export function useRating(filmId: string, initialRating?: number) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number>(initialRating ?? 0)
  const rateFilm = useRateFilm(filmId)

  const displayRating = hovered ?? selected

  const submit = (rating: number) => {
    setSelected(rating)
    rateFilm.mutate(rating)
  }

  return {
    displayRating,
    selected,
    hovered,
    setHovered,
    submit,
    isPending: rateFilm.isPending,
  }
}
