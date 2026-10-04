import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLOORS, img, srcset } from '../data.js'
import EntryStage from './EntryStage.jsx'
import BuildingIndex from './BuildingIndex.jsx'
import PlanStudio from './PlanStudio.jsx'
import Film from './Film.jsx'

gsap.registerPlugin(ScrollTrigger)

const LIVE = 'https://strata-residences-mu.vercel.app/'

const INTRO = [
  ['Concept', 'Seven floors, seven hours. Each level is tuned to the light it receives — misted mornings in the garden residences, a river sunset on level 04, blue hour on the roof.'],
  ['The interface', 'The building itself is the menu. Hover a floor to light it, click to enter: the camera dollies to the slab, cuts to the facade and moves through the glass into the rooms.'],
  ['What was made', 'Art direction and imagery, the spatial UX, a GSAP camera system, interactive floor plans, an editorial details layer, responsive behaviour and the production front-end.'],
  ['Key idea', 'Click enters. Scroll leaves. The visitor always knows where they are in the building — and is never trapped inside it.'],
]

const UX = [
  ['Building', 'Hover lights a floor · click enters', 'The facade is the navigation. Seven hit areas, drawn in the coordinates of the photograph itself.'],
  ['Level', 'The camera moves, the page holds still', 'A dolly, a matched cut, a push through the glass. While a residence is open the page underneath is frozen and out of the tab order.'],
  ['Room', '3D Space · Floor plan · Details', 'Three ways to read the same home: the photograph, the drawing, the facts. Rooms on the plan are doors back into the photographs.'],
  ['Detail', 'An editorial layer, not a modal', 'Specifications, materials and price open as a sliding wall of paper beside the room — the space stays in view.'],
]

const RULES = [
  ['Click', 'enter a level'],
  ['Scroll · swipe · Esc', 'one step back'],
  ['Back is progressive', 'panel → room → building'],
  ['Elevator', 'level to level without leaving'],
]

const MOVES = [
  { name: 'Enter', film: 'd-enter', spec: 'Building → floor', t: '≈ 3.5 s · four phases', d: 'The flat image swaps for floor slices, the camera dollies for 1.45 s (power3.inOut), a matched cut lands on the facade at 1.2 s and a soft light bloom carries it through the glass.' },
  { name: 'Rooms', film: 'd-rooms', spec: 'Room → room', t: '1.1 s · power3.out', d: 'A direction-aware cross-fade with a 3 % drift toward the room you chose. Interruption-safe: rapid clicks never leave two rooms stacked.' },
  { name: 'Floor plan', film: 'd-plan', spec: 'Photograph → drawing', t: '0.6 s · 60 ms per line', d: 'The plan draws itself wall by wall over the room. Highlighted rooms are doors: select one and the camera returns to that space.' },
  { name: 'Details', film: 'd-details', spec: 'Room → editorial layer', t: '0.65 s clip-path · 45 ms stagger', d: 'A sliding wall of paper — no backdrop, no shadow, one hairline. The view switcher re-centres beside it.' },
  { name: 'Elevator', film: 'd-elevator', spec: 'Floor → floor', t: '0.75 s + 0.32 s per level', d: 'Step back to the facade, travel vertically past every level while the floor numerals pass by, then push into the new interior.' },
  { name: 'Return', film: 'd-return', spec: 'Floor → building', t: 'Enter timeline × −1.4', d: 'The way out is the way in, played backwards. Scroll, swipe, Esc or “The building” all step out.' },
]

const HOURS = [
  { f: 0, im: 'g-lobby' }, { f: 1, im: '01-living' }, { f: 2, im: '02-living' }, { f: 3, im: '03-living' },
  { f: 4, im: '04-view' }, { f: 5, im: '05-terrace' }, { f: 6, im: 'ph-pool' },
]

