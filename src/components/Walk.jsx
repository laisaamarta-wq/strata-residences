import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { img, srcset } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

/*
 * Move through STRATA — the walk in.
 * Behind the Case drew the site's concept as depth: each place nests inside the one before,
 * opens like a door seen head-on, and the camera passes through it. Here the same move
 * takes the visitor on foot — from the city across the river, through the grove and the
 * hall, up into a residence, out onto the terrace — and ends on the view the building
 * was made for, which is where the location begins.
 * Only two frames exist at a time: the place you are in and the one you are walking into.
 */

const R = 0.5 // each next place opens at half the size of the one around it
const DEPTHS = [
  { k: 'City', im: 'hero', t: 'Across the river from the Old Town, a building on the bank.', at: [0.25, 0.5] },
  { k: 'Landscape', im: 'landscape', t: 'Through the birch grove, along the still pool.', at: [0.47, 0.28] },
  { k: 'Lobby', im: 'g-lobby', t: 'Into a double-height hall around a single birch.', at: [0.25, 0.2] },
  { k: 'Residence', im: '03-living', t: 'Up to Level 03, into the afternoon.', at: [0.25, 0.12] },
  { k: 'Terrace', im: '03-terrace', t: 'Out onto the terrace.', at: [0.28, 0.2] },
  { k: 'Skyline', im: '04-view', t: 'And the reason for all of it — the Old Town, across the water.' },
]
const SEG = DEPTHS.length - 1
const HOLD = 0.8 // the last view holds before the page moves on
const STEP_VH = 70
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const e2 = gsap.parseEase('power2.inOut')
const e3 = gsap.parseEase('power3.out')
const src = (im, w) => (im === 'hero' ? img('hero', w > 1400 ? 2688 : 1400) : img(im, w))
const set = (im) => (im === 'hero' ? `${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w` : srcset(im))

export default function Walk() {
  const root = useRef(null)
  const cam = useRef(null)
  const win = useRef(null)
  const winImg = useRef([])
  const [k, setK] = useState(0)
  const [cap, setCap] = useState(0)
  const K = useRef(0)

  useLayoutEffect(() => {
    let lastCap = -1
    const apply = (p) => {
      const T = clamp(p, 0, 1) * (SEG + HOLD)
      const seg = Math.min(SEG, Math.floor(T))
      const u = seg >= SEG ? 0 : T - seg
      if (seg !== K.current) { K.current = seg; setK(seg) }
      const open = e3(clamp(u / 0.32, 0, 1))
      const z = e2(clamp((u - 0.28) / 0.72, 0, 1))
      const c = seg >= SEG ? SEG : u < 0.62 ? seg : seg + 1
      if (c !== lastCap) { lastCap = c; setCap(c) }
      if (seg >= SEG) {
        gsap.set(cam.current, { scale: 1 })
        gsap.set(win.current, { clipPath: 'inset(50% 50% 50% 50%)', '--edge': 0 })
        return
      }
      const [a, b] = DEPTHS[seg].at
      cam.current.style.transformOrigin = `${(a / (1 - R)) * 100}% ${(b / (1 - R)) * 100}%`
      gsap.set(cam.current, { scale: Math.pow(1 / R, z) })
      const ci = 50 * (1 - open)
      gsap.set(win.current, { clipPath: `inset(${ci}% ${ci}% ${ci}% ${ci}%)`, '--edge': 1 - z })
      const im = winImg.current[seg + 1]
      if (im) gsap.set(im, { scale: 1 + 0.3 * (1 - open) })
    }
    const st = ScrollTrigger.create({ trigger: root.current, start: 'top top', end: 'bottom bottom', onUpdate: (s) => apply(s.progress) })
    apply(0)
    return () => st.kill()
  }, [])

  const at = DEPTHS[k].at || [0, 0]
  const D = DEPTHS[cap]
  return (
    <section className="walk" ref={root} style={{ height: `calc(${(SEG + HOLD) * STEP_VH}vh + 100vh)` }} aria-label="From the city to the view">
      <div className="walk-sticky">
        <div className="walk-cam" ref={cam}>
          {DEPTHS.map((d, i) => (
            <img key={d.im} className={`walk-full ${i === k ? 'on' : ''}`} alt={i === k ? d.k : ''} src={src(d.im, 2400)} srcSet={set(d.im)} sizes="100vw" loading="lazy" />
          ))}
          <div className="walk-win" ref={win} style={{ left: `${at[0] * 100}%`, top: `${at[1] * 100}%`, width: `${R * 100}%`, height: `${R * 100}%` }}>
            {DEPTHS.map((d, i) => (
              <img key={d.im} ref={(el) => (winImg.current[i] = el)} className={i === k + 1 ? 'on' : ''} alt="" src={src(d.im, 2400)} srcSet={set(d.im)} sizes="100vw" loading="lazy" />
            ))}
            {DEPTHS[k + 1] && <span className="mono walk-label"><b>{String(k + 2).padStart(2, '0')}</b>{DEPTHS[k + 1].k}</span>}
          </div>
        </div>
        <div className="walk-shade" />

        <p className="kicker mono walk-k"><span>04</span><span>From the city</span></p>
        <ol className="walk-rail mono" aria-hidden="true">
          {DEPTHS.map((d, i) => <li key={d.k} className={i === cap ? 'on' : i < cap ? 'past' : ''}><span>{String(i + 1).padStart(2, '0')}</span><span>{d.k}</span></li>)}
        </ol>
        <div className="walk-cap" key={cap} aria-live="polite">
          <p className="mono walk-cap-k"><span>{String(cap + 1).padStart(2, '0')} / {String(DEPTHS.length).padStart(2, '0')}</span><span>{D.k}</span></p>
          <p className="serif walk-cap-t">{D.t}</p>
        </div>
      </div>
    </section>
  )
}
