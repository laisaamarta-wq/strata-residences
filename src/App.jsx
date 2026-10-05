import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Experience from './components/Experience.jsx'
import Residences from './components/Residences.jsx'
import Story from './components/Story.jsx'
import Day from './components/Day.jsx'
import Walk from './components/Walk.jsx'
import Location from './components/Location.jsx'
import Footer from './components/Footer.jsx'
import { NAV } from './data.js'
import { NAV as PASS } from './engine/stepper.js'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [lenis, setLenis] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('project')
  const [stageUi, setStageUi] = useState({ inside: false, details: false })
  // on touch screens, a held scene shows for a moment how to move on without finishing it
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    let t = 0
    const on = (e) => { clearTimeout(t); setHeld(e.detail); if (e.detail) t = setTimeout(() => setHeld(false), 3600) }
    window.addEventListener('strata:held', on)
    return () => { clearTimeout(t); window.removeEventListener('strata:held', on) }
  }, [])
  const onUiChange = useCallback((u) => setStageUi((p) => (p.inside === u.inside && p.details === u.details ? p : u)), [])
  const directorRef = useRef(null)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const l = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), touchMultiplier: 1.4, smoothWheel: !reduce })
    l.on('scroll', (e) => { ScrollTrigger.update(); setScrolled(e.scroll > window.innerHeight * 0.6) })
    const raf = (t) => l.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    setLenis(l)
    // header colour and the active nav item follow the section underneath the header,
    // read from the layout itself on every scroll (held scenes included)
    const sections = [
      ['#project', 'dark', 'project'], ['#residences', 'light', 'residences'], ['#architecture', 'light', 'architecture'],
      ['.day', 'dark', 'architecture'], ['.walk', 'dark', 'location'], ['#location', 'dark', 'location'], ['#enquire', 'light', 'location'],
    ]
    const probe = () => {
      for (const [sel, t, id] of sections) {
        const el = document.querySelector(sel)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= 40 && r.bottom > 40) { setTheme(t); setActive(id); break }
      }
      // the footer is shorter than the viewport, so Enquire becomes active once it is well in view
      const enq = document.querySelector('#enquire')
      if (enq && enq.getBoundingClientRect().top < window.innerHeight * 0.7) setActive('enquire')
    }
    const offProbe = l.on('scroll', probe)
    probe()
    return () => { gsap.ticker.remove(raf); offProbe(); l.destroy() }
  }, [])

  const scrollTo = useCallback((target) => {
    setMenu(false)
    const d = directorRef.current
    const run = () => { PASS.busy = true; lenis?.start(); lenis?.scrollTo(target, { duration: 1.8, force: true, onComplete: () => { PASS.busy = false } }) }
    if (d && d.mode === 'floor') {
      d.back()
      const wait = () => (d.mode === 'overview' ? run() : setTimeout(wait, 100))
      setTimeout(wait, 300)
    } else requestAnimationFrame(run)
  }, [lenis])

  const explore = useCallback((i) => {
    PASS.busy = true
    lenis?.start()
    lenis?.scrollTo(0, { duration: 1.6, force: true, onComplete: () => { PASS.busy = false; setTimeout(() => directorRef.current?.go(i), 150) } })
  }, [lenis])

  const onNav = (id) => (e) => {
    e.preventDefault()
    if (id === 'project') {
      setMenu(false)
      const d = directorRef.current
      PASS.busy = true
      lenis?.start()
      lenis?.scrollTo(0, { duration: 1.4, force: true, onComplete: () => { PASS.busy = false } })
      if (d?.mode === 'floor') d.back()
      return
    }
    scrollTo(`#${id}`)
  }

  return (
    <>
      <header className={`site-header theme-${theme} ${menu ? 'menu-open' : ''} ${scrolled ? 'is-scrolled' : ''} ${stageUi.details ? 'details-open' : ''}`}>
        <a href="#project" className="brand" onClick={onNav('project')}>
          <span className="wordmark">STRATA</span>
          <span className="mono brand-sub">Ķīpsala · Riga</span>
        </a>
        <nav className="main-nav">
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={onNav(n.id)} className={active === n.id ? 'is-active' : ''}
              aria-current={active === n.id ? 'true' : undefined}><span className="mono">0{i + 1}</span>{n.label}</a>
          ))}
        </nav>
        <a className={`enquire-link ${active === 'enquire' ? 'is-active' : ''}`} href="#enquire" onClick={onNav('enquire')}
          aria-current={active === 'enquire' ? 'true' : undefined}>Enquire</a>
        <button className="burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><i /><i /></button>
      </header>

      <main>
        <Experience lenis={lenis} directorRef={directorRef} onGoTo={scrollTo} onUiChange={onUiChange} />
        {/* the page below the stage is out of the tab order while a residence is open */}
        <div className="page" inert={stageUi.inside || undefined}>
          <Residences onExplore={explore} />
          <Story lenis={lenis} />
          <Day lenis={lenis} />
          <Walk lenis={lenis} />
          <Location />
          <Footer />
        </div>
      </main>
      <p className={`held-hint mono ${held ? 'on' : ''}`} aria-hidden="true"><i />Swipe to step · long swipe to move on</p>
    </>
  )
}