const MATERIALS = [
  ['Basalt', 'at the waterline'],
  ['Travertine', 'for every slab edge'],
  ['Bronze', 'untreated — it weathers to a soft brown'],
  ['Oak & lime plaster', 'inside. Nothing is painted.'],
]

// UI close-ups, cropped from the recordings (fractions of the 1920 × 1080 frame)
const CROPS = [
  { film: 'd-label', k: 'Floor label', d: 'Follows the hovered slab: number, name, size, the hour it was tuned to.', c: { x: 0.44, y: 0.14, w: 0.52, h: 0.74 } },
  { film: 'd-elevator', k: 'Level bar', d: 'Tracks the camera — the active level and elevation update as the elevator passes each floor.', c: { x: 0.83, y: 0.22, w: 0.17, h: 0.5 } },
  { film: 'd-details', k: 'View switcher', d: 'One ink pill slides between 3D Space, Floor plan and Details.', c: { x: 0.24, y: 0.855, w: 0.34, h: 0.11 } },
  { film: 'd-details', k: 'Details layer', d: 'Kicker, name, three key figures, then the rest — readable at a glance, scrollable in depth.', c: { x: 0.64, y: 0, w: 0.36, h: 0.66 } },
]

const PAGE = [
  ['Residences', 'A schedule of fifteen homes; each row previews its interior under the cursor.'],
  ['Architecture', 'Six chapters on a sticky frame that wipes open image by image.'],
  ['Every level keeps a different hour', 'The seven hours, set over the third-floor terrace at golden hour.'],
  ['Location', 'A drawn map of Ķīpsala that inks itself, with walking rings and routes.'],
  ['Enquire', 'Private viewings — the single call to action, repeated in every details layer.'],
]

const DEVICES = [
  { k: 'Desktop', film: 'd-walk', d: 'The building stands right of the headline. Hover previews a floor, a click enters; the level bar on the right tracks the camera.' },
  { k: 'Tablet', film: 't-full', d: 'In portrait the building drops below the headline. One tap previews a level; a second — “Enter level” — goes in.' },
  { k: 'Mobile', film: 'm-full', d: 'Controls move into the thumb zone, Details becomes a full sheet of paper, and a swipe steps back out of the residence.' },
]

const Words = ({ text, className }) => (
  <span className={className}>{text.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)}</span>
)

const Kicker = ({ n, children }) => <p className="cs-k mono"><span>{n}</span><span>{children}</span></p>

