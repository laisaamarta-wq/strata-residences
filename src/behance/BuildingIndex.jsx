import { useEffect, useRef, useState } from 'react'
import { FLOORS, MASTER, img } from '../data.js'

// The part of the master image the index shows (image px)
const CROP = { x: 560, y: 150, w: 1540, h: 1210 }
const pct = (v, of) => `${(v / of) * 100}%`

/**
 * The building as an index: the same master image, slices and hit rectangles
 * (image coordinates from data.js) that drive the production stage.
 */
export default function BuildingIndex() {
  const [on, setOn] = useState(4)
  const [touched, setTouched] = useState(false)
  const root = useRef(null)

  // a slow tour of the levels until the visitor takes over
  useEffect(() => {
    if (touched) return
    let id = null
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id)
      if (e.isIntersecting) id = setInterval(() => setOn((o) => (o + 1) % FLOORS.length), 2600)
    }, { threshold: 0.35 })
    io.observe(root.current)
    return () => { io.disconnect(); clearInterval(id) }
  }, [touched])

  const pick = (i) => { setTouched(true); setOn(i) }
  const f = FLOORS[on]

  return (
    <div className="cs-index" ref={root}>
      <ol className="cs-index-list" aria-label="Levels">
        {[...FLOORS].map((x, i) => ({ x, i })).reverse().map(({ x, i }) => (
          <li key={x.id}>
            <button className={on === i ? 'on' : ''} onMouseEnter={() => pick(i)} onFocus={() => pick(i)} onClick={() => pick(i)}
              aria-pressed={on === i}>
              <span className="mono">{x.label}</span><i /><span>{x.name}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="cs-bld cs-slab" style={{ aspectRatio: `${CROP.w} / ${CROP.h}` }}>
        <div className="cs-bld-world" style={{ width: pct(MASTER.w, CROP.w), left: pct(-CROP.x, CROP.w), top: pct(-CROP.y, CROP.h), aspectRatio: `${MASTER.w} / ${MASTER.h}` }}>
          <img className="cs-bld-master" alt="STRATA at dusk — seven levels on the riverbank"
            src={img('hero', 1400)} srcSet={`${img('hero', 1400)} 1400w, ${img('hero', 2688)} 2688w`} sizes="(max-width: 900px) 160vw, 80vw" loading="lazy" />
          {FLOORS.map((x, i) => (
            <img key={x.id} className={`cs-bld-slice ${on === i ? 'on' : ''}`} alt="" src={`/img/slice-${x.id}.webp`} loading="lazy"
              style={{ left: pct(x.slice.x, MASTER.w), top: pct(x.slice.y, MASTER.h), width: pct(x.slice.w, MASTER.w), height: pct(x.slice.h, MASTER.h) }} />
          ))}
          <svg className="cs-bld-hits" viewBox={`0 0 ${MASTER.w} ${MASTER.h}`} aria-hidden="true">
            {FLOORS.map((x, i) => (
              <g key={x.id} className={`floor-hit ${on === i ? 'is-on' : ''}`} onPointerEnter={() => pick(i)} onClick={() => pick(i)}>
                <rect x={x.slice.x} y={x.slice.y} width={x.slice.w} height={x.slice.h} className="floor-fill" />
                <rect x={x.slice.x} y={x.slice.y} width={x.slice.w} height={x.slice.h} className="floor-line" pathLength="1" />
                <line x1={x.slice.x - 60} x2={x.slice.x - 6} y1={x.slice.y + x.slice.h} y2={x.slice.y + x.slice.h} className="floor-tick" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="cs-index-card" aria-live="polite">
        <div key={f.id} className="cs-index-in">
          <p className="mono cs-ic-k"><span>Level {f.label}</span><span>{f.elevation} m</span></p>
          <div className="serif cs-ic-num">{f.num}</div>
          <h3 className="serif cs-ic-name">{f.name}</h3>
          <p className="cs-ic-kind">{f.kind}</p>
          <dl className="cs-ic-rows">
            <div><dt className="mono">Hour</dt><dd>{f.hour}</dd></div>
            <div><dt className="mono">Light</dt><dd>{f.light}</dd></div>
            <div><dt className="mono">Material</dt><dd>{f.material}</dd></div>
            <div><dt className="mono">{f.specs[0][0]}</dt><dd>{f.specs[0][1]}</dd></div>
          </dl>
          <ul className="cs-ic-pal" aria-label="Palette">
            {f.palette.map(([n, c]) => <li key={n} title={n}><i style={{ background: c }} /><span className="mono">{n}</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
