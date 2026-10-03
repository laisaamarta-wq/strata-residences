import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { FLOORS, img } from '../data.js'

const STATUS = { g: 'Residents', '01': '2 of 4 available', '02': '3 of 4 available', '03': '1 of 3 available', '04': 'Reserved', '05': 'Available', ph: 'By appointment' }

export default function Residences({ onExplore }) {
  const root = useRef(null)
  const thumb = useRef(null)
  const [hov, setHov] = useState(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.res-row', { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.res-table', start: 'top 80%' } })
      gsap.fromTo('.res-head .ln > span', { yPercent: 110 }, { yPercent: 0, stagger: 0.1, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.res-head', start: 'top 80%' } })
    }, root)
    const xTo = gsap.quickTo(thumb.current, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(thumb.current, 'y', { duration: 0.6, ease: 'power3.out' })
    const mv = (e) => { xTo(e.clientX); yTo(e.clientY) }
    window.addEventListener('pointermove', mv)
    return () => { ctx.revert(); window.removeEventListener('pointermove', mv) }
  }, [])

  const rows = [...FLOORS].map((f, i) => ({ f, i })).reverse()

  return (
    <section id="residences" className="residences" ref={root}>
      <div className="wrap">
        <div className="res-head">
          <p className="kicker mono"><span>02</span><span>Residences</span></p>
          <h2 className="serif">
            <span className="ln"><span>Fifteen homes,</span></span>
            <span className="ln"><span><em>seven characters.</em></span></span>
          </h2>
        </div>
        <div className="res-table" role="table" onMouseLeave={() => setHov(null)}>
          <div className="res-row res-th mono" role="row">
            <span>Level</span><span>Residence</span><span>Area</span><span>Light</span><span>Status</span><span>Price</span><span />
          </div>
          {rows.map(({ f, i }) => (
            <button className="res-row" role="row" key={f.id} onMouseEnter={() => setHov(f)} onClick={() => onExplore(i)}>
              <span className="mono r-lv">{f.label}</span>
              <span className="r-name serif">{f.name}<small className="mono">{f.kind}</small></span>
              <span className="r-area">{f.specs[0][1]}</span>
              <span className="mono r-light">{f.hour} · {f.light}</span>
              <span className="mono r-status">{STATUS[f.id]}</span>
              <span className="r-price">{f.price}</span>
              <span className="r-go mono">Explore →</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`res-thumb ${hov ? 'on' : ''}`} ref={thumb} aria-hidden="true">
        {FLOORS.map((f) => (
          <img key={f.id} src={img(f.zones[0].img, 1280)} alt="" loading="lazy" className={hov?.id === f.id ? 'on' : ''} />
        ))}
      </div>
    </section>
  )
}
