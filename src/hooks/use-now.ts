import { useEffect, useState } from 'react'

export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const interval = window.setInterval(refresh, intervalMs)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [intervalMs])

  return now
}
