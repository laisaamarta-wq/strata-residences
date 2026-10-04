import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLOORS, MASTER, img, srcset } from '../data.js'
import { Director } from '../engine/director.js'
import { toImage, toScreen } from '../engine/camera.js'

gsap.registerPlugin(ScrollTrigger)

/*
 * The opening of the case study is the production stage itself.
 * Same DOM, same stylesheet, same Director class and the same building → floor
 * timeline (Director.buildEnter) — only its playhead is driven by scroll instead of time.
 */

const STEPS = [
  { k: 'Exterior', t: 'The building at dusk on the Ķīpsala riverbank. Seven levels, each tuned to a different hour.' },
  { k: 'Approach', t: 'The camera dollies to one level. The floors above and below part around it.' },
  { k: 'Entry', t: 'A matched cut turns the drawing into a photograph of the same facade.' },
  { k: 'Interior', t: 'Through the glass, into the residence.' },
  { k: 'Space', t: 'Rooms cross-fade in the direction you move.' },
]
// scroll progress at which each step begins (the enter timeline runs from 0.09 to 0.78)
const BOUNDS = [0, 0.09, 0.3, 0.56, 0.84]
const TL_A = 0.09, TL_B = 0.78, ZONE_AT = 0.84
const DEFAULT_FLOOR = 4

