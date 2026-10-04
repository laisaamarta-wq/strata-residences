import { useEffect, useRef } from 'react'

const BASE = '/behance/media/'

/**
 * A silent cinematic loop. Real recordings of the production build.
 * autoplay · muted · loop · playsInline — the file is only fetched when the film
 * approaches the viewport, and it pauses when it leaves (battery, bandwidth).
 */
export default function Film({ name, className = '', label, style, start }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    v.muted = true
    v.defaultMuted = true
    // reduced motion: the film waits for a tap instead of playing on its own
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.autoplay = false
      v.controls = true
      v.setAttribute('src', `${BASE}${name}.mp4`)
      v.preload = 'metadata'
      return
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.getAttribute('src')) {
          v.setAttribute('src', `${BASE}${name}.mp4`)
          if (start) v.addEventListener('loadedmetadata', () => { v.currentTime = start }, { once: true })
        }
        const p = v.play()
        if (p) p.catch(() => {})
      } else if (!v.paused) v.pause()
    }, { rootMargin: '300px 0px' })
    io.observe(v)
    return () => io.disconnect()
  }, [name, start])
  return (
    <video ref={ref} className={`cs-film ${className}`} poster={`${BASE}${name}.jpg`} style={style}
      muted autoPlay loop playsInline preload="none" disablePictureInPicture aria-label={label} />
  )
}
