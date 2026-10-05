import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { img, srcset } from '../data.js'
import { useStepper, STEP_EASE } from '../engine/stepper.js'

gsap.registerPlugin(ScrollTrigger)

/*
 * Move through STRATA — the walk in.
 * One continuous walk from the city across the river to the view the building was made
 * for. Each gesture takes one step: the camera moves forward into the place you are in
 * (a slow push toward where you are going) while the next place dissolves in over it,
 * so two places briefly overlap and nothing ever cuts. Every step takes the same time,
 * whatever the scroll speed (engine/stepper.js).
 */

// f = where the camera walks toward inside this picture (the next place), in % of the frame
const PLACES = [
  { k: 'City', im: 'hero', t: 'Across the river from the Old Town, a building on the bank.', f: [50, 76] },
  { k: 'Landscape', im: 'landscape', t: 'Through the birch grove, along the still pool.', f: [74, 52] },
  { k: 'Lobby', im: 'g-lobby', t: 'Into a double-height hall around a single birch.', f: [50, 46] },
  { k: 'Residence', im: '03-living', t: 'Up to Level 03, into the afternoon.', f: [50, 36] },
  { k: 'Terrace', im: '03-terrace', t: 'Out onto the terrace.', f: [56, 44] },
  { k: 'Skyline', im: '04-view', t: 'And the reason for all of it — the Old Town, across the water.', f: [50, 50] },
]
const N = PLACES.length
const DUR = 1.7 // one step, always
const PUSH = 1.2 // how far the camera moves into the place it leaves
const src = (im) => (im === 'hero' ? img('hero', 2688) : img(im, 2400))
const set = (im) => (im === 'hero' ? `${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w` : srcset(im))
const origin = (i) => `${PLACES[i].f[0]}% ${PLACES[i].f[1]}%`

export default function Walk({ lenis }) {
  const root = useRef(null)
  const cam = useRef(null)
  const ims = useRef([])
  const [at] = useStepper(root, { count: N, lenis, hold: 1050, wheel: 18, swipe: 26, flow: 110 })
  const prev = useRef(0)

  // the arrival: the city settles into view as the section comes up from below the day
  useLayoutEffect(() => {
    gsap.set(ims.current, { opacity: 0 })
    gsap.set(ims.current[0], { opacity: 1 })
    const tw = gsap.fromTo(cam.current, { opacity: 0.25, scale: 1.08 }, { opacity: 1, scale: 1, ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top top', scrub: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [])

  // one step: push into the place you leave while the next one dissolves in over it
  useLayoutEffect(() => {
    const from = prev.current, to = at
    prev.current = at
    if (from === to) return
    const A = ims.current[from], B = ims.current[to]
    const fwd = to > from
    if (Math.abs(to - from) > 1) { // arriving from below: the last place is simply there
      ims.current.forEach((el) => { gsap.killTweensOf(el); gsap.set(el, { opacity: 0, scale: 1 }) })
      gsap.set(B, { opacity: 1, scale: 1 }); return
    }
    // a step may begin while the last one is still dissolving: everything continues from
    // where it is — older places fade out underneath, nothing is reset or cut
    ims.current.forEach((el, i) => {
      if (i === from || i === to) return
      gsap.killTweensOf(el)
      if (gsap.getProperty(el, 'opacity') > 0) gsap.to(el, { opacity: 0, duration: DUR * 0.45, ease: 'sine.inOut' })
      gsap.set(el, { zIndex: 0 })
    })
    gsap.killTweensOf([A, B])
    const tl = gsap.timeline({ defaults: { ease: STEP_EASE } })
    if (gsap.getProperty(B, 'opacity') > 0.01) {
      // turned back mid-step: the place being left is still underneath — it simply returns
      // while the one on top fades away
      gsap.set(B, { zIndex: 1 }); gsap.set(A, { zIndex: 2 })
      tl.to(B, { opacity: 1, scale: 1, duration: DUR * 0.6 }, 0)
        .to(A, { opacity: 0, duration: DUR * 0.6, ease: 'sine.inOut' }, 0)
      return
    }
    const settled = Math.abs(gsap.getProperty(A, 'scale') - 1) < 0.004
    gsap.set(B, { zIndex: 2, transformOrigin: fwd ? '50% 50%' : origin(to) })
    gsap.set(A, { zIndex: 1, ...(settled ? { transformOrigin: fwd ? origin(from) : '50% 50%' } : {}) })
    tl.to(A, { scale: fwd ? PUSH : 1.12, duration: DUR }, 0)
      .fromTo(B, { scale: fwd ? 1.12 : PUSH, opacity: 0 }, { scale: 1, duration: DUR }, 0)
      .to(B, { opacity: 1, duration: DUR * 0.62, ease: 'sine.inOut' }, DUR * 0.18)
      .to(A, { opacity: 0, duration: DUR * 0.3, ease: 'sine.in' }, DUR * 0.7)
    if (gsap.getProperty(A, 'opacity') < 1) tl.to(A, { opacity: 1, duration: DUR * 0.3, ease: 'sine.out' }, 0)
  }, [at])

  const P = PLACES[at]
  return (
    <section className="walk" ref={root} aria-label="From the city to the view">
      <div className="walk-sticky">
        <div className="walk-cam" ref={cam}>
          {PLACES.map((p, i) => (
            <img key={p.im} ref={(el) => (ims.current[i] = el)} className="walk-img" alt={i === at ? p.k : ''}
              src={src(p.im)} srcSet={set(p.im)} sizes="100vw" loading="lazy" />
          ))}
        </div>
        <div className="walk-shade" />

        <p className="kicker mono walk-k"><span>04</span><span>From the city</span></p>
        <ol className="walk-rail mono" aria-hidden="true">
          {PLACES.map((p, i) => <li key={p.k} className={i === at ? 'on' : i < at ? 'past' : ''}><span>{String(i + 1).padStart(2, '0')}</span><span>{p.k}</span></li>)}
        </ol>
        <div className="walk-cap" key={at} aria-live="polite">
          <p className="mono walk-cap-k"><span>{String(at + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}</span><span>{P.k}</span></p>
          <p className="serif walk-cap-t">{P.t}</p>
        </div>
      </div>
    </section>
  )
}
