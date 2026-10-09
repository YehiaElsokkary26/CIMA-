import { useState, useEffect } from 'react'
import { getWeekCountdown } from '@/lib/votingUtils'

export default function WeeklyCountdown() {
  const [countdown, setCountdown] = useState(getWeekCountdown())

  useEffect(() => {
    const id = setInterval(() => setCountdown(getWeekCountdown()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="text-[10px] text-white/60">
      Next winner in {countdown}
    </span>
  )
}
