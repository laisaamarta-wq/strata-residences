import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLOORS, MASTER, BUILDING_BOX as BB, img } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

/*
 * 00 — Opening.
 * The building is laid down the way it is named: in strata. The empty riverbank
 * (the production plate), then the seven floor slices of the production stage
 * settle one on top of the other, ground floor first, while a single slow camera
 * approaches. The full photograph resolves over the stack, Level 04 is drawn,
 * and one sentence states the idea. The entry itself is left to the next scene.
 *
 * Time drives the loop; scroll drives the push that carries it into the case study.
 */

const LOOP = 11.4
const FOCUS = { x: BB.x + BB.w / 2, y: 640 } // between the building's centre and Level 04
const F04 = FLOORS[4]

function cams(vw, vh) {
  const portrait = vw / vh < 0.9
  const cover = Math.max(vw / MASTER.w, vh / MASTER.h)
  // wide: the whole riverbank; portrait screens keep the whole building in frame
  const s0 = portrait ? (vw * 0.98) / BB.w : Math.max(cover, (vh * 0.6) / BB.h)
  const s1 = s0 * (portrait ? 1.16 : 1.34)
  const place = (s, fy) => {
    let x = vw / 2 - FOCUS.x * s
    let y = vh * fy - FOCUS.y * s
    if (!portrait) x = Math.min(0, Math.max(vw - MASTER.w * s, x))
    if (y + MASTER.h * s < vh) y = vh - MASTER.h * s
    if (!portrait && y > 0) y = 0
    return { s, x, y }
  }
  return [place(s0, portrait ? 0.56 : 0.5), place(s1, portrait ? 0.5 : 0.47)]
}