const elevNum = (f) => parseFloat(FLOORS[f].elevation.replace('±', '').replace('+', '')) || 0
const fmtElev = (v) => (v < 0.005 ? '±0.00' : `+${v.toFixed(2)}`)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export default function EntryStage({ lenis }) {
  const box = useRef(null)
  const stage = useRef(null)
  const world = useRef(null)
  const tilt = useRef(null)
  const master = useRef(null)
  const plate = useRef(null)
  const flash = useRef(null)
  const slices = useRef([])
  const facades = useRef([])
  const interiors = useRef([])
  const D = useRef(null)
  const TL = useRef(null)
  const P = useRef(0)
  const floorRef = useRef(DEFAULT_FLOOR)

  const [floor, setFloor] = useState(DEFAULT_FLOOR)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState('overview') // overview | journey | inside
  const [elev, setElev] = useState('±0.00')
  const [hover, setHover] = useState(-1)
  const [label, setLabel] = useState(null)

  // ---- boot: the production Director on the production DOM ----
  useLayoutEffect(() => {
    const d = new Director({
      world: world.current, master: master.current, plate: plate.current, flash: flash.current,
      slices: slices.current, facades: facades.current, interiors: interiors.current,
    }, () => {})
    D.current = d

    const apply = (p) => {
      P.current = p
      const tl = TL.current
      if (!tl) return
      const tp = clamp((p - TL_A) / (TL_B - TL_A), 0, 1)
      tl.progress(tp)
      // rooms: the production cross-fade, triggered at a scroll position
      const wantZone = p >= ZONE_AT ? FLOORS[floorRef.current].zones.length - 1 : 0
      if (d.zone !== wantZone) { d.mode = 'floor'; d.setZone(wantZone) }
      d.mode = tp >= 1 ? 'floor' : 'moving'
      let s = 0
      BOUNDS.forEach((b, i) => { if (p >= b) s = i })
      setStep(s)
      setPhase(p < 0.004 ? 'overview' : tp < 1 ? 'journey' : 'inside')
      const e = elevNum(floorRef.current) * gsap.parseEase('power2.inOut')(clamp(tp / 0.31, 0, 1))
      setElev(fmtElev(e))
    }
    D.current.apply = apply

    const build = (f) => {
      const old = TL.current
      if (old) { old.progress(0); old.kill() }
      d.layout()
      gsap.set(d.els.world, d.camProps(d.L))
      gsap.set([...d.els.facades, ...d.els.interiors], { opacity: 0 })
      d.active = f
      d.zone = 0
      d.resetZones(f)
      d.preloadFloor(f)
      TL.current = d.buildEnter(f)
      TL.current.pause()
      apply(P.current)
    }
    D.current.build = build
    build(floorRef.current)

    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500))
    idle(() => d.preloadAllFacades())

    // the production entrance: the world resolves out of a soft blur
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) {
      gsap.fromTo(tilt.current, { opacity: 0, scale: 1.06, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 2.2, ease: 'power3.out', delay: 0.35, transformOrigin: '60% 60%', clearProps: 'filter' })
      gsap.fromTo('.cs-hero-title .ch', { yPercent: 105 }, { yPercent: 0, duration: 1.5, ease: 'power4.out', stagger: 0.06, delay: 0.15 })
      gsap.fromTo('.cs-hero .fx', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', stagger: 0.12, delay: 0.9 })
    }

    const st = ScrollTrigger.create({
      trigger: box.current, start: 'top top', end: () => `+=${window.innerHeight * 4.5}`,
      onUpdate: (self) => apply(self.progress),
      invalidateOnRefresh: true,
    })
    let rw = window.innerWidth, rh = window.innerHeight
    const onR = () => {
      // ignore mobile toolbar height changes; rebuild the camera only on real resizes
      if (Math.abs(window.innerWidth - rw) < 2 && Math.abs(window.innerHeight - rh) < 120) return
      rw = window.innerWidth; rh = window.innerHeight
      build(floorRef.current)
    }
    window.addEventListener('resize', onR)
    return () => { st.kill(); window.removeEventListener('resize', onR); TL.current?.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- overview: hover lights a floor, click chooses the level the journey enters ----
  const hitTest = (e) => {
    const d = D.current
    if (!d || P.current > 0.004) return -1
    const r = stage.current.getBoundingClientRect()
    const p = toImage(d.L, e.clientX - r.left, e.clientY - r.top)
    return FLOORS.findIndex((f) => p.x >= f.slice.x && p.x <= f.slice.x + f.slice.w && p.y >= f.slice.y && p.y <= f.slice.y + f.slice.h)
  }
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const i = hitTest(e)
    setHover(i)
    if (i >= 0) {
      const d = D.current
      const s = FLOORS[i].slice
      const a = toScreen(d.L, s.x + s.w, s.y + s.h / 2)
      setLabel({ x: a.x, y: a.y })
      d.preloadFloor(i)
    }
  }
  const choose = (i) => {
    if (i < 0) return
    if (i !== floorRef.current) {
      floorRef.current = i
      setFloor(i)
      D.current.build(i)
    }
    setHover(-1)
    const top = box.current.getBoundingClientRect().top + window.scrollY
    lenis?.scrollTo(top + window.innerHeight * 4.5 * 0.7, { duration: 3.2, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) })
  }
  const onClick = (e) => {
    if (e.target.closest('button, a')) return
    choose(hitTest(e))
  }
  useEffect(() => { if (phase !== 'overview') setHover(-1) }, [phase])

  const fl = FLOORS[floor]
  const hv = hover >= 0 ? FLOORS[hover] : null

  return (
    <div className="cs-entry" ref={box} data-chapter="00 — Arrival" data-theme="dark">
      <section ref={stage}
        className={`stage cs-stage ${phase === 'overview' ? 'mode-overview' : ''} ${step >= 3 ? 'ui-floor' : ''} ${hover >= 0 ? 'has-hover' : ''} is-${phase}`}
        onPointerMove={onMove} onPointerLeave={() => setHover(-1)} onClick={onClick}
        aria-label="STRATA — the production camera, driven by scroll">
        <div className="stage-sky" />
        <div className="tilt" ref={tilt}>
          <div className="world" ref={world} style={{ width: MASTER.w, height: MASTER.h }}>
            <img ref={plate} className="plate" src={img('plate', 900)} alt="" />
            <img ref={master} className="master" alt="STRATA — a seven-level residential building on the Ķīpsala riverbank at dusk"
              src={img('hero', 2688)} srcSet={`${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w`}
              sizes="(max-width: 760px) 140vw, 120vw" fetchPriority="high" />
            {FLOORS.map((f, i) => (
              <img key={f.id} ref={(el) => (slices.current[i] = el)} className="slice" alt=""
                src={`/img/slice-${f.id}.webp`} style={{ left: f.slice.x, top: f.slice.y, width: f.slice.w, height: f.slice.h }} />
            ))}
            {/* hover spotlight: a separate copy of the slice, so it never fights the camera timeline */}
            {FLOORS.map((f, i) => (
              <img key={`h${f.id}`} className={`cs-hl ${hover === i ? 'on' : ''}`} alt=""
                src={`/img/slice-${f.id}.webp`} style={{ left: f.slice.x, top: f.slice.y, width: f.slice.w, height: f.slice.h }} />
            ))}
            <svg className="floors" viewBox={`0 0 ${MASTER.w} ${MASTER.h}`} aria-hidden="true">
              {FLOORS.map((f, i) => (
                <g key={f.id} className={`floor-hit ${hover === i ? 'is-on' : ''}`}>
                  <rect x={f.slice.x} y={f.slice.y} width={f.slice.w} height={f.slice.h} className="floor-fill" />
                  <rect x={f.slice.x} y={f.slice.y} width={f.slice.w} height={f.slice.h} className="floor-line" pathLength="1" />
                  <line x1={f.slice.x - 40} x2={f.slice.x - 4} y1={f.slice.y + f.slice.h} y2={f.slice.y + f.slice.h} className="floor-tick" />
                </g>
              ))}
            </svg>
          </div>
        </div>
        <div className="layer facades">
          {FLOORS.map((f, i) => (
            <img key={f.id} ref={(el) => (facades.current[i] = el)} className="facade" alt=""
              data-src={img(f.facade)} data-srcset={srcset(f.facade)} sizes="100vw" />
          ))}
        </div>
        <div className="layer interiors">
          {FLOORS.map((f, i) => (
            <div key={f.id} className="interior" ref={(el) => (interiors.current[i] = el)}>
              {f.zones.map((z) => (
                <img key={z.id} alt={`${f.name} — ${z.name}`} data-src={img(z.img)} data-srcset={srcset(z.img)} sizes="100vw" />
              ))}
            </div>
          ))}
        </div>
        <div className="mist" aria-hidden="true"><i /><i /><i /></div>
        <div className="flash" ref={flash} />
        <div className="scrim" />
        <div className="grain" />

        {/* ---- opening titles ---- */}
        <div className="cs-hero">
          <p className="mono fx cs-hero-k"><span>Case study</span><span>Residential digital experience</span></p>
          <h1 className="cs-hero-title" aria-label="STRATA">
            {'STRATA'.split('').map((c, i) => <span className="cl" key={i}><span className="ch">{c}</span></span>)}
          </h1>
          <p className="mono fx cs-hero-sub"><span>Residences</span><span>Ķīpsala, Riga</span></p>
        </div>
        <div className="cs-cue mono">
          <span className="cs-cue-line" />
          <span>Scroll to enter Level {fl.label}</span>
          <span className="cs-cue-alt">— or choose any floor</span>
        </div>

        {hv && label && (
          <div className="cs-flabel" style={{ left: label.x, top: label.y }} key={hv.id}>
            <span className="cs-flabel-line" />
            <span className="cs-flabel-card">
              <b className="serif">{hv.label}</b>
              <span>{hv.name}</span>
              <span className="mono">{hv.hour} · {hv.light}</span>
              <span className="mono cs-flabel-go">Click to enter →</span>
            </span>
          </div>
        )}

        {/* ---- journey UI ---- */}
        <ol className="cs-rail mono" aria-hidden={phase === 'overview'}>
          {STEPS.map((s, i) => (
            <li key={s.k} className={i === step ? 'on' : i < step ? 'past' : ''}>
              <span>{String(i + 1).padStart(2, '0')}</span><span>{s.k}</span>
            </li>
          ))}
        </ol>
        <div className="cs-cap" key={step} aria-live="polite">
          <p className="mono cs-cap-k"><span>{String(step + 1).padStart(2, '0')} / 05</span><span>{STEPS[step].k}</span></p>
          <p className="serif cs-cap-t">{STEPS[step].t}</p>
        </div>
        <div className="cs-meta mono">
          <span>Level {fl.label} · {fl.name}</span>
          <span><em>Elev.</em> {elev} m</span>
          <span>{fl.hour} · {fl.light}</span>
        </div>
        <p className="cs-tag mono">Production camera · scrubbed by scroll</p>
      </section>
    </div>
  )
}
