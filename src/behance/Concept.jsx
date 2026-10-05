import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { img, srcset } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

/*
 * 02 — Concept: the interface as a spatial journey, drawn as depth.
 * Four frames from the real site nest inside each other along the camera's path —
 * riverbank, Level 03, through the glass, the terrace — each placed where the camera
 * actually goes next (Level 03 sits where it is on the photograph).
 * Scroll first opens the depths one by one, then pushes the camera toward them.
 */

const R = 0.46 // each depth is 46 % of the one before
const DEPTHS = [
  { k: 'Riverbank', im: 'hero', pos: '50% 50%' },
  { k: 'Level 03', im: 'facade-03', pos: '50% 50%' },
  { k: 'Through the glass', im: '03-living', pos: '50% 50%' },
  { k: 'The terrace', im: '03-terrace', pos: '50% 50%' },
]
// Level 03 on the hero photograph, in frame fractions (16:10 frame, cover-fitted 16:9 image)
const AT = { x: 49.4, y: 49.5 }

export default function Concept() {
  const root = useRef(null)
  const zoom = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const frames = gsap.utils.toArray('.cs-cn-frame')
      const z = { v: 0 }
      const zEnd = 1 / (R * R) // the camera ends where "Through the glass" fills the frame
      const apply = () => {
        const s = Math.exp(Math.log(zEnd) * z.v)
        gsap.set(zoom.current, { scale: s })
        zoom.current.style.setProperty('--z', s)
      }
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
      // depths open from the centre outward, like a door seen head-on
      frames.forEach((f, i) => {
        if (i === 0) return
        tl.fromTo(f, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power2.inOut' }, 0.05 + (i - 1) * 0.32)
        tl.fromTo(f.querySelector('img'), { scale: 1.3 }, { scale: 1, duration: 0.7, ease: 'power2.out' }, 0.05 + (i - 1) * 0.32)
      })
      tl.fromTo(root.current.querySelectorAll('.cs-cn-label'), { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.32 }, 0.1)
      // then the camera moves in — slow start, controlled arrival
      tl.to(z, { v: 1, duration: 1.4, ease: 'power2.inOut', onUpdate: apply }, 1.3)
      tl.to(root.current.querySelector('.cs-cn-text'), { opacity: 0.25, duration: 0.6, ease: 'none' }, 1.9)
      apply()
    }, root)
    return () => ctx.revert()
  }, [])

  // frames nest: each one is a child of the one before
  const nest = (i) => {
    const d = DEPTHS[i]
    if (!d) return null
    const style = i === 0 ? undefined : i === 1
      ? { left: `${AT.x}%`, top: `${AT.y}%`, width: `${R * 100}%`, height: `${R * 100}%` }
      : { left: '50%', top: '50%', width: `${R * 100}%`, height: `${R * 100}%` }
    return (
      <div className={`cs-cn-frame cs-cn-d${i}`} style={style}>
        <img alt={d.k} src={d.im === 'hero' ? img('hero', 1400) : img(d.im, 1280)}
          srcSet={d.im === 'hero' ? `${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w` : srcset(d.im)} sizes="60vw" style={{ objectPosition: d.pos }} />
        <span className="mono cs-cn-label"><b>{String(i + 1).padStart(2, '0')}</b><span>{d.k}</span></span>
        {nest(i + 1)}
      </div>
    )
  }

  return (
    <section className="cs-cn" ref={root} data-chapter="02 — Concept">
      <div className="cs-cn-sticky">
        <div className="cs-wrap cs-cn-grid">
          <div className="cs-cn-text">
            <p className="cs-k mono"><span>02</span><span>Concept</span></p>
            <h2 className="serif cs-h-s">The interface is<br /><em>a spatial journey.</em></h2>
            <p className="cs-p">
              Instead of a set of static renders, one continuous camera guides the visitor — from the riverbank to a single level,
              through the glass, to the view from inside. Moving through the site means changing position, never changing page.
            </p>
          </div>
          <div className="cs-cn-stage">
            <div className="cs-cn-zoom" ref={zoom} style={{ transformOrigin: `${AT.x}% ${AT.y}%` }}>{nest(0)}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
