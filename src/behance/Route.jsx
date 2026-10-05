import { useEffect, useRef, useState } from 'react'

/**
 * Navigation, shown as a route through the building.
 * Seven real states of the production site, in the order a visitor meets them.
 * The frames are stills from the recordings; the marker walks the route on its own
 * while the section is in view, and every stop can be chosen directly.
 */
const STOPS = [
  { k: 'Building', g: 'Hover', t: 'A floor lights up and names itself.', im: 'route-building' },
  { k: 'Level', g: 'Click', t: 'The camera walks in through the glass.', im: 'route-level' },
  { k: 'Room', g: 'Rooms', t: 'Living, kitchen, the view — one tap each.', im: 'route-room' },
  { k: 'Plan', g: 'Floor plan', t: 'The drawing of the same home; rooms are doors.', im: 'route-plan' },
  { k: 'Details', g: 'Details', t: 'Figures, materials, price — beside the room.', im: 'route-details' },
  { k: 'Elevator', g: 'Level bar', t: 'Up or down without leaving the residence.', im: 'route-elevator' },
  { k: 'Return', g: 'Scroll · Esc', t: 'One step back, always: panel, room, building.', im: 'route-return' },
]

export default function Route() {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)
  const root = useRef(null)

  useEffect(() => {
    if (!auto) return
    let id = null
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id)
      if (e.isIntersecting) id = setInterval(() => setI((x) => (x + 1) % STOPS.length), 2800)
    }, { threshold: 0.4 })
    io.observe(root.current)
    return () => { io.disconnect(); clearInterval(id) }
  }, [auto])

  const pick = (k) => { setAuto(false); setI(k) }
  const s = STOPS[i]
  const pos = (k) => `${(k / (STOPS.length - 1)) * 100}%`

  return (
    <div className="cs-route" ref={root}>
      <div className="cs-route-line" aria-hidden="true">
        <i className="cs-route-done" style={{ width: pos(i) }} />
        <b className="cs-route-dot" style={{ left: pos(i) }} />
      </div>
      <ol className="cs-route-stops">
        {STOPS.map((x, k) => (
          <li key={x.k} style={{ left: pos(k) }} className={k === i ? 'on' : k < i ? 'past' : ''}>
            <button onClick={() => pick(k)} onMouseEnter={() => pick(k)} aria-pressed={k === i}>
              <span className="mono cs-route-n">{String(k + 1).padStart(2, '0')}</span>
              <span className="cs-route-k">{x.k}</span>
              <span className="mono cs-route-g">{x.g}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="cs-route-view">
        <figure className="cs-route-frame">
          {STOPS.map((x, k) => (
            <img key={x.im} className={k === i ? 'on' : ''} src={`/behance/media/${x.im}.webp`} alt={`${x.k} — ${x.t}`} loading="lazy" />
          ))}
        </figure>
        <p className="cs-route-cap" key={s.k} aria-live="polite">
          <span className="mono">{String(i + 1).padStart(2, '0')} · {s.g}</span>
          <span className="serif">{s.t}</span>
        </p>
      </div>
    </div>
  )
}
