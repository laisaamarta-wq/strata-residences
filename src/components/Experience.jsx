import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { FLOORS, MASTER, img, srcset } from '../data.js'
import { Director } from '../engine/director.js'
import { toImage, toScreen, isMobile } from '../engine/camera.js'
import Plan from './Plan.jsx'

const VIEWS = [
  { id: 'space', label: '3D Space' },
  { id: 'plan', label: 'Floor plan' },
  { id: 'details', label: 'Details' },
]

export default function Experience({ tourDone, onTourEnd, onSkip, lenis, directorRef }) {
  const stageRef = useRef(null)
  const worldRef = useRef(null)
  const tiltRef = useRef(null)
  const masterRef = useRef(null)
  const plateRef = useRef(null)
  const glowRef = useRef(null)
  const flashRef = useRef(null)
  const lightRef = useRef(null)
  const sliceRefs = useRef([])
  const facadeRefs = useRef([])
  const interiorRefs = useRef([])
  const dir = useRef(null)

  const [st, setSt] = useState({ mode: 'overview', active: -1, zone: 0, L: null })
  const [ui, setUi] = useState('overview') // overview | out | floor
  const [hover, setHover] = useState(-1)
  const [preview, setPreview] = useState(-1)
  const [view, setView] = useState('space')
  const [night, setNight] = useState(false)
  const [passing, setPassing] = useState(null)
  const [vp, setVp] = useState({ w: 1440, h: 900 })
  const shown = hover >= 0 ? hover : preview
  const tourDoneRef = useRef(tourDone)
  tourDoneRef.current = tourDone

  const onState = useCallback((s) => {
    if (s.phase) {
      if (s.phase === 'leaving-overview') { setUi('out'); setHover(-1); setPreview(-1) }
      if (s.phase === 'floor-ui') { setUi('floor'); setPassing(null) }
      if (s.phase === 'leaving-floor' || s.phase === 'elevator') { setUi('out'); setView('space') }
      if (s.phase === 'overview-ui') setUi('overview')
      if (s.phase === 'elevator-pass') setPassing(s.at)
      return
    }
    setSt({ ...s })
  }, [])

  // ---- boot the director ----
  useLayoutEffect(() => {
    const d = new Director({
      world: worldRef.current, master: masterRef.current, plate: plateRef.current, glow: glowRef.current,
      flash: flashRef.current, slices: sliceRefs.current, facades: facadeRefs.current, interiors: interiorRefs.current,
    }, onState)
    dir.current = d
    directorRef.current = d
    d.emit()
    setVp({ w: window.innerWidth, h: window.innerHeight })
    const onR = () => { setVp({ w: window.innerWidth, h: window.innerHeight }); d.resize() }
    window.addEventListener('resize', onR)
    document.fonts?.ready.then(() => d.resize())
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500))
    idle(() => d.preloadAllFacades())
    // entrance
    gsap.fromTo(worldRef.current.parentElement, { opacity: 0, scale: 1.06, filter: 'blur(10px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 2.2, ease: 'power3.out', delay: 0.1, transformOrigin: '60% 60%' })
    return () => window.removeEventListener('resize', onR)
  }, [onState, directorRef])

  // ---- lock page scroll while the tour owns the wheel ----
  const tourOwnsScroll = st.mode !== 'overview' || !tourDone
  useEffect(() => {
    if (!lenis) return
    if (tourOwnsScroll && window.scrollY < 8) lenis.stop()
    else lenis.start()
  }, [tourOwnsScroll, lenis])

  // ---- wheel / touch / keys = camera navigation ----
  useEffect(() => {
    let acc = 0, accT = 0, coolUntil = 0, touchY = null
    const d = () => dir.current
    const owns = () => window.scrollY < 8 && (d().mode !== 'overview' || !tourDoneRef.current)
    const step = (down) => {
      const D = d()
      if (D.mode === 'moving' || performance.now() < coolUntil) return
      coolUntil = performance.now() + 900
      if (down) {
        const moved = D.next()
        if (!moved && D.mode === 'floor') {
          // past the penthouse: pull back out to the whole building, then continue down the page
          D.back()
          const wait = () => (D.mode === 'overview' ? onTourEnd() : setTimeout(wait, 120))
          setTimeout(wait, 400)
        }
      } else D.prev()
    }
    const onWheel = (e) => {
      if (!owns()) return
      e.preventDefault()
      const now = performance.now()
      if (now - accT > 220) acc = 0
      accT = now
      acc += e.deltaY
      if (Math.abs(acc) > 28) { step(acc > 0); acc = 0 }
    }
    const onTS = (e) => { touchY = e.touches[0].clientY }
    const onTM = (e) => { if (owns() && e.cancelable) e.preventDefault() }
    const onTE = (e) => {
      if (touchY === null || !owns()) return
      const dy = touchY - e.changedTouches[0].clientY
      touchY = null
      if (Math.abs(dy) > 42) step(dy > 0)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { d().back(); return }
      if (!owns()) return
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(true) }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); step(false) }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTS, { passive: true })
    window.addEventListener('touchmove', onTM, { passive: false })
    window.addEventListener('touchend', onTE)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTS)
      window.removeEventListener('touchmove', onTM)
      window.removeEventListener('touchend', onTE)
      window.removeEventListener('keydown', onKey)
    }
  }, [onTourEnd])

  // ---- hover: floors light up, the building leans toward the cursor ----
  useEffect(() => {
    const stage = stageRef.current
    const rx = gsap.quickTo(tiltRef.current, 'rotationY', { duration: 1.2, ease: 'power3.out' })
    const ry = gsap.quickTo(tiltRef.current, 'rotationX', { duration: 1.2, ease: 'power3.out' })
    const lx = gsap.quickTo(lightRef.current, 'x', { duration: 0.8, ease: 'power3.out' })
    const ly = gsap.quickTo(lightRef.current, 'y', { duration: 0.8, ease: 'power3.out' })
    const onMove = (e) => {
      const D = dir.current
      lx(e.clientX); ly(e.clientY)
      if (e.pointerType !== 'mouse') return
      const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5
      if (D.mode === 'overview') { rx(nx * 3.2); ry(-ny * 2) } else { rx(0); ry(0) }
      if (D.mode !== 'overview') return
      const p = toImage(D.L, e.clientX, e.clientY)
      const i = FLOORS.findIndex((f) => p.x >= f.slice.x && p.x <= f.slice.x + f.slice.w && p.y >= f.slice.y && p.y <= f.slice.y + f.slice.h)
      setHover((h) => (h === i ? h : i))
      if (i >= 0) D.preloadFloor(i)
    }
    stage.addEventListener('pointermove', onMove)
    return () => stage.removeEventListener('pointermove', onMove)
  }, [])

  // spotlight: the hovered floor stays lit while the rest of the scene dims
  useEffect(() => {
    const D = dir.current
    if (!D || D.mode !== 'overview') return
    sliceRefs.current.forEach((el, i) => {
      gsap.to(el, { opacity: i === shown ? 1 : 0, filter: i === shown ? 'brightness(1.12)' : 'brightness(1)', duration: 0.7, ease: 'power2.out', overwrite: 'auto' })
    })
  }, [shown])

  const onStageClick = (e) => {
    const D = dir.current
    if (D.mode !== 'overview') return
    if (e.target.closest('button, a, .ui-block')) return
    const p = toImage(D.L, e.clientX, e.clientY)
    const i = FLOORS.findIndex((f) => p.x >= f.slice.x && p.x <= f.slice.x + f.slice.w && p.y >= f.slice.y && p.y <= f.slice.y + f.slice.h)
    if (i < 0) { setPreview(-1); return }
    const pt = e.nativeEvent.pointerType
    if (pt === 'mouse' || !isMobile(window.innerWidth) || preview === i) D.go(i)
    else { setPreview(i); D.preloadFloor(i) }
  }

  const toggleNight = () => {
    const n = !night
    setNight(n)
    dir.current.setNight(n)
  }

  const L = st.L
  const labelFloor = shown >= 0 ? FLOORS[shown] : null
  let label = null
  if (labelFloor && L) {
    const s = labelFloor.slice
    const a = toScreen(L, s.x + s.w, s.y + s.h / 2)
    const b = toScreen(L, s.x, s.y + s.h / 2)
    const right = vp.w - a.x > 300
    label = { right, x: right ? a.x : b.x, y: a.y }
  }
  const fl = st.active >= 0 ? FLOORS[st.active] : null
  const selFloor = passing ?? (st.active >= 0 ? st.active : hover)
  const elevation = selFloor >= 0 ? FLOORS[selFloor].elevation : '±0.00'

  return (
    <section id="project" ref={stageRef}
      className={`stage ui-${ui} mode-${st.mode} view-${view} ${night ? 'is-night' : ''} ${shown >= 0 ? 'has-hover' : ''}`}
      onClick={onStageClick}>
      <div className="stage-sky" />
      <div className="tilt" ref={tiltRef}>
        <div className="world" ref={worldRef} style={{ width: MASTER.w, height: MASTER.h }}>
          <img ref={plateRef} className="plate" src={img('plate', 900)} alt="" />
          <img ref={masterRef} className="master" alt="STRATA — a seven-level residential building on the Ķīpsala riverbank at dusk"
            src={img('hero', 2688)} srcSet={`${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w`}
            sizes="(max-width: 760px) 140vw, 120vw" fetchPriority="high" />
          {FLOORS.map((f, i) => (
            <img key={f.id} ref={(el) => (sliceRefs.current[i] = el)} className="slice" alt=""
              src={`/img/slice-${f.id}.webp`} loading="eager"
              style={{ left: f.slice.x, top: f.slice.y, width: f.slice.w, height: f.slice.h }} />
          ))}
          <div className="night" />
          <img ref={glowRef} className="glow" src={img('hero', 1400)} alt="" data-on="0" />
          <svg className="floors" viewBox={`0 0 ${MASTER.w} ${MASTER.h}`} aria-hidden="true">
            {FLOORS.map((f, i) => (
              <g key={f.id} className={`floor-hit ${shown === i ? 'is-on' : ''} ${st.active === i ? 'is-active' : ''}`}>
                <rect {...rectOf(f.slice)} className="floor-fill" />
                <rect {...rectOf(f.slice)} className="floor-line" pathLength="1" />
                <line x1={f.slice.x - 40} x2={f.slice.x - 4} y1={f.slice.y + f.slice.h} y2={f.slice.y + f.slice.h} className="floor-tick" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* close-ups & interiors (lazy) */}
      <div className="layer facades">
        {FLOORS.map((f, i) => (
          <img key={f.id} ref={(el) => (facadeRefs.current[i] = el)} className="facade" alt={`${f.name} — facade`}
            data-src={img(f.facade)} data-srcset={srcset(f.facade)} sizes="100vw" />
        ))}
      </div>
      <div className="layer interiors">
        {FLOORS.map((f, i) => (
          <div key={f.id} className="interior" ref={(el) => (interiorRefs.current[i] = el)}>
            {f.zones.map((z) => (
              <img key={z.id} alt={`${f.name} — ${z.name}`} data-src={img(z.img)} data-srcset={srcset(z.img)} sizes="100vw" />
            ))}
          </div>
        ))}
      </div>
      <div className="mist" aria-hidden="true"><i /><i /><i /></div>
      <div className="flash" ref={flashRef} />
      <div className="scrim" />
      <div className="cursor-light" ref={lightRef} />
      <div className="grain" />

      {/* ---------------- OVERVIEW UI ---------------- */}
      <div className="hero-ui">
        <p className="eyebrow r1"><span>Ķīpsala · Riga</span><span>Seven levels · Fifteen residences</span></p>
        <h1 className="hero-title r2">
          <span className="ln"><span>A new way</span></span>
          <span className="ln"><span><em>of</em> living.</span></span>
        </h1>
        <p className="hero-copy r3">
          Seven strata of stone, glass and light on the riverbank — each level tuned to a different hour of the day.
          Touch a floor to step inside.
        </p>
        <div className="hero-meta r4 mono">
          <span>56°57′11″ N</span><span>24°05′06″ E</span><span>Completion Q4 2028</span>
        </div>
      </div>

      {label && (
        <div className={`floor-label ${label.right ? 'is-right' : 'is-left'}`} style={{ left: label.x, top: label.y }} key={labelFloor.id}>
          <span className="fl-line" />
          <div className="fl-card ui-block">
            <span className="fl-num serif">{labelFloor.label}</span>
            <span className="fl-name">{labelFloor.name}</span>
            <span className="fl-teaser mono">{labelFloor.teaser}</span>
            <span className="fl-hour mono">{labelFloor.hour} · {labelFloor.light}</span>
            {preview >= 0 && (
              <button className="fl-enter" onClick={(e) => { e.stopPropagation(); dir.current.go(preview) }}>Enter level →</button>
            )}
          </div>
        </div>
      )}

      <div className="scroll-cue mono">
        <span className="cue-line" />
        <span>{tourDone ? 'Scroll to continue' : 'Scroll to explore'}</span>
        <button className="skip" onClick={(e) => { e.stopPropagation(); onSkip() }}>Skip to the story ↓</button>
      </div>

      <button className="light-toggle mono ui-block" onClick={(e) => { e.stopPropagation(); toggleNight() }} aria-pressed={night}>
        <span className={!night ? 'on' : ''}>Dusk</span><i /><span className={night ? 'on' : ''}>Night</span>
      </button>

      {/* ---------------- FLOOR SELECTOR (synced with camera) ---------------- */}
      <nav className="selector ui-block" aria-label="Floors">
        <span className="sel-cap mono">Level</span>
        <ol>
          {[...FLOORS].map((f, i) => ({ f, i })).reverse().map(({ f, i }) => (
            <li key={f.id}>
              <button
                className={`${selFloor === i ? 'is-active' : ''} ${hover === i && st.mode === 'overview' ? 'is-hover' : ''}`}
                onMouseEnter={() => { if (st.mode === 'overview') setHover(i); dir.current?.preloadFloor(i) }}
                onMouseLeave={() => st.mode === 'overview' && setHover(-1)}
                onClick={(e) => { e.stopPropagation(); dir.current.go(i) }}
                aria-current={st.active === i ? 'true' : undefined}>
                <span className="sel-num mono">{f.label}</span>
                <span className="sel-bar" />
                <span className="sel-name">{f.name}</span>
              </button>
            </li>
          ))}
        </ol>
        <span className="sel-elev mono"><em>Elev.</em> {elevation} m</span>
      </nav>

      {/* ---------------- FLOOR UI ---------------- */}
      {fl && (
        <div className="floor-ui" key={fl.id}>
          <button className="back mono ui-block" onClick={(e) => { e.stopPropagation(); dir.current.back() }}>
            <span className="back-arrow">←</span> The building
          </button>

          <div className="floor-head">
            <p className="mono f1"><span>Level</span><span>{fl.elevation} m</span><span>{fl.kind}</span></p>
            <div className="floor-num serif f2">{fl.num}</div>
            <h2 className="floor-name serif f3">{fl.name}</h2>
            <p className="mono f4 floor-hour"><span className="sun" />{fl.hour} — {fl.light} · {fl.material}</p>
          </div>

          <dl className="floor-specs f5">
            {fl.specs.slice(0, 6).map(([k, v]) => (
              <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>

          <div className="views ui-block f3" role="tablist">
            {VIEWS.map((v) => (
              <button key={v.id} role="tab" aria-selected={view === v.id} className={view === v.id ? 'on' : ''}
                onClick={(e) => { e.stopPropagation(); setView(v.id) }}>{v.label}</button>
            ))}
            <span className="views-ink" style={{ '--i': VIEWS.findIndex((v) => v.id === view) }} />
          </div>

          <div className="zones ui-block f6">
            {fl.zones.map((z, k) => (
              <button key={z.id} className={st.zone === k ? 'on' : ''}
                onClick={(e) => { e.stopPropagation(); setView('space'); dir.current.setZone(k) }}>
                <span className="mono">{String(k + 1).padStart(2, '0')}</span>{z.name}
                <i />
              </button>
            ))}
          </div>

          <div className="plan-layer ui-block" onClick={(e) => e.stopPropagation()}>
            {view === 'plan' && (
              <div className="plan-wrap">
                <p className="mono plan-cap"><span>Floor plan</span><span>{fl.name}</span><span>Typical residence · not to scale</span></p>
                <Plan floor={fl} zone={st.zone} onZone={(k) => { if (k >= 0) { dir.current.setZone(k); setView('space') } }} />
                <p className="mono plan-hint">Select a highlighted room to step into it</p>
              </div>
            )}
          </div>

          <aside className="details ui-block" onClick={(e) => e.stopPropagation()} aria-hidden={view !== 'details'}>
            <div className="details-in">
              <p className="mono d-kicker">Level {fl.label} · {fl.kind}</p>
              <h3 className="serif">{fl.name}</h3>
              <p className="d-intro">{fl.intro}</p>
              <table className="d-table">
                <tbody>{fl.specs.map(([k, v]) => <tr key={k}><th className="mono">{k}</th><td>{v}</td></tr>)}</tbody>
              </table>
              <p className="mono d-sub">Materials</p>
              <ul className="d-palette">
                {fl.palette.map(([n, c]) => <li key={n}><i style={{ background: c }} />{n}</li>)}
              </ul>
              <p className="mono d-sub">Features</p>
              <ul className="d-features">{fl.features.map((x) => <li key={x}>{x}</li>)}</ul>
              <div className="d-foot">
                <span className="d-price serif">{fl.price}</span>
                <a className="btn" href="#enquire" onClick={() => { dir.current.back() }}>Request a private viewing</a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {passing !== null && <div className="passing serif" key={passing}>{FLOORS[passing].num}</div>}
    </section>
  )
}

const rectOf = (s) => ({ x: s.x, y: s.y, width: s.w, height: s.h })
