import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLOORS, MASTER, img, srcset } from '../data.js'
import { useStepper, STEP_EASE } from '../engine/stepper.js'

gsap.registerPlugin(ScrollTrigger)

/*
 * 03 — Architecture: read the building, layer by layer.
 * The Behind the Case logic brought to the site itself: one held frame, a camera that
 * moves over the real photograph, and at every stop a question the architecture answers.
 * The layer in question lifts out of a darkened building (the same slices that drive the
 * stage), and a photograph opens beside it like a floor slab.
 * One gesture moves one layer, always at the same calm pace (engine/stepper.js);
 * the rail is a shortcut to any layer.
 */

const LAYERS = [
  { k: 'Site', q: 'Why the riverbank?',
    a: 'Ķīpsala faces the Old Town across the Daugava. Studio Ainava’s brief was a single sentence: make a house for the river, not a tower above it.',
    facts: [['Old Town', '1.2 km'], ['Levels', '7'], ['Height', '24.6 m']],
    cam: { x: 0, y: 0, w: MASTER.w, h: MASTER.h }, hl: [], ev: { im: '04-view', c: 'The view it was built for' } },
  { k: 'Landscape', q: 'Why a grove, not a plaza?',
    a: 'The building steps back behind 1,400 m² of birch, fern and meadow grass. A long reflecting pool doubles it at dusk and collects the rain from its roofs.',
    facts: [['Garden', '1,400 m²'], ['Birches', '62'], ['Pool', '48 m']],
    cam: { x: 540, y: 1040, w: 1300, h: 480 }, hl: [], ev: { im: 'landscape', c: 'Birch grove · reflecting pool' } },
  { k: 'Plinth', q: 'Why basalt at the water?',
    a: 'The ground floor takes the river wind, the spray and every hand. Basalt, the darkest and heaviest stone of the palette, anchors six floors of travertine and glass.',
    facts: [['Stone', 'Basalt'], ['Hall', 'Double height'], ['Height', '±0.00 m']],
    cam: { x: 820, y: 1000, w: 1020, h: 380 }, hl: [0], ev: { im: 'facade-g', c: 'The plinth · basalt and bronze' } },
  { k: 'Volume', q: 'Why seven slabs, out of step?',
    a: 'Each floor plate cantilevers up to 2.4 m and shifts slightly from the one below, like layers of sediment. The deep edges shade the glass in summer and let the low winter sun in.',
    facts: [['Levels', '7'], ['Slab depth', '2.40 m'], ['Height', '24.6 m']],
    cam: { x: 740, y: 150, w: 1180, h: 1200 }, hl: [0, 1, 2, 3, 4, 5, 6], ev: { im: 'detail', c: 'Slab edges · deep shade' } },
  { k: 'Facade', q: 'Why travertine and bronze?',
    a: 'Honed travertine on every slab edge, untreated bronze fins that weather to a soft brown. Nothing is painted; everything is allowed to age.',
    facts: [['Stone', 'Travertine'], ['Metal', 'Bronze, untreated'], ['Inside', 'Oak, lime plaster']],
    cam: { x: 1150, y: 330, w: 680, h: 500 }, hl: [], ev: { im: 'materials', c: 'The sample board' } },
  { k: 'Interior', q: 'Why glass to the floor?',
    a: 'Ceilings are 3.1 m and the corners are frameless, so the river and the Old Town become part of the room — on Level 04 from both sides of the bed.',
    facts: [['Glazing', 'Floor to ceiling'], ['Ceiling', '3.1 m'], ['Aspect', 'Dual / corner']],
    cam: { x: 860, y: 480, w: 940, h: 270 }, hl: [4], ev: { im: '04-bedroom', c: 'Level 04 · Walnut Residences' } },
  { k: 'Sky', q: 'Why a pavilion on the roof?',
    a: 'The last level steps back from the edge and becomes a glass pavilion among pines. Its planted roof slows storm water; heat comes from the ground beneath the garden.',
    facts: [['Energy', 'Class A · NZEB'], ['Heating', 'Ground source'], ['Target', 'BREEAM Excellent']],
    cam: { x: 820, y: 130, w: 1020, h: 440 }, hl: [6], ev: { im: 'ph-pool', c: 'The pavilion · blue hour' } },
]
const N = LAYERS.length

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// camera that fits a focus rect (image px) inside a W × H frame, never showing past the photograph
function fit(F, W, H) {
  const cover = Math.max(W / MASTER.w, H / MASTER.h)
  const s = Math.max(cover, Math.min(W / F.w, H / F.h) * 0.94)
  let x = W / 2 - (F.x + F.w / 2) * s
  let y = H / 2 - (F.y + F.h / 2) * s
  x = clamp(x, W - MASTER.w * s, 0)
  y = clamp(y, H - MASTER.h * s, 0)
  return { x, y, scale: s }
}

