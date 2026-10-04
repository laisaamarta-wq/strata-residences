import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLOORS, img, srcset } from '../data.js'
import EntryStage from './EntryStage.jsx'
import BuildingIndex from './BuildingIndex.jsx'
import PlanStudio from './PlanStudio.jsx'
import Film from './Film.jsx'
import Route from './Route.jsx'
import Opening from './Opening.jsx'
import Concept from './Concept.jsx'

gsap.registerPlugin(ScrollTrigger)

const LIVE = 'https://strata-residences-mu.vercel.app/'

// what Marta did on the project
const ROLE = ['Creative direction', 'UX / UI design', 'Interaction design', 'Motion direction', 'Front-end development', 'AI imagery art direction']
const FACTS = [
  ['Project', 'Self-initiated concept · 2026'],
  ['Stack', 'React · GSAP · Lenis · Vite · Vercel'],
  ['Imagery', 'AI-generated with Higgsfield, art-directed'],
]
const CONTACT = {
  email: 'laisaa.marta@gmail.com',
  phone: '+371 28 203 044',
  tel: '+37128203044',
  linkedin: 'https://www.linkedin.com/in/marta-jakovleva-1a2b65142',
}

const MOVES = [
  { name: 'Enter', film: 'd-enter', spec: 'Building → floor', t: '3.5 s · four phases', d: 'Slices part, a matched cut, a push through the glass.' },
  { name: 'Rooms', film: 'd-rooms', spec: 'Room → room', t: '1.1 s · power3.out', d: 'A direction-aware cross-fade. Rapid clicks never stack two rooms.' },
  { name: 'Floor plan', film: 'd-plan', spec: 'Photograph → drawing', t: '60 ms per line', d: 'The plan draws itself over the room. Rooms are doors.' },
  { name: 'Details', film: 'd-details', spec: 'Room → editorial layer', t: '0.65 s clip-path', d: 'A sliding wall of paper — no modal, no shadow.' },
  { name: 'Elevator', film: 'd-elevator', spec: 'Floor → floor', t: '0.75 s + 0.32 s / level', d: 'Back to the facade, past every level, into the next home.' },
  { name: 'Return', film: 'd-return', spec: 'Floor → building', t: 'Enter × −1.4', d: 'The way in, played backwards.' },
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
  { film: 'd-label', k: 'Floor label', d: 'Number, name, size, hour.', c: { x: 0.44, y: 0.14, w: 0.52, h: 0.74 } },
  { film: 'd-elevator', start: 1.6, k: 'Level bar', d: 'Tracks the camera, floor by floor.', c: { x: 0.83, y: 0.22, w: 0.17, h: 0.5 } },
  { film: 'd-details', start: 2, k: 'View switcher', d: 'One ink pill, three readings.', c: { x: 0.24, y: 0.855, w: 0.34, h: 0.11 } },
  { film: 'd-details', start: 2, k: 'Details layer', d: 'Three key figures first, the rest on scroll.', c: { x: 0.64, y: 0, w: 0.36, h: 0.66 } },
]

const PAGE = ['Residences', 'Architecture', 'Hours', 'Location', 'Enquire']

const DEVICES = [
  { k: 'Desktop', d: 'Hover previews, click enters.' },
  { k: 'Tablet', d: 'Tap to preview, tap to enter.' },
  { k: 'Mobile', d: 'Thumb-zone controls, swipe to step out.' },
]


const Words = ({ text, className }) => (
  <span className={className}>{text.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)}</span>
)

const Kicker = ({ n, children }) => <p className="cs-k mono"><span>{n}</span><span>{children}</span></p>

