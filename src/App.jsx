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
  const [tourDone, setTourDone] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const directorRef = useRef(null)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const l = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), touchMultiplier: 1.4 })
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
      trigger: sel, start: 'top 40px', end: 'bottom 40px', onToggle: (s) => s.isActive && setTheme(t),
    }))
    return () => { gsap.ticker.remove(raf); l.destroy(); triggers.forEach((t) => t.kill()) }
  }, [])

  const scrollTo = useCallback((target) => {
    setTourDone(true)
    setMenu(false)
    const d = directorRef.current
    const run = () => { lenis?.start(); lenis?.scrollTo(target, { duration: 1.8 }) }
    if (d && d.mode === 'floor') {
      d.back()
      const wait = () => (d.mode === 'overview' ? run() : setTimeout(wait, 100))
      setTimeout(wait, 300)
    } else requestAnimationFrame(run)
  }, [lenis])

  const onTourEnd = useCallback(() => scrollTo('#residences'), [scrollTo])

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
      <header className={`site-header theme-${theme} ${menu ? 'menu-open' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <a href="#project" className="brand" onClick={onNav('project')}>
          <span className="wordmark">STRATA</span>
          <span className="mono brand-sub">Ķīpsala · Riga</span>
        </a>
        <nav className="main-nav">
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={onNav(n.id)}><span className="mono">0{i + 1}</span>{n.label}</a>
          ))}
        </nav>
        <a className="enquire-link" href="#enquire" onClick={onNav('enquire')}>Enquire</a>
        <button className="burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><i /><i /></button>
      </header>

      <main>
        <Experience tourDone={tourDone} onTourEnd={onTourEnd} onSkip={() => scrollTo('#residences')} lenis={lenis} directorRef={directorRef} />
        <Residences onExplore={explore} />
        <Story />
        <Location />
        <Footer />
      </main>
    </>
  )
}
