import { useEffect, useState } from 'react'

// True when the viewport is narrow enough that the desktop side-by-side HUD
// layout should collapse to a centered, stacked one.
export default function useIsMobile(breakpoint = 860) {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  )

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < breakpoint)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])

  return mobile
}