export default function Opening() {
  const root = useRef(null)
  const push = useRef(null)
  const world = useRef(null)
  const veil = useRef(null)
  const title = useRef(null)
  const meter = useRef(null)
  const master = useRef(null)
  const slices = useRef([])
  const line = useRef(null)
  const fill = useRef(null)
  const end = useRef(null)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cam = { k: 0 }
    let C = cams(window.innerWidth, window.innerHeight)
    const lerp = (a, b, t) => a + (b - a) * t
    const put = () => {
      const [a, b] = C, t = cam.k
      const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)) // constant perceived speed
      gsap.set(world.current, { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), scale: s, transformOrigin: '0 0' })
    }
    const setMeter = (i) => { if (meter.current) meter.current.textContent = `${FLOORS[i].label} · ${FLOORS[i].elevation} m` }

    const tl = gsap.timeline({ repeat: reduce ? 0 : -1, defaults: { overwrite: false } })
    // initial state of every loop
    tl.set(veil.current, { opacity: 1 }, 0)
      .set(title.current, { opacity: 0, filter: 'blur(14px)', letterSpacing: '0.7em', y: 0 }, 0)
      .set(slices.current, { opacity: 0, y: -70, filter: 'blur(5px)' }, 0)
      .set(master.current, { opacity: 0 }, 0)
      .set(line.current, { strokeDashoffset: 1 }, 0)
      .set(fill.current, { opacity: 0 }, 0)
      .set(end.current.children, { opacity: 0, y: 18 }, 0)
      .set(meter.current, { opacity: 0 }, 0)
      .set(cam, { k: 0, onComplete: put }, 0)

    // the name first, on black
    tl.to(title.current, { opacity: 1, filter: 'blur(0px)', letterSpacing: '0.46em', duration: 1.5, ease: 'power3.out' }, 0.25)
    // the riverbank, empty, and the camera begins to move
    tl.to(veil.current, { opacity: 0, duration: 1.9, ease: 'sine.inOut' }, 1.0)
    tl.to(cam, { k: 1, duration: 8.6, ease: 'sine.inOut', onUpdate: put }, 1.1)
    tl.to(title.current, { opacity: 0, filter: 'blur(10px)', letterSpacing: '0.62em', y: -16, duration: 1.1, ease: 'power2.in' }, 2.45)
    // strata: seven slabs settle, ground floor first
    tl.to(meter.current, { opacity: 0.8, duration: 0.6 }, 2.7)
    slices.current.forEach((el, i) => {
      const t = 2.75 + i * 0.36
      tl.to(el, { y: 0, duration: 1.15, ease: 'power3.out' }, t)
        .to(el, { opacity: 1, duration: 0.55, ease: 'power1.out' }, t)
        .to(el, { filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, t)
        .call(setMeter, [i], t)
    })
    // the photograph resolves over the stack — reflections, light, the whole site
    tl.to(master.current, { opacity: 1, duration: 1.3, ease: 'sine.inOut' }, 5.55)
    tl.to(meter.current, { opacity: 0, duration: 0.6 }, 5.9)
    // Level 04 is drawn: this is where the visitor will go in
    tl.to(line.current, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, 6.3)
    tl.to(fill.current, { opacity: 0.1, duration: 1.2, ease: 'sine.inOut' }, 6.5)
    tl.to(end.current.children, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.14 }, 6.7)
    // close the loop on black
    tl.to(veil.current, { opacity: 1, duration: 0.9, ease: 'power2.in' }, LOOP - 1.0)
    tl.set({}, {}, LOOP)
    if (reduce) tl.progress(0.82).pause()

    // pause the loop when the opening is off screen
    const io = new IntersectionObserver(([e]) => { if (reduce) return; e.isIntersecting ? tl.play() : tl.pause() })
    io.observe(root.current)

    // scroll carries the camera on: it keeps pushing toward Level 04 while the
    // next scene slides over it — one movement, not a cut
    const st = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.9 } })
    st.fromTo(push.current, { scale: 1, yPercent: 0 }, { scale: 1.42, yPercent: 4, ease: 'power1.in', transformOrigin: '50% 44%' }, 0)
    st.fromTo(root.current.querySelector('.cs-op-dim'), { opacity: 0 }, { opacity: 0.6, ease: 'power1.in' }, 0)
    st.fromTo(end.current, { yPercent: 0 }, { yPercent: -40, ease: 'none' }, 0)

    let rw = window.innerWidth
    const onR = () => {
      if (Math.abs(window.innerWidth - rw) < 2) return
      rw = window.innerWidth
      C = cams(window.innerWidth, window.innerHeight); put()
    }
    window.addEventListener('resize', onR)
    return () => { tl.kill(); st.scrollTrigger?.kill(); st.kill(); io.disconnect(); window.removeEventListener('resize', onR) }
  }, [])

  const s = F04.slice
  return (
    <section className="cs-op" ref={root} data-chapter="00 — Arrival">
      <div className="cs-op-sticky">
        <div className="cs-op-push" ref={push}>
          <div className="cs-op-sky" />
          <div className="cs-op-world" ref={world} style={{ width: MASTER.w, height: MASTER.h }}>
            <img className="cs-op-plate" src={img('plate', 1600)} alt="" />
            {FLOORS.map((f, i) => (
              <img key={f.id} ref={(el) => (slices.current[i] = el)} className="cs-op-slice" alt="" src={`/img/slice-${f.id}.webp`}
                style={{ left: f.slice.x, top: f.slice.y, width: f.slice.w, height: f.slice.h }} />
            ))}
            <img ref={master} className="cs-op-master" src={img('hero', 2688)} alt="STRATA — seven levels on the Ķīpsala riverbank at dusk" />
            <svg className="cs-op-floor" viewBox={`0 0 ${MASTER.w} ${MASTER.h}`} aria-hidden="true">
              <rect ref={fill} x={s.x} y={s.y} width={s.w} height={s.h} className="cs-op-fill" />
              <rect ref={line} x={s.x} y={s.y} width={s.w} height={s.h} className="cs-op-line" pathLength="1" />
            </svg>
          </div>
        </div>
        <div className="cs-op-shade" />
        <div className="cs-op-dim" />
        <div className="cs-op-veil" ref={veil} />
        <h1 className="wordmark cs-op-title" ref={title}>STRATA</h1>
        <p className="mono cs-op-meter" ref={meter} aria-hidden="true" />
        <div className="cs-op-end" ref={end}>
          <p className="wordmark cs-op-mark">STRATA</p>
          <p className="serif cs-op-line1">A residence you enter,<br /><em>floor by floor.</em></p>
          <p className="mono cs-op-sub"><span>Immersive architectural digital experience</span><span>Ķīpsala, Riga</span></p>
        </div>
        <div className="cs-op-cue mono"><span className="cs-cue-line" />Scroll</div>
      </div>
    </section>
  )
}
