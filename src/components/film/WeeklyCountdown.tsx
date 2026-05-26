import { useState, useEffect } from 'react'
import { getWeekCountdown } from '@/lib/votingUtils'

export default function WeeklyCountdown() {
  const [countdown, setCountdown] = useState(getWeekCountdown())

  useEffect(() => {
    const id = setInterval(() => setCountdown(getWeekCountdown()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="font-mono text-[10px]" style={{ color: '#4E4A46' }}>
      Next winner in {countdown}
    </span>
  )
}
