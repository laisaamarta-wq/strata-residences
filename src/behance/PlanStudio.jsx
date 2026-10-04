import { useState } from 'react'
import { FLOORS, img, srcset } from '../data.js'
import Plan from '../components/Plan.jsx'

/**
 * The production floor-plan component, unchanged: it draws itself line by line
 * and its highlighted rooms are doors into the photographs.
 */
export default function PlanStudio() {
  const [fi, setFi] = useState(4)
  const [zone, setZone] = useState(0)
  const f = FLOORS[fi]
  const z = f.zones[zone] || f.zones[0]

  return (
    <div className="cs-plans">
      <div className="cs-plan-tabs mono" role="tablist" aria-label="Level">
        {FLOORS.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={fi === i} className={fi === i ? 'on' : ''}
            onClick={() => { setFi(i); setZone(0) }}>{x.label}</button>
        ))}
      </div>
      <div className="cs-plan-grid">
        <div className="cs-plan-draw">
          <p className="mono cs-plan-cap"><span>{f.name}</span><span>{f.kind}</span></p>
          {/* key → the drawing replays for each level */}
          <Plan key={f.id} floor={f} zone={zone} onZone={(k) => k >= 0 && setZone(k)} />
          <p className="mono cs-plan-hint">Highlighted rooms are doors — select one</p>
        </div>
        <figure className="cs-plan-photo">
          {f.zones.map((x, k) => (
            <img key={`${f.id}-${x.id}`} className={k === zone ? 'on' : ''} alt={`${f.name} — ${x.name}`}
              src={img(x.img, 1280)} srcSet={srcset(x.img)} sizes="(max-width: 900px) 100vw, 46vw" loading="lazy" />
          ))}
          <figcaption className="mono"><span>{String(zone + 1).padStart(2, '0')}</span>{z.name}</figcaption>
        </figure>
      </div>
    </div>
  )
}
