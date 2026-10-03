import { useMemo } from 'react'

const UNIT = 0.18 // metres per plan unit

export default function Plan({ floor, zone, onZone }) {
  const { rooms, outdoor = [], pool } = floor.plan
  const zoneId = floor.zones[zone]?.id

  const box = useMemo(() => {
    const all = [...rooms, ...outdoor]
    const x0 = Math.min(...all.map((r) => r.x)), y0 = Math.min(...all.map((r) => r.y))
    const x1 = Math.max(...all.map((r) => r.x + r.w)), y1 = Math.max(...all.map((r) => r.y + r.h))
    return { x0, y0, x1, y1 }
  }, [rooms, outdoor])

  const shell = useMemo(() => {
    const x0 = Math.min(...rooms.map((r) => r.x)), y0 = Math.min(...rooms.map((r) => r.y))
    const x1 = Math.max(...rooms.map((r) => r.x + r.w)), y1 = Math.max(...rooms.map((r) => r.y + r.h))
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  }, [rooms])

  const pad = 16
  const vb = `${box.x0 - pad} ${box.y0 - pad} ${box.x1 - box.x0 + pad * 2} ${box.y1 - box.y0 + pad * 2}`
  let n = 0
  const d = () => ({ style: { animationDelay: `${0.15 + n++ * 0.06}s` } })

  return (
    <svg className="plan-svg" viewBox={vb} role="img" aria-label={`Floor plan — ${floor.name}`}>
      <defs>
        <pattern id={`hatch-${floor.id}`} width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="2.2" stroke="currentColor" strokeWidth="0.18" opacity="0.45" />
        </pattern>
      </defs>

      {/* dimension lines */}
      <g className="plan-dim" {...d()}>
        <line x1={shell.x} y1={box.y0 - 8} x2={shell.x + shell.w} y2={box.y0 - 8} pathLength="1" />
        <line x1={shell.x} y1={box.y0 - 10} x2={shell.x} y2={box.y0 - 6} pathLength="1" />
        <line x1={shell.x + shell.w} y1={box.y0 - 10} x2={shell.x + shell.w} y2={box.y0 - 6} pathLength="1" />
        <text x={shell.x + shell.w / 2} y={box.y0 - 9.6} textAnchor="middle">{(shell.w * UNIT).toFixed(2)} m</text>
        <line x1={box.x0 - 8} y1={shell.y} x2={box.x0 - 8} y2={shell.y + shell.h} pathLength="1" />
        <line x1={box.x0 - 10} y1={shell.y} x2={box.x0 - 6} y2={shell.y} pathLength="1" />
        <line x1={box.x0 - 10} y1={shell.y + shell.h} x2={box.x0 - 6} y2={shell.y + shell.h} pathLength="1" />
        <text x={box.x0 - 9.6} y={shell.y + shell.h / 2} textAnchor="middle" transform={`rotate(-90 ${box.x0 - 9.6} ${shell.y + shell.h / 2})`}>
          {(shell.h * UNIT).toFixed(2)} m
        </text>
      </g>

      {outdoor.map((o, k) => (
        <g key={`o${k}`} className={`plan-out ${o.zone ? 'is-link' : ''} ${o.zone === zoneId ? 'is-on' : ''}`}
          onClick={() => o.zone && onZone(floor.zones.findIndex((z) => z.id === o.zone))}>
          <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#hatch-${floor.id})`} pathLength="1" {...d()} />
          <text x={o.x + o.w / 2} y={o.y + o.h / 2} textAnchor="middle" dominantBaseline="middle"
            transform={o.vertical ? `rotate(-90 ${o.x + o.w / 2} ${o.y + o.h / 2})` : undefined}>{o.label}</text>
        </g>
      ))}

      <rect className="plan-shell" x={shell.x} y={shell.y} width={shell.w} height={shell.h} pathLength="1" {...d()} />

      {rooms.map((r, k) => {
        const link = r.zone ? floor.zones.findIndex((z) => z.id === r.zone) : -1
        return (
          <g key={k} className={`plan-room ${link >= 0 ? 'is-link' : ''} ${r.zone && r.zone === zoneId ? 'is-on' : ''}`}
            onClick={() => link >= 0 && onZone(link)}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} pathLength="1" {...d()} />
            <text className="plan-label" x={r.x + r.w / 2} y={r.y + r.h / 2 - (r.area ? 1.2 : 0)} textAnchor="middle" dominantBaseline="middle">{r.label}</text>
            {r.area && <text className="plan-area" x={r.x + r.w / 2} y={r.y + r.h / 2 + 2.6} textAnchor="middle" dominantBaseline="middle">{r.area}</text>}
            {link >= 0 && <circle className="plan-eye" cx={r.x + r.w - 3} cy={r.y + 3} r="1.1" />}
          </g>
        )
      })}

      {pool && <rect className="plan-pool" x={pool.x} y={pool.y} width={pool.w} height={pool.h} pathLength="1" {...d()} />}

      {/* north arrow + scale */}
      <g className="plan-north" transform={`translate(${box.x1 + 6} ${box.y0 - 6})`}>
        <circle r="3.4" pathLength="1" />
        <path d="M0 -2.6 L1.2 1.6 L0 0.8 L-1.2 1.6 Z" />
        <text y="-5" textAnchor="middle">N</text>
      </g>
      <g className="plan-scale" transform={`translate(${box.x1 - 28} ${box.y1 + 9})`}>
        <line x1="0" y1="0" x2={5 / UNIT} y2="0" pathLength="1" />
        <line x1="0" y1="-1" x2="0" y2="1" />
        <line x1={5 / UNIT} y1="-1" x2={5 / UNIT} y2="1" />
        <text x={5 / UNIT + 2} y="0.6">5 m</text>
      </g>
    </svg>
  )
}
