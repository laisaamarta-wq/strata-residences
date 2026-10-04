import { useEffect, useRef } from 'react'

const BASE = '/behance/media/'

/**
 * A silent cinematic loop — a real recording of the production build, treated as
 * part of the page, never as a player: autoplay · muted · loop · playsInline, no controls.
 *
 * Viewport logic: the file is fetched shortly before the film approaches the screen,
 * it plays only while it is actually in view, pauses when it leaves, and resumes
 * (or restarts, with `restart`) when it comes back. Nothing far down the page plays
 * while the visitor is looking at the top.
 */
export default function Film({ name, className = '', label, style, restart = false, eager = false, start = 0, onTime }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    v.muted = true
    v.defaultMuted = true
    v.controls = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    v.loop = !reduce // reduced motion: plays once and rests on its last frame
    // the viewport decides when a film plays; only the opening film starts on load
    if (!eager) v.autoplay = false
    const load = () => {
      if (v.getAttribute('src')) return
      // a film may open on its most telling moment rather than on frame one
      if (start) v.addEventListener('loadedmetadata', () => { v.currentTime = start }, { once: true })
      v.setAttribute('src', `${BASE}${name}.mp4`); v.load()
    }
    if (eager) load()
    const play = () => { const p = v.play(); if (p) p.catch(() => {}) }

    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) load() }, { rootMargin: '800px 0px' })
    const seen = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        load()
        if (restart && v.dataset.left) { v.currentTime = start }
        play()
      } else if (!v.paused) { v.pause(); v.dataset.left = '1' }
    }, { threshold: 0.35 })
    // observe the frame, not the video: cropped films are much larger than what is visible
    const box = v.parentElement || v
    near.observe(box); seen.observe(box)
    const t = onTime ? () => onTime(v.currentTime, v.duration) : null
    if (t) v.addEventListener('timeupdate', t)
    return () => { near.disconnect(); seen.disconnect(); if (t) v.removeEventListener('timeupdate', t) }
  }, [name, restart, eager, start, onTime])
  return (
    <video ref={ref} className={`cs-film ${className}`} poster={`${BASE}${name}.jpg`} style={style}
      muted autoPlay loop playsInline preload={eager ? 'auto' : 'none'}
      disablePictureInPicture disableRemotePlayback aria-label={label} tabIndex={-1} />
  )
}
