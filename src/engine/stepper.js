import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * Stepped scenes — scroll chooses the direction, never the speed.
 *
 * A stepped scene is exactly one screen tall. When the page arrives at it (from above
 * or below) the scroll settles on it and holds: from then on one gesture — a wheel or
 * trackpad swipe, a touch swipe, an arrow key — moves the scene one state, through a
 * transition of fixed length. Momentum and fast flicks cannot skip states; a new
 * gesture is only read once the transition has finished. Past the first or the last
 * state the hold is released and the page glides, in one controlled move, to the
 * neighbouring section (which may itself be a stepped scene and hold again).
 *
 * Navigation from the header passes through without stopping (NAV.busy).
 *
 * flow (px, optional): a scroll that simply keeps going is read as well. Once a step's
 * transition is nearly over, every further `flow` px of the same scroll asks for the next
 * state, and a step asked for during a transition runs the moment it ends (at most one
 * waits). Scrolling on therefore moves through the scene at the scene's own fixed cadence
 * — the scroll decides how far, never how fast — and no state is ever passed over.
 */

export const NAV = { busy: false }
export const STEP_EASE = 'power2.inOut'
const glide = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let ACTIVE = null // one held scene at a time
const GLIDE = { on: false } // a release glide is running

export function useStepper(ref, { count, lenis, hold = 1200, wheel = 26, swipe = 34, flow = 0 }) {
  const [index, setIndex] = useState(0)
  const S = useRef({ i: 0, locked: false, until: 0, go: null })

  useEffect(() => {
    const el = ref.current
    if (!el || !lenis) return
    const s = S.current
    const top = () => el.getBoundingClientRect().top + window.scrollY
    const holdMs = reduce ? 450 : hold
    const ahead = holdMs * 0.4 // the end of a transition, where the next step may already be asked for
    const set = (i) => { s.i = i; setIndex(i) }
    let qDir = 0, qTimer = 0
    const unqueue = () => { qDir = 0; clearTimeout(qTimer) }

    const lock = (i) => {
      if (NAV.busy || s.locked) return
      GLIDE.on = false // a glide that brought us here ends here
      if (ACTIVE && ACTIVE !== s) ACTIVE.locked = false
      ACTIVE = s
      s.locked = true
      set(i)
      s.until = performance.now() + 650
      s.snapping = true
      lenis.scrollTo(top(), { duration: 0.6, force: true, lock: true, easing: glide, onComplete: () => { s.snapping = false; if (s.locked) lenis.stop() } })
    }
    const release = (dir) => {
      unqueue()
      s.locked = false
      if (ACTIVE === s) ACTIVE = null
      lenis.start()
      const y = dir > 0 ? top() + el.offsetHeight : top() - window.innerHeight
      // the glide to the neighbour cannot be interrupted by the rest of the same gesture
      GLIDE.on = true
      lenis.scrollTo(Math.max(0, y), { duration: reduce ? 0.6 : 1.4, force: true, lock: true, easing: glide,
        onComplete: () => { GLIDE.on = false } })
    }
    const step = (dir) => {
      const now = performance.now()
      if (!s.locked || now < s.until) return
      const j = s.i + dir
      if (j < 0 || j >= count) { s.until = now + 800; release(dir); return }
      s.until = now + holdMs
      set(j)
    }
    // a step asked for: now, or — with flow — as soon as the running transition ends
    const request = (dir, fresh) => {
      const now = performance.now()
      if (!s.locked) return
      if (now >= s.until) { unqueue(); step(dir); return }
      if (!flow || (!fresh && now < s.until - ahead)) return
      qDir = dir
      clearTimeout(qTimer)
      qTimer = setTimeout(() => { const d = qDir; qDir = 0; if (d && s.locked) step(d) }, s.until - now + 4)
    }
    s.go = (i) => {
      const now = performance.now()
      if (now < s.until || i === s.i) return
      s.until = now + holdMs
      set(Math.max(0, Math.min(count - 1, i)))
    }

    // the page reaches the scene: from above it opens on the first state, from below on the
    // last. Read from the scroll itself, so a fast flick that jumps past still stops here.
    let lastY = lenis.scroll
    const onScroll = ({ scroll: y }) => {
      const S0 = top()
      if (!s.locked && !NAV.busy) {
        if (lastY < S0 - 1 && y >= S0 - 1) lock(0)
        else if (lastY > S0 + 1 && y <= S0 + 1) lock(count - 1)
      } else if (s.locked && !lenis.isStopped && Math.abs(y - S0) > 80 && !s.snapping) {
        // something else moved the page away (the header navigation): let go
        s.locked = false
        if (ACTIVE === s) ACTIVE = null
      }
      lastY = y
    }
    const offScroll = lenis.on('scroll', onScroll)

    // ---- gestures: one gesture, one step ----
    // A trackpad swipe arrives as a burst of wheel events followed by a long momentum
    // tail. A gesture is "new" after a quiet gap, or when the deltas suddenly grow
    // again (a fresh push during the tail). Everything else is ignored.
    let armed = true, acc = 0, lastT = 0, lastD = 0, run = 0, peak = 0
    const onWheel = (e) => {
      if (GLIDE.on && e.cancelable) { e.preventDefault(); lastT = performance.now(); return }
      if (!s.locked) return
      e.preventDefault()
      const t = performance.now(), d = e.deltaY
      if (t - lastT > 200) { armed = true; acc = 0; peak = 0 }
      else if (Math.abs(d) > 24 && Math.abs(d) > Math.abs(lastD) * 1.7 + 6) { armed = true; acc = 0; peak = 0 }
      lastT = t; lastD = d
      peak = Math.max(peak, Math.abs(d))
      if (armed) {
        acc += d
        if (Math.abs(acc) > wheel) { const dir = acc > 0 ? 1 : -1; armed = false; acc = 0; run = 0; request(dir, true) }
        return
      }
      // the same scroll going on (flow): measured only near the end of the transition, so
      // the momentum of the gesture that took the step is not read twice
      if (!flow) return
      if (t < s.until - ahead) { run = 0; return }
      // a decaying momentum tail is the end of the last gesture, not more scrolling
      if (Math.abs(d) < peak * 0.6) return
      if (run && Math.sign(d) !== Math.sign(run)) run = 0
      run += d
      if (Math.abs(run) > flow) { const dir = run > 0 ? 1 : -1; run = 0; request(dir, false) }
    }
    let y0 = null, fired = false
    const onTouchStart = (e) => { y0 = e.touches[0].clientY; fired = false }
    const onTouchMove = (e) => {
      if (GLIDE.on && e.cancelable) { e.preventDefault(); return }
      if (!s.locked) return
      e.preventDefault()
      if (y0 === null) return
      const y = e.touches[0].clientY
      if (fired) {
        // one long drag (flow): the finger's travel during the transition belongs to the
        // step just taken; after that, every further `flow` px asks for the next state
        if (!flow) return
        if (performance.now() < s.until - ahead) { y0 = y; return }
      }
      const dy = y0 - y
      if (Math.abs(dy) > (fired ? flow : swipe)) { const first = !fired; fired = true; y0 = y; request(dy > 0 ? 1 : -1, first) }
    }
    const onKey = (e) => {
      if (!s.locked || e.target.closest?.('input, textarea, select')) return
      const k = e.key
      const dir = k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey) ? 1
        : k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey) ? -1 : 0
      if (!dir) return
      e.preventDefault()
      request(dir, true)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      offScroll?.()
      unqueue()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      if (ACTIVE === s) { ACTIVE = null; lenis.start() }
    }
  }, [ref, lenis, count, hold, wheel, swipe, flow])

  const go = useCallback((i) => S.current.go?.(i), [])
  return [index, go]
}
