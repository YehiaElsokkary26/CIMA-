import { useState } from 'react'

export function useRating(filmId: string, initialRating?: number) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number>(initialRating ?? 0)
  const [isPending, setIsPending] = useState(false)

  const displayRating = hovered ?? selected

  const submit = (rating: number) => {
    setSelected(rating)
    // Client-side only — no ratings table in DB yet
    setIsPending(true)
    setTimeout(() => setIsPending(false), 400)
    void filmId // suppress unused warning
  }

  return {
    displayRating,
    selected,
    hovered,
    setHovered,
    submit,
    isPending,
  }
}
