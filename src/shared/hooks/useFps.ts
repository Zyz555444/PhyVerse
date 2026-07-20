import { useEffect, useState } from 'react'

export function useFps(): number {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let frames = 0
    let raf = 0
    let last = performance.now()
    const tick = () => {
      frames++
      const now = performance.now()
      if (now - last >= 1000) {
        setFps(frames)
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return fps
}