function Layers({ lenis }) {
  const root = useRef(null)
  const frame = useRef(null)
  const world = useRef(null)
  const [at, go] = useStepper(root, { count: N, lenis, hold: 1300 })
  const first = useRef(true)

  // one state, one camera move: fixed length, whatever the scroll speed
  useLayoutEffect(() => {
    const r = frame.current.getBoundingClientRect()
    const c = fit(LAYERS[at].cam, r.width, r.height)
    if (first.current) { first.current = false; gsap.set(world.current, c); return }
    gsap.to(world.current, { ...c, duration: 1.5, ease: STEP_EASE, overwrite: true })
  }, [at])
  useEffect(() => {
    const onR = () => {
      const r = frame.current.getBoundingClientRect()
      gsap.set(world.current, fit(LAYERS[at].cam, r.width, r.height))
    }
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [at])

  const L = LAYERS[at]
  return (
    <div className="rb" ref={root}>
      <div className="rb-sticky">
        <div className="rb-text">
          <p className="mono rb-k"><span>Seven layers, seven decisions</span><span><b>{String(at + 1).padStart(2, '0')}</b> / {String(N).padStart(2, '0')}</span></p>
          <ol className="rb-rail mono">
            {LAYERS.map((l, i) => (
              <li key={l.k} className={i === at ? 'on' : i < at ? 'past' : ''}>
                <button onClick={() => go(i)} aria-current={i === at ? 'step' : undefined}>
                  <span>{String(i + 1).padStart(2, '0')}</span><span>{l.k}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="rb-cap" key={at} aria-live="polite">
            <h3 className="serif rb-q">{L.q}</h3>
            <p className="rb-a">{L.a}</p>
            <dl className="rb-facts">
              {L.facts.map(([a, b]) => <div key={a}><dt className="mono">{a}</dt><dd>{b}</dd></div>)}
            </dl>
          </div>
        </div>

        <div className="rb-stage">
          <div className={`rb-frame ${L.hl.length ? 'has-hl' : ''} ${L.hl.length > 1 ? 'is-all' : ''}`} ref={frame}>
            <div className="rb-world" ref={world} style={{ width: MASTER.w, height: MASTER.h }}>
              <img className="rb-master" alt="STRATA on the Ķīpsala riverbank at dusk"
                src={img('hero', 2688)} srcSet={`${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w`} sizes="(max-width: 900px) 260vw, 160vw" loading="lazy" />
              <div className="rb-veil" />
              {FLOORS.map((f, i) => (
                <img key={f.id} className={`rb-slice ${L.hl.includes(i) ? 'on' : ''}`} alt="" src={`/img/slice-${f.id}.webp`} loading="lazy"
                  style={{ left: f.slice.x, top: f.slice.y, width: f.slice.w, height: f.slice.h, '--d': `${i * 0.07}s` }} />
              ))}
              <svg className="rb-lines" viewBox={`0 0 ${MASTER.w} ${MASTER.h}`} aria-hidden="true">
                {FLOORS.map((f, i) => (
                  <rect key={f.id} className={L.hl.includes(i) ? 'on' : ''} x={f.slice.x} y={f.slice.y} width={f.slice.w} height={f.slice.h}
                    pathLength="1" style={{ '--d': `${i * 0.07}s` }} />
                ))}
              </svg>
            </div>
            <p className="mono rb-tag"><span>{String(at + 1).padStart(2, '0')}</span>{L.k}</p>
          </div>
          {LAYERS.map((l, i) => (
            <figure key={l.k} className={`rb-ev ${i === at ? 'on' : ''}`} aria-hidden={i !== at}>
              <div className="rb-ev-img"><img alt={l.ev.c} src={img(l.ev.im, 1280)} srcSet={srcset(l.ev.im)} sizes="(max-width: 900px) 46vw, 20vw" loading="lazy" /></div>
              <figcaption className="mono">{l.ev.c}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Story({ lenis }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // statement: words light up as you read
      const words = root.current.querySelectorAll('.statement .w')
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.05, ease: 'none',
        scrollTrigger: { trigger: '.statement', start: 'top 78%', end: 'bottom 45%', scrub: true },
      })
      gsap.fromTo('.statement-rule', { scaleX: 0 }, { scaleX: 1, ease: 'none', transformOrigin: '0 50%',
        scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 50%', scrub: true } })
    }, root)
    return () => ctx.revert()
  }, [])

  const statement = 'Built the way a riverbank is built — in layers. Basalt at the waterline, travertine in the middle, glass where the building meets the sky.'

  return (
    <section id="architecture" className="story" ref={root}>
      <div className="wrap">
        <p className="kicker mono"><span>03</span><span>Architecture</span></p>
        <p className="statement serif">
          {statement.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)}
        </p>
        <span className="statement-rule" />
      </div>
      <Layers lenis={lenis} />
    </section>
  )
}
