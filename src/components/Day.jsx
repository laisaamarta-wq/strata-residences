import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLOORS, MASTER, BUILDING_BOX as BB, img, srcset } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

/*
 * A day at STRATA — follow the light.
 * Behind the Case told it as "a different hour on every floor"; here the visitor lives it.
 * Scroll is the clock: the minutes run under the thumb, each hour opens its room like a
 * floor slab, and the building beside it lights the level that owns that hour — so the day
 * is seen climbing the building, garden at dawn to the pavilion at blue hour.
 */

const STOPS = [
  { f: '01', im: '01-living', t: 'The low eastern sun slides under the deepest slab, and the garden court holds the river mist a little longer.' },
  { f: '02', im: '02-living', t: 'At noon the 2.4 m slab edge shades the glass. Light arrives soft and even, off lime plaster and linen.' },
  { f: '03', im: '03-kitchen', t: 'The afternoon sun reaches over the terrace onto honed travertine, which keeps its warmth into the evening.' },
  { f: 'g', im: 'g-lobby', t: 'Home. The double-height hall is lit low, like a lantern on the plaza, and the still pool doubles it.' },
  { f: '04', im: '04-living', t: 'A Riga summer evening: the sun is still high at seven, and the corner glazing frames the Old Town in clear light.' },
  { f: '05', im: '05-terrace', t: 'Dusk. A bronze light line takes over from the sky; the fire is lit on the terrace.' },
  { f: 'ph', im: 'ph-pool', t: 'Blue hour. The Old Town turns on across the river — the last layer is the sky.' },
].map((s) => {
  const i = FLOORS.findIndex((x) => x.id === s.f)
  const [h, m] = FLOORS[i].hour.split(':').map(Number)
  return { ...s, i, fl: FLOORS[i], min: h * 60 + m }
})
const N = STOPS.length
const STEP_VH = 62
const MOVE = 0.5
const DAY = { a: 6 * 60, b: 24 * 60 }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const ease = gsap.parseEase('power2.inOut')
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`
const pctDay = (m) => ((m - DAY.a) / (DAY.b - DAY.a)) * 100

// the building crop beside the room (image px)
const CROP = { x: BB.x - 6, y: BB.y + 4, w: BB.w + 12, h: BB.h - 6 }
const pc = (v, of) => `${(v / of) * 100}%`

export default function Day({ lenis }) {
  const root = useRef(null)
  const clock = useRef(null)
  const bar = useRef(null)
  const [at, setAt] = useState(0)

  useLayoutEffect(() => {
    let last = -1
    const apply = (p) => {
      const t = clamp(p, 0, 0.9999) * N
      const k = Math.floor(t)
      if (k !== last) { last = k; setAt(k) }
      // the clock runs from the previous hour to this one, then holds
      const b = k === 0 ? 1 : ease(clamp((t - k) / MOVE, 0, 1))
      const m = k === 0 ? STOPS[0].min : STOPS[k - 1].min + (STOPS[k].min - STOPS[k - 1].min) * b
      if (clock.current) clock.current.textContent = fmt(m)
      if (bar.current) bar.current.style.transform = `scaleX(${pctDay(m) / 100})`
    }
    const st = ScrollTrigger.create({ trigger: root.current, start: 'top top', end: 'bottom bottom', onUpdate: (s) => apply(s.progress) })
    apply(0)
    return () => st.kill()
  }, [])

  const go = (i) => {
    const top = root.current.getBoundingClientRect().top + window.scrollY
    const span = root.current.offsetHeight - window.innerHeight
    lenis?.scrollTo(top + span * ((i + MOVE + 0.05) / N), { duration: 1.8 })
  }

  const S = STOPS[at]
  return (
    <section className="day" ref={root} style={{ height: `calc(${N * STEP_VH}vh + 100vh)` }} aria-label="A day at STRATA">
      <div className="day-sticky">
        <div className="day-rooms">
          {STOPS.map((s, i) => (
            <div key={s.im} className={`day-room ${i <= at ? 'on' : ''}`}>
              <img alt={`${s.fl.name} — ${s.fl.light}`} src={img(s.im, 2400)} srcSet={srcset(s.im)} sizes="100vw" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="day-shade" />

        <div className="day-in">
          <p className="kicker mono day-k"><span>03</span><span>Light — a day at STRATA</span></p>
          <p className="serif day-clock" aria-hidden="true"><span ref={clock} /></p>
          <div className="day-cap" key={at} aria-live="polite">
            <p className="mono day-lv"><span>Level {S.fl.label}</span><span>{S.fl.name}</span><span>{S.fl.light}</span></p>
            <p className="serif day-t">{S.t}</p>
          </div>
        </div>

        {/* the building beside the room: the day climbs it */}
        <div className="day-bld" aria-hidden="true">
          <div className="day-bld-crop" style={{ aspectRatio: `${CROP.w} / ${CROP.h}` }}>
            <div className="day-bld-world" style={{ width: pc(MASTER.w, CROP.w), left: pc(-CROP.x, CROP.w), top: pc(-CROP.y, CROP.h), aspectRatio: `${MASTER.w} / ${MASTER.h}` }}>
              <img className="day-bld-master" alt="" src={img('hero', 1400)} loading="lazy" />
              {FLOORS.map((f, i) => (
                <img key={f.id} className={`day-bld-slice ${i === S.i ? 'on' : ''}`} alt="" src={`/img/slice-${f.id}.webp`} loading="lazy"
                  style={{ left: pc(f.slice.x, MASTER.w), top: pc(f.slice.y, MASTER.h), width: pc(f.slice.w, MASTER.w), height: pc(f.slice.h, MASTER.h) }} />
              ))}
            </div>
          </div>
          {FLOORS.map((f, i) => (
            <span key={f.id} className={`day-bld-tick mono ${i === S.i ? 'on' : ''}`}
              style={{ top: pc(f.slice.y + f.slice.h / 2 - CROP.y, CROP.h) }}>{f.hour}</span>
          ))}
        </div>

        {/* the day as a line, 06:00 → 24:00 */}
        <div className="day-line">
          <div className="day-track"><i ref={bar} /></div>
          <ol className="mono">
            {STOPS.map((s, i) => (
              <li key={s.im} style={{ left: `${pctDay(s.min)}%` }} className={i === at ? 'on' : i < at ? 'past' : ''}>
                <button onClick={() => go(i)} aria-label={`${s.fl.hour} — Level ${s.fl.label}`}><span>{s.fl.label}</span></button>
              </li>
            ))}
          </ol>
          <p className="mono day-ends"><span>06:00</span><span>24:00</span></p>
        </div>
      </div>
    </section>
  )
}