export default function CaseStudy() {
  const root = useRef(null)
  const [lenis, setLenis] = useState(null)
  const [chapter, setChapter] = useState('00 — Arrival')
  const [hour, setHour] = useState(0)
  const [mat, setMat] = useState(0)
  const [dev, setDev] = useState(0)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const l = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), touchMultiplier: 1.4, smoothWheel: !reduce })
    l.on('scroll', ScrollTrigger.update)
    const raf = (t) => l.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    setLenis(l)
    return () => { gsap.ticker.remove(raf); l.destroy() }
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // chapter label in the header
      gsap.utils.toArray('[data-chapter]').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => s.isActive && setChapter(el.dataset.chapter) })
      })

      // words light up as you read (the production statement technique)
      gsap.utils.toArray('.cs-read').forEach((el) => {
        gsap.fromTo(el.querySelectorAll('.w'), { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: true } })
      })

      // strata: media opens like a floor slab — from a thin horizontal band
      gsap.utils.toArray('.cs-slab').forEach((el) => {
        const inner = el.querySelector('img, video, .cs-bld-world')
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 38%', scrub: 0.6 } })
        tl.fromTo(el, { clipPath: 'inset(44% 0% 44% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut' }, 0)
        if (inner && !el.matches('.cs-bld, .cs-hour-img')) tl.fromTo(inner, { scale: 1.22 }, { scale: 1, ease: 'power2.out' }, 0)
      })

      // quiet rises for text blocks
      gsap.utils.toArray('.cs-rise').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.utils.toArray('.cs-lines').forEach((el) => {
        gsap.fromTo(el.querySelectorAll('.ln > span'), { yPercent: 108 }, { yPercent: 0, duration: 1.3, stagger: 0.1, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 85%' } })
      })

      // UX section: rules drawn like a section drawing
      gsap.utils.toArray('.cs-ux-row').forEach((row) => {
        gsap.fromTo(row.querySelector('.cs-ux-rule'), { scaleX: 0 }, { scaleX: 1, ease: 'none', transformOrigin: '0 50%',
          scrollTrigger: { trigger: row, start: 'top 85%', end: 'top 45%', scrub: true } })
        gsap.fromTo(row.querySelectorAll('.cs-ux-in > *'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.08, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: row, start: 'top 75%' } })
      })
      gsap.fromTo('.cs-section-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', transformOrigin: '50% 0',
        scrollTrigger: { trigger: '.cs-ux-list', start: 'top 70%', end: 'bottom 60%', scrub: true } })

      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        // motion: a horizontal strip of real recordings, moved by vertical scroll
        const track = document.querySelector('.cs-strip-track')
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth), ease: 'none',
          scrollTrigger: { trigger: '.cs-strip', start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true },
        })
        gsap.to('.cs-strip-bar i', { scaleX: 1, ease: 'none', transformOrigin: '0 50%',
          scrollTrigger: { trigger: '.cs-strip', start: 'top top', end: 'bottom bottom', scrub: true } })
      })

      // light: a different hour on every floor
      gsap.utils.toArray('.cs-hour-item').forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && setHour(i) })
        gsap.fromTo(el.querySelector('img'), { yPercent: -7, scale: 1.14 }, { yPercent: 7, scale: 1.04, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      })

      // materiality: zoom into the sample board
      gsap.fromTo('.cs-mat-img', { scale: 1 }, { scale: 2.35, ease: 'power1.in',
        scrollTrigger: { trigger: '.cs-mat', start: 'top top', end: 'bottom bottom', scrub: 0.6,
          onUpdate: (s) => setMat(Math.min(MATERIALS.length - 1, Math.floor(s.progress * MATERIALS.length * 0.999))) } })
      gsap.fromTo('.cs-mat-shade', { opacity: 0.1 }, { opacity: 0.55, ease: 'none',
        scrollTrigger: { trigger: '.cs-mat', start: 'top top', end: 'bottom bottom', scrub: true } })

      // palette columns grow in like strata
      gsap.fromTo('.cs-pal-col', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, stagger: 0.07, ease: 'power3.inOut',
        scrollTrigger: { trigger: '.cs-pal', start: 'top 80%' } })

      // responsive: one device at a time
      mm.add('(min-width: 900px)', () => {
        ScrollTrigger.create({ trigger: '.cs-resp', start: 'top top', end: 'bottom bottom',
          onUpdate: (s) => setDev(Math.min(2, Math.floor(s.progress * 3 * 0.999))) })
      })

      // final: pull back from the penthouse to the whole building
      gsap.fromTo('.cs-final-img', { scale: 2.5 }, { scale: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.cs-final', start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
      gsap.fromTo('.cs-final-in > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.cs-final', start: '55% bottom', end: 'bottom bottom', scrub: 0.5 } })
    }, root)
    return () => ctx.revert()
  }, [])

  // refresh once fonts and the first images have settled (prevents trigger drift)
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 1200)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => clearTimeout(t)
  }, [])

  const h = FLOORS[HOURS[hour].f]

  return (
    <div className="cs" ref={root}>
      <header className="cs-header">
        <a href="#top" className="wordmark" onClick={(e) => { e.preventDefault(); lenis?.scrollTo(0, { duration: 2 }) }}>STRATA</a>
        <span className="mono cs-chapter" key={chapter}>{chapter}</span>
        <a className="mono cs-live" href={LIVE} target="_blank" rel="noopener noreferrer">Live site <span aria-hidden="true">↗</span></a>
      </header>

      <main id="top">
        {/* 00 — the production stage, entered by scroll */}
        <EntryStage lenis={lenis} />

        {/* 01 — introduction, sliding over the residence */}
        <section className="cs-sec cs-intro" data-chapter="01 — The residence">
          <div className="cs-wrap">
            <Kicker n="01">The residence</Kicker>
            <p className="mono cs-intro-id"><span>STRATA</span><span>Residential experience / Riga</span></p>
            <h2 className="serif cs-lead">
              <Words className="cs-read" text="A seven-level residence on the Ķīpsala riverbank, presented as a place you walk into — not a page you read." />
            </h2>
            <div className="cs-cols">
              {INTRO.map(([k, t]) => (
                <div className="cs-col cs-rise" key={k}><p className="mono cs-col-k">{k}</p><p>{t}</p></div>
              ))}
            </div>
            <dl className="cs-facts cs-rise">
              <div><dt className="mono">Role</dt><dd>Art direction · UX/UI · Motion · Front-end</dd></div>
              <div><dt className="mono">Stack</dt><dd>React 19 · GSAP 3 · Lenis · Vite</dd></div>
              <div><dt className="mono">Imagery</dt><dd>AI-generated with Higgsfield, art-directed</dd></div>
              <div><dt className="mono">Status</dt><dd>Concept · live on Vercel · 2026</dd></div>
            </dl>
          </div>
        </section>

        {/* 02 — architecture: the building as an index */}
        <section className="cs-sec cs-dark cs-arch" data-chapter="02 — Architecture">
          <div className="cs-wrap">
            <div className="cs-head">
              <Kicker n="02">Architecture</Kicker>
              <h2 className="serif cs-h cs-lines">
                <span className="ln"><span>Seven levels,</span></span>
                <span className="ln"><span><em>seven hours.</em></span></span>
              </h2>
              <p className="cs-p cs-rise">Basalt at the waterline, travertine slabs gently out of step, glass where the building meets the sky. On the site the building is the navigation: every floor is a hit area drawn in the coordinates of the photograph, so the hover, the label and the camera share one map.</p>
            </div>
            <BuildingIndex />
          </div>
        </section>

        {/* 03 — spatial UX */}
        <section className="cs-sec cs-ux" data-chapter="03 — Spatial experience">
          <div className="cs-wrap">
            <div className="cs-head cs-head-split">
              <div>
                <Kicker n="03">Spatial experience</Kicker>
                <h2 className="serif cs-h cs-lines">
                  <span className="ln"><span>Navigation as a walk</span></span>
                  <span className="ln"><span><em>through the building.</em></span></span>
                </h2>
              </div>
              <p className="cs-p cs-rise">A real-estate site usually lists apartments. STRATA puts the visitor at the front door and lets the architecture carry the hierarchy — building, level, room, detail. Every step down is a camera move, and every step has a way back.</p>
            </div>
            <div className="cs-ux-list">
              <span className="cs-section-line" aria-hidden="true" />
              {UX.map(([k, g, d], i) => (
                <div className="cs-ux-row" key={k}>
                  <span className="cs-ux-rule" aria-hidden="true" />
                  <div className="cs-ux-in">
                    <span className="mono cs-ux-n">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="serif">{k}</h3>
                    <p className="mono cs-ux-g">{g}</p>
                    <p className="cs-ux-d">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <ul className="cs-rules">
              {RULES.map(([a, b]) => <li key={a} className="cs-rise"><b className="serif">{a}</b><span className="mono">{b}</span></li>)}
            </ul>
          </div>
        </section>

        {/* 04 — motion */}
        <section className="cs-sec cs-dark cs-motion" data-chapter="04 — Motion">
          <div className="cs-wrap">
            <div className="cs-head cs-head-split">
              <div>
                <Kicker n="04">Motion</Kicker>
                <h2 className="serif cs-h cs-lines">
                  <span className="ln"><span>One camera,</span></span>
                  <span className="ln"><span><em>six moves.</em></span></span>
                </h2>
              </div>
              <p className="cs-p cs-rise">Every transition is a camera move inside one continuous space — never a page change. One GSAP director owns them all: the same easing family, the same light, and every move can be reversed or interrupted.</p>
            </div>
          </div>
          <figure className="cs-cine">
            <div className="cs-cine-frame cs-slab"><Film name="d-walk" label="Recording: entering level 04 and moving between rooms" /></div>
            <figcaption className="mono cs-wrap"><span>Recorded from the production build</span><span>Level 04 · Walnut Residences · 1920 × 1080 · 30 fps</span></figcaption>
          </figure>
        </section>
        <section className="cs-strip cs-dark" data-chapter="04 — Motion" style={{ '--n': MOVES.length }}>
          <div className="cs-strip-sticky">
            <div className="cs-strip-track">
              {MOVES.map((m, i) => (
                <article className="cs-move" key={m.name}>
                  <div className="cs-move-film"><Film name={m.film} label={`Recording: ${m.name}`} /></div>
                  <div className="cs-move-text">
                    <p className="mono cs-move-k"><span>{String(i + 1).padStart(2, '0')}</span><span>{m.spec}</span></p>
                    <h3 className="serif">{m.name}</h3>
                    <p className="mono cs-move-t">{m.t}</p>
                    <p className="cs-move-d">{m.d}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="cs-strip-bar" aria-hidden="true"><i /></div>
          </div>
        </section>

        {/* 05 — light & interior */}
        <section className="cs-sec cs-light" data-chapter="05 — Light & interior">
          <div className="cs-wrap cs-light-grid">
            <div className="cs-light-sticky">
              <Kicker n="05">Light & interior</Kicker>
              <h2 className="serif cs-h-s">A different hour<br /><em>on every floor.</em></h2>
              <div className="cs-clock" aria-live="polite">
                <span className="serif cs-clock-t" key={h.id}>{h.hour}</span>
                <span className="mono cs-clock-l" key={`${h.id}l`}>Level {h.label} · {h.light}</span>
              </div>
              <ol className="cs-clock-dots" aria-hidden="true">
                {HOURS.map((x, i) => <li key={x.im} className={i === hour ? 'on' : i < hour ? 'past' : ''} />)}
              </ol>
            </div>
            <div className="cs-hours">
              {HOURS.map(({ f, im }, i) => {
                const fl = FLOORS[f]
                return (
                  <figure className={`cs-hour-item ${i % 2 ? 'r' : ''}`} key={im}>
                    <div className="cs-hour-img cs-slab"><img alt={`${fl.name} — ${fl.light}`} src={img(im, 1280)} srcSet={srcset(im)} sizes="(max-width: 900px) 92vw, 50vw" loading="lazy" /></div>
                    <figcaption className="mono"><span>{fl.label}</span><span>{fl.name}</span><span>{fl.material}</span></figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
        </section>

        {/* 06 — materiality & art direction */}
        <section className="cs-mat cs-dark" data-chapter="06 — Materiality">
          <div className="cs-mat-sticky">
            <img className="cs-mat-img" alt="Material board — basalt, travertine, bronze, oak, linen and birch" src={img('materials', 2400)} srcSet={srcset('materials')} sizes="100vw" loading="lazy" />
            <div className="cs-mat-shade" />
            <div className="cs-mat-text cs-wrap">
              <Kicker n="06">Materiality</Kicker>
              <p className="serif cs-mat-big">Heavy at the water,<br /><em>light at the sky.</em></p>
              <ol className="cs-mat-list">
                {MATERIALS.map(([a, b], i) => (
                  <li key={a} className={i === mat ? 'on' : i < mat ? 'past' : ''}><b className="serif">{a}</b><span className="mono">{b}</span></li>
                ))}
              </ol>
            </div>
          </div>
        </section>
        <section className="cs-sec cs-art" data-chapter="06 — Art direction">
          <div className="cs-wrap">
            <div className="cs-head cs-head-split">
              <div>
                <Kicker n="06">Art direction</Kicker>
                <h2 className="serif cs-h cs-lines"><span className="ln"><span>A palette for</span></span><span className="ln"><span><em>every level.</em></span></span></h2>
              </div>
              <p className="cs-p cs-rise">Each floor was given four materials and an hour of the day before a single image was generated. The palettes below are the ones the site uses in every details layer.</p>
            </div>
            <div className="cs-pal">
              {FLOORS.map((f) => (
                <div className="cs-pal-col" key={f.id}>
                  <p className="mono cs-pal-k"><span>{f.label}</span><span>{f.hour}</span></p>
                  {f.palette.map(([n, c]) => (
                    <div className="cs-pal-sw" key={n} style={{ background: c }} tabIndex={0}>
                      <span className="mono">{n}<br />{c}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="cs-type">
              <div className="cs-type-i cs-rise">
                <p className="mono cs-type-k"><span>Instrument Serif</span><span>Names & numerals</span></p>
                <p className="serif cs-type-s1">05 <em>Bronze Residence</em></p>
              </div>
              <div className="cs-type-i cs-rise">
                <p className="mono cs-type-k"><span>Hanken Grotesk</span><span>Wordmark & reading</span></p>
                <p className="cs-type-s2"><span className="wordmark">STRATA</span>Seven strata of stone, glass and light on the riverbank.</p>
              </div>
              <div className="cs-type-i cs-rise">
                <p className="mono cs-type-k"><span>IBM Plex Mono</span><span>Levels, time, measure</span></p>
                <p className="mono cs-type-s3">Level 04 · +14.40 m · 19:10 River sunset</p>
              </div>
              <ul className="cs-tokens cs-rise">
                {[['Ink', '#121110'], ['Paper', '#f3f0ea'], ['Travertine', '#d9cebb'], ['Bronze', '#9c7246'], ['Dusk', '#7d8aa3']].map(([n, c]) => (
                  <li key={n}><i style={{ background: c }} /><span className="mono">{n}<br />{c}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 07 — interface */}
        <section className="cs-sec cs-ui" data-chapter="07 — Interface">
          <div className="cs-wrap">
            <div className="cs-head cs-head-split">
              <div>
                <Kicker n="07">Interface</Kicker>
                <h2 className="serif cs-h cs-lines"><span className="ln"><span>Orientation,</span></span><span className="ln"><span><em>always in view.</em></span></span></h2>
              </div>
              <p className="cs-p cs-rise">Small, quiet instruments around the photograph: where you are, how high you are, what you are looking at, and how to leave. Close-ups below are cropped from the recordings, not mock-ups.</p>
            </div>
            <div className="cs-crops">
              {CROPS.map((x, i) => (
                <figure className={`cs-crop cs-crop-${i}`} key={x.k}>
                  <div className="cs-crop-frame" style={{ aspectRatio: `${x.c.w * 1920} / ${x.c.h * 1080}` }}>
                    <Film name={x.film} label={`Close-up: ${x.k}`}
                      style={{ width: `${100 / x.c.w}%`, left: `${(-x.c.x / x.c.w) * 100}%`, top: `${(-x.c.y / x.c.h) * 100}%` }} />
                  </div>
                  <figcaption><p className="mono"><span>{String(i + 1).padStart(2, '0')}</span>{x.k}</p><p>{x.d}</p></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 08 — floor plans */}
        <section className="cs-sec cs-dark cs-plan-sec" data-chapter="08 — Floor plans">
          <div className="cs-wrap">
            <div className="cs-head cs-head-split">
              <div>
                <Kicker n="08">Floor plans</Kicker>
                <h2 className="serif cs-h cs-lines"><span className="ln"><span>The drawing and</span></span><span className="ln"><span><em>the room.</em></span></span></h2>
              </div>
              <p className="cs-p cs-rise">Seven plans drawn in code — walls, terraces, dimensions, a north point, a five-metre scale. This is the production component: choose a level, then select a highlighted room.</p>
            </div>
            <PlanStudio />
          </div>
        </section>

        {/* 09 — the full site */}
        <section className="cs-sec cs-page" data-chapter="09 — The full site">
          <div className="cs-wrap cs-page-grid">
            <div>
              <Kicker n="09">Beyond the stage</Kicker>
              <h2 className="serif cs-h-s cs-lines"><span className="ln"><span>Below the building,</span></span><span className="ln"><span><em>a calm page.</em></span></span></h2>
              <ol className="cs-page-list">
                {PAGE.map(([a, b], i) => <li key={a} className="cs-rise"><span className="mono">{String(i + 2).padStart(2, '0')}</span><b className="serif">{a}</b><p>{b}</p></li>)}
              </ol>
            </div>
            <figure className="cs-browser cs-rise">
              <div className="cs-browser-bar mono"><i /><i /><i /><span>strata-residences-mu.vercel.app</span></div>
              <div className="cs-browser-view"><Film name="d-page" label="Recording: scrolling the full page" /></div>
            </figure>
          </div>
        </section>

        {/* 10 — responsive */}
        <section className="cs-resp cs-dark" data-chapter="10 — Responsive">
          <div className="cs-resp-sticky">
            <div className="cs-wrap cs-resp-grid">
              <div className="cs-resp-text">
                <Kicker n="10">Responsive</Kicker>
                <h2 className="serif cs-h-s">The same walk,<br /><em>in every hand.</em></h2>
                <ol className="cs-resp-list">
                  {DEVICES.map((x, i) => (
                    <li key={x.k} className={i === dev ? 'on' : ''}><b className="mono"><span>{String(i + 1).padStart(2, '0')}</span>{x.k}</b><p>{x.d}</p></li>
                  ))}
                </ol>
              </div>
              <div className={`cs-devices on-${dev}`}>
                <div className="cs-dev cs-dev-desk"><div className="cs-dev-screen"><Film name="d-walk" label="Desktop recording" /></div></div>
                <div className="cs-dev cs-dev-tab"><div className="cs-dev-screen"><Film name="t-full" label="Tablet recording" /></div></div>
                <div className="cs-dev cs-dev-mob"><div className="cs-dev-screen"><Film name="m-full" label="Mobile recording" /></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* 11 — final view */}
        <section className="cs-final cs-dark" data-chapter="11 — Final view">
          <div className="cs-final-sticky">
            <img className="cs-final-img" alt="STRATA at dusk on the Ķīpsala riverbank" src={img('hero', 2688)} srcSet={`${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w`} sizes="100vw" loading="lazy" />
            <div className="cs-final-shade" />
            <div className="cs-final-in">
              <p className="wordmark cs-final-mark">STRATA</p>
              <p className="serif cs-final-t">Residential digital experience</p>
              <p className="mono cs-final-p">Riga, Latvia</p>
              <a className="cs-cta mono" href={LIVE} target="_blank" rel="noopener noreferrer">View live experience <span aria-hidden="true">→</span></a>
              <p className="mono cs-final-url">strata-residences-mu.vercel.app</p>
            </div>
          </div>
        </section>
        <footer className="cs-credits mono">
          <span>Design, art direction, motion & front-end — Marta Jakovleva</span>
          <span>Imagery — AI-generated with Higgsfield, art-directed</span>
          <span>React · GSAP · Lenis · Vite · Vercel</span>
          <span>Concept project — the building, names and prices are fictional</span>
        </footer>
      </main>
    </div>
  )
}