export default function CaseStudy() {
  const root = useRef(null)
  const [lenis, setLenis] = useState(null)
  const [chapter, setChapter] = useState('00 — Arrival')
  const mail = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Project enquiry — via the STRATA case study')}`
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

      // light: each hour opens like a floor slab — from a thin horizontal band
      gsap.utils.toArray('.cs-slab').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'inset(44% 0% 44% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut',
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 40%', scrub: 0.6 } })
      })
      // architecture: the building rises out of the ground line, then settles
      gsap.fromTo('.cs-bld', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.inOut',
        scrollTrigger: { trigger: '.cs-arch', start: 'top 70%', end: 'top 5%', scrub: 0.7 } })
      gsap.fromTo('.cs-bld-world', { yPercent: 6 }, { yPercent: 0, ease: 'power2.out',
        scrollTrigger: { trigger: '.cs-arch', start: 'top 70%', end: 'top 5%', scrub: 0.7 } })
      // the role reads as a column of lines, one after another
      gsap.fromTo('.cs-role li', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: '.cs-role', start: 'top 82%' } })

      // quiet rises for text blocks
      gsap.utils.toArray('.cs-rise').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.utils.toArray('.cs-lines').forEach((el) => {
        gsap.fromTo(el.querySelectorAll('.ln > span'), { yPercent: 108 }, { yPercent: 0, duration: 1.3, stagger: 0.1, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 85%' } })
      })

      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        // motion: a horizontal strip of real recordings, moved by vertical scroll
        // the heading holds the frame first, then the recordings travel in from the right:
        // a slow start and a soft stop, like a camera on a track
        const track = document.querySelector('.cs-strip-track')
        gsap.timeline({ scrollTrigger: { trigger: '.cs-strip', start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true } })
          .to({}, { duration: 0.14 })
          .to(track, { x: () => -(track.scrollWidth - window.innerWidth), ease: 'power1.inOut', duration: 1 })
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

      // final: the camera pulls back from the penthouse to the whole building — the entry, reversed
      gsap.fromTo('.cs-final-img', { scale: 2.5 }, { scale: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.cs-final', start: 'top top', end: 'bottom bottom', scrub: 1 } })
      gsap.fromTo('.cs-final-in > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.cs-final', start: '55% bottom', end: 'bottom bottom', scrub: 0.5 } })
      // contact: the rows draw their rules left to right
      gsap.fromTo('.cs-ct-row', { '--rule': 0 }, { '--rule': 1, duration: 1.2, stagger: 0.1, ease: 'power3.inOut',
        scrollTrigger: { trigger: '.cs-ct-rows', start: 'top 85%' } })
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
        {/* 00 — opening: the building is laid down in strata while the camera approaches */}
        <Opening />

        {/* 01 — STRATA: the idea and the role; slides up over the opening */}
        <section className="cs-sec cs-intro cs-over" data-chapter="01 — STRATA">
          <div className="cs-wrap">
            <Kicker n="01">STRATA</Kicker>
            <h2 className="serif cs-lead">
              <Words className="cs-read" text="A seven-level residence on the Ķīpsala riverbank, translated into an immersive digital experience." />
            </h2>
            <div className="cs-intro-grid">
              <p className="cs-intro-p cs-rise">
                STRATA is not a gallery of renders. The whole site is built around one idea — moving through architecture.
                Visitors approach the building, choose a level and walk in: the camera travels to the floor, cuts to its facade
                and passes through the glass into the residence, where rooms, plans and details unfold without a single page change.
              </p>
              <div className="cs-role">
                <p className="mono cs-role-k">Role</p>
                <ol>{ROLE.map((r, i) => <li key={r}><span className="mono">{String(i + 1).padStart(2, '0')}</span><span className="serif">{r}</span></li>)}</ol>
              </div>
            </div>
            <dl className="cs-facts cs-rise">
              {FACTS.map(([k, v]) => <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>)}
              <div><dt className="mono">Live</dt><dd><a href={LIVE} target="_blank" rel="noopener noreferrer">strata-residences-mu.vercel.app ↗</a></dd></div>
            </dl>
          </div>
        </section>

        {/* 02 — concept: the journey, drawn as depth */}
        <Concept />

        {/* 03 — spatial entry: the production stage, scrubbed by scroll — the first scene of the real product */}
        <EntryStage lenis={lenis} />

        {/* 04 — motion: the idea and its demonstration in one horizontal take */}
        <section className="cs-strip cs-dark cs-over" data-chapter="04 — Motion" style={{ '--n': MOVES.length }}>
          <div className="cs-strip-sticky">
            <div className="cs-strip-track">
              <div className="cs-move-head">
                <Kicker n="04">Motion</Kicker>
                <h2 className="serif cs-h"><span>One camera,</span><br /><em>six moves.</em></h2>
                <p className="mono cs-note">Every transition is a camera move inside one space — never a page change.</p>
              </div>
              {MOVES.map((m, i) => (
                <article className="cs-move" key={m.name}>
                  <div className="cs-move-film"><Film name={m.film} restart label={`Recording: ${m.name}`} /></div>
                  <div className="cs-move-text">
                    <p className="mono cs-move-k"><span>{String(i + 1).padStart(2, '0')}</span><span>{m.spec}</span><span className="cs-move-t">{m.t}</span></p>
                    <h3 className="serif">{m.name}</h3>
                    <p className="cs-move-d">{m.d}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="cs-strip-bar" aria-hidden="true"><i /></div>
          </div>
        </section>

        {/* 05 — light: a different hour on every floor (parallax) */}
        <section className="cs-sec cs-light" data-chapter="05 — Light">
          <div className="cs-wrap cs-light-grid">
            <div className="cs-light-sticky">
              <Kicker n="05">Light</Kicker>
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
        {/* 06 — materiality: a slow zoom into the sample board */}
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
        {/* 07 — architecture: the facade is the menu */}
        <section className="cs-sec cs-dark cs-arch" data-chapter="07 — Architecture">
          <div className="cs-wrap">
            <div className="cs-cap-head">
              <Kicker n="07">Architecture</Kicker>
              <h2 className="serif cs-h cs-lines"><span className="ln"><span>The facade</span></span><span className="ln"><span><em>is the menu.</em></span></span></h2>
              <p className="mono cs-note cs-rise">Seven slabs, seven hit areas drawn on the photograph.</p>
            </div>
            <BuildingIndex />
          </div>
        </section>

        {/* 08 — visual system: palette columns grow in like strata */}
        <section className="cs-sec cs-art" data-chapter="08 — Visual system">
          <div className="cs-wrap">
            <div className="cs-cap-head cs-cap-row">
              <Kicker n="08">Visual system</Kicker>
              <h2 className="serif cs-h-s cs-lines"><span className="ln"><span>A palette</span></span><span className="ln"><span><em>for every level.</em></span></span></h2>
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
                <p className="cs-type-s2"><span className="wordmark">STRATA</span>Seven strata of stone, glass and light.</p>
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
        {/* 09 — interaction: the drawing and the room */}
        <section className="cs-sec cs-plan-sec cs-dark2" data-chapter="09 — Interaction">
          <div className="cs-wrap">
            <div className="cs-cap-head">
              <Kicker n="09">Interaction</Kicker>
              <h2 className="serif cs-h cs-lines"><span className="ln"><span>The drawing</span></span><span className="ln"><span><em>and the room.</em></span></span></h2>
              <p className="mono cs-note cs-rise">Choose a level · select a highlighted room</p>
            </div>
            <PlanStudio />
          </div>
        </section>

        {/* 10 — interface & navigation: a route through the building, then its controls up close */}
        <section className="cs-sec cs-nav" data-chapter="10 — Interface & navigation">
          <div className="cs-wrap">
            <div className="cs-cap-head cs-cap-row">
              <Kicker n="10">Interface &amp; navigation</Kicker>
              <h2 className="serif cs-h-s cs-lines"><span className="ln"><span>Every step in</span></span><span className="ln"><span><em>has a step out.</em></span></span></h2>
            </div>
            <Route />
            <p className="mono cs-crops-k"><span>Orientation, always in view</span><span>Live close-ups, cropped from the recordings</span></p>
            <div className="cs-crops">
              {CROPS.map((x, i) => (
                <figure className={`cs-crop cs-crop-${i}`} key={x.k}>
                  <div className="cs-crop-frame" style={{ aspectRatio: `${x.c.w * 1920} / ${x.c.h * 1080}` }}>
                    <Film name={x.film} start={x.start || 0} label={`Close-up: ${x.k}`}
                      style={{ width: `${100 / x.c.w}%`, left: `${(-x.c.x / x.c.w) * 100}%`, top: `${(-x.c.y / x.c.h) * 100}%` }} />
                  </div>
                  <figcaption><p className="mono"><span>{String(i + 1).padStart(2, '0')}</span>{x.k}</p><p>{x.d}</p></figcaption>
                </figure>
              ))}
            </div>
            <div className="cs-page-mini">
              <figure className="cs-browser">
                <div className="cs-browser-bar mono"><i /><i /><i /><span>strata-residences-mu.vercel.app</span></div>
                <div className="cs-browser-view"><Film name="d-page" restart label="Recording: scrolling the full page" /></div>
              </figure>
              <div className="cs-page-cap">
                <p className="mono cs-note">Below the building</p>
                <p className="serif">A calm page for everything a buyer reads twice.</p>
                <ul className="mono">{PAGE.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        {/* 11 — responsive */}
        <section className="cs-resp cs-dark" data-chapter="11 — Responsive">
          <div className="cs-resp-sticky">
            <div className="cs-wrap cs-resp-grid">
              <div className="cs-resp-text">
                <Kicker n="11">Responsive</Kicker>
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

        {/* 12 — final: the camera pulls back to the whole building */}
        <section className="cs-final cs-dark" data-chapter="12 — Final view">
          <div className="cs-final-sticky">
            <img className="cs-final-img" alt="STRATA at dusk on the Ķīpsala riverbank" src={img('hero', 2688)} srcSet={`${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w`} sizes="100vw" loading="lazy" />
            <div className="cs-final-shade" />
            <div className="cs-final-in">
              <p className="wordmark cs-final-mark">STRATA</p>
              <p className="serif cs-final-t">A digital experience shaped around<br /><em>movement, space and architecture.</em></p>
              <a className="cs-cta mono" href={LIVE} target="_blank" rel="noopener noreferrer">View live experience <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>

        {/* contact */}
        <section className="cs-ct cs-dark" data-chapter="Contact">
          <div className="cs-wrap">
            <p className="cs-k mono"><span>—</span><span>Let’s work together</span></p>
            <h2 className="serif cs-ct-h">Interested in<br /><em>working together?</em></h2>
            <div className="cs-ct-grid">
              <ul className="cs-ct-rows">
                <li><a className="cs-ct-row" href={`mailto:${CONTACT.email}`}><span className="mono">Email</span><span className="cs-ct-v">{CONTACT.email}</span><span className="cs-ct-a" aria-hidden="true">→</span></a></li>
                <li><a className="cs-ct-row" href={`tel:${CONTACT.tel}`}><span className="mono">Phone · WhatsApp</span><span className="cs-ct-v">{CONTACT.phone}</span><span className="cs-ct-a" aria-hidden="true">→</span></a></li>
                <li><a className="cs-ct-row" href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer"><span className="mono">LinkedIn</span><span className="cs-ct-v">Marta Jakovleva</span><span className="cs-ct-a" aria-hidden="true">↗</span></a></li>
                <li><a className="cs-ct-row" href={LIVE} target="_blank" rel="noopener noreferrer"><span className="mono">Live experience</span><span className="cs-ct-v">strata-residences-mu.vercel.app</span><span className="cs-ct-a" aria-hidden="true">↗</span></a></li>
              </ul>
              <div className="cs-ct-side">
                <p>Marta Jakovleva — UX/UI and digital experience designer, Riga. Open to freelance projects and creative collaborations.</p>
                <a className="cs-cta cs-ct-cta mono" href={mail}>Let’s talk <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </div>
        </section>
        <footer className="cs-credits mono">
          <span>Creative direction, UX/UI, interaction, motion &amp; front-end — Marta Jakovleva</span>
          <span>Imagery — AI-generated with Higgsfield, art-directed</span>
          <span>React · GSAP · Lenis · Vite · Vercel</span>
          <span>Concept project — the building, names and prices are fictional</span>
        </footer>
      </main>
    </div>
  )
}
