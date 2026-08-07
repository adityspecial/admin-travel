'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import './RouteLoader.css'

interface RouteLoaderProps {
  /** Sticky offset in px — set this to the height of any fixed header above
   *  the main content column, so the bar sticks just below it instead of
   *  being hidden underneath. Layouts with an in-flow sidebar (no fixed
   *  header) can leave this at the default 0. */
  topOffset?: number
}

// Top progress bar for the main content column. Starts the moment an
// internal link is clicked (App Router has no route-change-start event of
// its own) and finishes once `usePathname()` reports the new route mounted.
export function RouteLoader({ topOffset = 0 }: RouteLoaderProps) {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathRef = useRef(pathname)

  function clearTimers() {
    if (tickRef.current) clearInterval(tickRef.current)
    if (hideRef.current) clearTimeout(hideRef.current)
  }

  function start() {
    clearTimers()
    setVisible(true)
    setProgress(8)
    tickRef.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(1, (90 - p) / 12)))
    }, 150)
    // Safety net: same-route clicks never change pathname, so finish anyway.
    hideRef.current = setTimeout(finish, 4000)
  }

  function finish() {
    clearTimers()
    setProgress(100)
    hideRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 200)
  }

  useEffect(() => {
    if (prevPathRef.current !== pathname) finish()
    prevPathRef.current = pathname
  }, [pathname])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement)?.closest('a')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      let url: URL
      try { url = new URL(href, window.location.href) } catch { return }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      start()
    }
    // Capture phase: next/link's own click handler (which calls
    // preventDefault to do client-side routing) runs on the bubble phase at
    // the React root, which is *below* document in the tree — so a bubble
    // listener here would always see e.defaultPrevented already true and
    // never fire. Capture runs on the way down, before that happens.
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clearTimers()
    }
  }, [])

  if (!visible) return null

  return (
    <div className="route-loader-track" style={{ top: topOffset }} aria-hidden="true">
      <div className="route-loader-bar" style={{ width: `${progress}%` }} />
    </div>
  )
}

export default RouteLoader
