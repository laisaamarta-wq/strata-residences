import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Experience from './components/Experience.jsx'
import Residences from './components/Residences.jsx'
import Story from './components/Story.jsx'
import Location from './components/Location.jsx'
import Footer from './components/Footer.jsx'
import { NAV } from './data.js'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [lenis, setLenis] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('project')
  const [stageUi, setStageUi] = useState({ inside: false, details: false })
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
    // header colour follows the section underneath it
    const sections = [
      ['#project', 'dark'], ['#residences', 'light'], ['#architecture', 'light'], ['.break', 'dark'], ['#location', 'dark'], ['#enquire', 'light'],
    ]
    const triggers = sections.map(([sel, t]) => ScrollTrigger.create({
      trigger: sel, start: 'top 40px', end: 'bottom 40px',
      onToggle: (s) => {
        if (!s.isActive) return
        setTheme(t)
        const id = sel === '.break' ? 'architecture' : sel.slice(1)
        setActive(id)
      },
    }))
    // the footer is shorter than the viewport, so Enquire becomes active once it is well in view
    triggers.push(ScrollTrigger.create({
      trigger: '#enquire', start: 'top 70%',
      onEnter: () => setActive('enquire'), onLeaveBack: () => setActive('location'),
    }))
    return () => { gsap.ticker.remove(raf); l.destroy(); triggers.forEach((t) => t.kill()) }
  }, [])

  const scrollTo = useCallback((target) => {
    setMenu(false)
    const d = directorRef.current
    const run = () => { lenis?.start(); lenis?.scrollTo(target, { duration: 1.8 }) }
    if (d && d.mode === 'floor') {
      d.back()
      const wait = () => (d.mode === 'overview' ? run() : setTimeout(wait, 100))
      setTimeout(wait, 300)
    } else requestAnimationFrame(run)
  }, [lenis])

  const explore = useCallback((i) => {
    lenis?.scrollTo(0, { duration: 1.6, onComplete: () => setTimeout(() => directorRef.current?.go(i), 150) })
  }, [lenis])

  const onNav = (id) => (e) => {
    e.preventDefault()
    if (id === 'project') {
      setMenu(false)
      const d = directorRef.current
      lenis?.scrollTo(0, { duration: 1.4 })
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
          <Story />
          <Location />
          <Footer />
        </div>
      </main>
    </>
  )
}
