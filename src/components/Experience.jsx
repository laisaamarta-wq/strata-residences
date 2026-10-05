import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { FLOORS, MASTER, img, srcset } from '../data.js'
import { Director } from '../engine/director.js'
import { toImage, toScreen, isMobile } from '../engine/camera.js'
import Plan from './Plan.jsx'

const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const VIEWS = [
  { id: 'space', label: '3D Space' },
  { id: 'plan', label: 'Floor plan' },
  { id: 'details', label: 'Details' },
]

export default function Experience({ lenis, directorRef, onGoTo, onUiChange }) {
  const stageRef = useRef(null)
  const worldRef = useRef(null)
  const tiltRef = useRef(null)
  const masterRef = useRef(null)
  const plateRef = useRef(null)
  const flashRef = useRef(null)
  const sliceRefs = useRef([])
  const facadeRefs = useRef([])
  const interiorRefs = useRef([])
  const dir = useRef(null)

  const [st, setSt] = useState({ mode: 'overview', active: -1, zone: 0, L: null })
  const [ui, setUi] = useState('overview') // overview | out | floor
  const [hover, setHover] = useState(-1)
  const [preview, setPreview] = useState(-1)
  const [view, setView] = useState('space')
  const [passing, setPassing] = useState(null)
  const [vp, setVp] = useState({ w: 1440, h: 900 })
  const [introText, setIntroText] = useState(REDUCED)
  const shown = hover >= 0 ? hover : preview

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
      stage: stageRef.current, world: worldRef.current, master: masterRef.current, plate: plateRef.current,
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

    // ---- opening: the building is already there ----
    // No construction on screen. The finished photograph fades up as one architectural
    // shot and the camera settles a few percent, slowly, like a lens finding focus;
    // the headline follows once the building is seen.
    const tilt = worldRef.current.parentElement
    let alive = true
    if (REDUCED) {
      gsap.fromTo(tilt, { opacity: 0 }, { opacity: 1, duration: 0.6 })
    } else {
      gsap.set(tilt, { opacity: 0 })
      const im = masterRef.current
      const ready = im.decode ? im.decode().catch(() => {}) : Promise.resolve()
      const late = new Promise((r) => setTimeout(r, 1400))
      Promise.race([ready, late]).then(() => {
        if (!alive) return
        gsap.fromTo(tilt, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'sine.out' })
        gsap.fromTo(tilt, { scale: 1.03 }, { scale: 1, duration: 5.5, ease: 'sine.out', transformOrigin: '60% 60%' })
        setTimeout(() => alive && setIntroText(true), 700)
      })
    }
    return () => { alive = false; window.removeEventListener('resize', onR) }
  }, [onState, directorRef])

  // ---- mobile approach: the camera is a function of the stage's scroll ----
  // Read once per frame, after the browser has applied the scroll (native touch
  // scrolling and momentum on phones, Lenis on desktop). Progress is measured
  // against the stage's own, stable height — never the window, whose height
  // changes with the browser chrome. At scrollY 0 the progress is exactly 0, so the
  // first frame of the approach is the resting frame.
  useEffect(() => {
    const stage = stageRef.current
    let last = -1, scrolled = false
    const tick = () => {
      const D = dir.current
      if (!D) return
      const y = window.scrollY
      if (y === last) return
      last = y
      D.setScroll(y / stage.clientHeight)
      // a scroll gesture dismisses the floor preview card
      const s = y > 24
      if (s !== scrolled) { scrolled = s; if (s) setPreview(-1) }
    }
    gsap.ticker.add(tick)
    tick()
    return () => gsap.ticker.remove(tick)
  }, [])

  // ---- page scroll ----
  // The page always scrolls normally. Scrolling never selects or enters a floor:
  // only an explicit click does. While a floor is open (full-screen interior),
  // the page is held still, and any scroll gesture simply steps back out to the
  // building, so the visitor is never trapped inside a residence.
  const inside = st.mode !== 'overview'
  useEffect(() => {
    if (!lenis) return
    if (inside) lenis.stop()
    else lenis.start()
  }, [inside, lenis])
  useEffect(() => { onUiChange?.({ inside, details: view === 'details' && ui === 'floor' }) }, [inside, view, ui, onUiChange])

  // Back is progressive: an open panel (plan / details) closes first, then the floor.
  const viewRef = useRef(view)
  viewRef.current = view
  const onGoToRef = useRef(onGoTo)
  onGoToRef.current = onGoTo

  useEffect(() => {
    let acc = 0, accT = 0, touchY = null, coolUntil = 0
    const D = () => dir.current
    // the details sheet has its own scroll and keeps its gestures
    const ownScroll = (t) => t instanceof Element && t.closest('.details-in')
    const exit = () => {
      if (D().mode !== 'floor') return
      if (viewRef.current !== 'space') setView('space')
      else D().back()
    }
    const onWheel = (e) => {
      if (D().mode === 'overview') return // normal page scroll
      if (ownScroll(e.target)) return
      e.preventDefault()
      const now = performance.now()
      if (now - accT > 220) acc = 0
      accT = now
      acc += e.deltaY
      if (Math.abs(acc) > 40) { acc = 0; if (performance.now() > coolUntil) { coolUntil = performance.now() + 700; exit() } }
    }
    // a view change can replace the element under the finger; follow the touch on its target too
    let tgt = null
    const SEEN = Symbol('seen')
    const unhook = () => { if (tgt) { tgt.removeEventListener('touchend', onTE); tgt = null } }
    const onTS = (e) => {
      touchY = ownScroll(e.target) ? null : e.touches[0].clientY
      unhook()
      if (D().mode !== 'overview' && e.target instanceof Element) { tgt = e.target; tgt.addEventListener('touchend', onTE) }
    }
    const onTM = (e) => { if (D().mode !== 'overview' && touchY !== null && e.cancelable) e.preventDefault() }
    function onTE(e) {
      if (e[SEEN]) return
      e[SEEN] = true
      unhook()
      if (touchY === null || D().mode === 'overview') { touchY = null; return }
      const dy = touchY - e.changedTouches[0].clientY
      touchY = null
      // a long swipe down means "move on": out of the residence and on down the page
      if (dy > Math.max(140, window.innerHeight * 0.26) && D().mode === 'floor') { setView('space'); onGoToRef.current?.('#residences'); return }
      if (Math.abs(dy) > 50) exit()
    }
    const onKey = (e) => {
      if (D().mode === 'overview') return
      if (e.key === 'Escape') { exit(); return }
      if (['ArrowDown', 'PageDown', ' ', 'ArrowUp', 'PageUp'].includes(e.key) && !ownScroll(e.target)) { e.preventDefault(); exit() }
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
  }, [])

  // Entering a floor is always an explicit click. If the visitor has scrolled
  // down, glide back to the building first, then start the camera move.
  const enter = useCallback((i) => {
    const D = dir.current
    if (!D) return
    if (window.scrollY > 2 && lenis) lenis.scrollTo(0, { duration: 1.1, onComplete: () => D.go(i) })
    else D.go(i)
  }, [lenis])

  // pointer position in stage coordinates (the stage scrolls with the page)
  const stagePoint = (e) => {
    const r = stageRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // ---- hover: a floor lights up and names itself (the building itself never moves) ----
  useEffect(() => {
    const stage = stageRef.current
    const onMove = (e) => {
      const D = dir.current
      if (e.pointerType !== 'mouse') return
      const sp = stagePoint(e)
      if (D.mode !== 'overview') return
      const p = toImage(D.cam(), sp.x, sp.y)
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
    const sp = stagePoint(e)
    const p = toImage(D.cam(), sp.x, sp.y) // the camera as it is on screen, approach included
    const i = FLOORS.findIndex((f) => p.x >= f.slice.x && p.x <= f.slice.x + f.slice.w && p.y >= f.slice.y && p.y <= f.slice.y + f.slice.h)
    if (i < 0) { setPreview(-1); return }
    const pt = e.nativeEvent.pointerType
    if (pt === 'mouse' || !isMobile(window.innerWidth) || preview === i) enter(i)
    else { setPreview(i); D.preloadFloor(i) }
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
      className={`stage ui-${ui} mode-${st.mode} view-${view} ${shown >= 0 ? 'has-hover' : ''} ${introText ? 'intro-on' : ''}`}
      onClick={onStageClick}>
      <div className="stage-sky" />
      <div className="tilt" ref={tiltRef}>
        <div className="world" ref={worldRef} style={{ width: MASTER.w, height: MASTER.h }}>
          <img ref={plateRef} className="plate" src={img('plate', 900)} srcSet={`${img('plate', 900)} 900w, ${img('plate', 1600)} 1600w`}
            sizes="(max-width: 760px) 140vw, 120vw" alt="" />
          <img ref={masterRef} className="master" alt="STRATA — a seven-level residential building on the Ķīpsala riverbank at dusk"
            src={img('hero', 2688)} srcSet={`${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w`}
            sizes="(max-width: 760px) 140vw, 120vw" fetchPriority="high" />
          {FLOORS.map((f, i) => (
            <img key={f.id} ref={(el) => (sliceRefs.current[i] = el)} className="slice" alt=""
              src={`/img/slice-${f.id}.webp`} loading="eager"
              style={{ left: f.slice.x, top: f.slice.y, width: f.slice.w, height: f.slice.h }} />
          ))}
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
              <button className="fl-enter" onClick={(e) => { e.stopPropagation(); enter(preview) }}>Enter level →</button>
            )}
          </div>
        </div>
      )}

      <div className="scroll-cue mono">
        <span className="cue-line" />
        <span>Scroll to explore</span>
      </div>


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
                onClick={(e) => { e.stopPropagation(); enter(i) }}
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
            <p className="mono f1"><span>Level {fl.label}</span><span>{fl.elevation} m</span><span>{fl.kind}</span></p>
            <div className="floor-num serif f2">{fl.num}</div>
            <h2 className="floor-name serif f3">{fl.name}</h2>
            <p className="mono f4 floor-hour"><span className="sun" />{fl.hour} — {fl.light} · {fl.material}</p>
          </div>

          <dl className="floor-specs f5">
            {fl.specs.slice(0, 6).map(([k, v]) => (
              <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>

          <div className="views ui-block f3" role="tablist" aria-label="Residence view">
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

          <div className="plan-layer ui-block" inert={view !== 'plan' || undefined} onClick={(e) => e.stopPropagation()}>
            {view === 'plan' && (
              <div className="plan-wrap">
                <p className="mono plan-cap"><span>Floor plan</span><span>{fl.name}</span><span>Typical residence · not to scale</span></p>
                <Plan floor={fl} zone={st.zone} onZone={(k) => { if (k >= 0) { dir.current.setZone(k); setView('space') } }} />
                <p className="mono plan-hint">Select a highlighted room to step into it</p>
              </div>
            )}
          </div>

          <aside className="details ui-block" onClick={(e) => e.stopPropagation()} aria-label={`${fl.name} — details`}
            aria-hidden={view !== 'details'} inert={view !== 'details' || undefined}>
            <div className="details-in" data-lenis-prevent>
              <div className="d-top" style={{ '--d': 0 }}>
                <p className="mono d-kicker">Level {fl.label} · {fl.kind}</p>
                <button className="d-close mono" onClick={() => setView('space')} aria-label="Close details">Close <i aria-hidden="true" /></button>
              </div>
              <h3 className="serif" style={{ '--d': 1 }}>{fl.name}</h3>
              <p className="d-intro" style={{ '--d': 2 }}>{fl.intro}</p>
              <dl className="d-key" style={{ '--d': 3 }}>
                {fl.specs.slice(0, 3).map(([k, v]) => (
                  <div key={k}><dt className="mono">{k}</dt><dd className={`serif ${String(v).length > 8 ? 'is-long' : ''}`}>{v}</dd></div>
                ))}
              </dl>
              <dl className="d-rows" style={{ '--d': 4 }}>
                {fl.specs.slice(3).map(([k, v]) => (
                  <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              <div className="d-block" style={{ '--d': 5 }}>
                <p className="mono d-sub">Materials</p>
                <ul className="d-palette">
                  {fl.palette.map(([n, c]) => <li key={n}><i style={{ background: c }} />{n}</li>)}
                </ul>
              </div>
              <div className="d-block" style={{ '--d': 6 }}>
                <p className="mono d-sub">Features</p>
                <ul className="d-features">{fl.features.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <div className="d-foot" style={{ '--d': 7 }}>
                <div><p className="mono d-sub">{fl.id === 'g' ? 'Access' : 'Price'}</p><span className="d-price serif">{fl.price}</span></div>
                <a className="btn" href="#enquire" onClick={(e) => { e.preventDefault(); onGoTo('#enquire') }}>Request a private viewing <span className="btn-arrow" aria-hidden="true">→</span></a>
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
