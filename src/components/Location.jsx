import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const HOME = { x: 488, y: 330 }
const PLACES = [
  { id: 'old', name: 'Old Town · Dom Square', x: 735, y: 318, dist: '1.2 km', time: '15 min walk' },
  { id: 'peter', name: 'St Peter’s Church', x: 765, y: 385, dist: '1.4 km', time: '17 min walk' },
  { id: 'lib', name: 'National Library', x: 548, y: 520, dist: '1.1 km', time: '14 min walk' },
  { id: 'vansu', name: 'Vanšu Bridge', x: 574, y: 236, dist: '400 m', time: '5 min walk' },
  { id: 'prom', name: 'Ķīpsala riverfront', x: 452, y: 276, end: true, dist: '150 m', time: '2 min walk' },
  { id: 'market', name: 'Central Market', x: 850, y: 545, dist: '2.4 km', time: '8 min by car' },
]

export default function Location() {
  const root = useRef(null)
  const [on, setOn] = useState('old')
  const cur = PLACES.find((p) => p.id === on)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 65%' } })
      tl.fromTo('.map-draw', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, stagger: 0.04, ease: 'power2.inOut' })
        .fromTo('.map-river', { opacity: 0 }, { opacity: 1, duration: 1.6 }, 0.2)
        .fromTo('.map-ring', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, stagger: 0.18, ease: 'expo.out', svgOrigin: `${HOME.x} ${HOME.y}` }, 0.6)
        .fromTo('.map-pt', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 1.0)
        .fromTo('.loc-list li', { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.06, duration: 0.8, ease: 'power3.out' }, 0.4)
    }, root)
    return () => ctx.revert()
  }, [])

  const blocks = []
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    if ((r + c) % 5 === 3) continue
    blocks.push({ x: 690 + c * 26 + (r % 2) * 6, y: 270 + r * 26, w: 18 + ((r * c) % 3) * 3, h: 18 })
  }

  return (
    <section id="location" className="location" ref={root}>
      <div className="wrap loc-grid">
        <div className="loc-text">
          <p className="kicker mono"><span>04</span><span>Location</span></p>
          <h2 className="serif">Ķīpsala.<br /><em>An island facing the Old Town.</em></h2>
          <p className="loc-p">
            A quiet residential island on the left bank of the Daugava, joined to the city by the Vanšu Bridge.
            Wooden villas, the river promenade and the spires of the Old Town directly across the water.
          </p>
          <ul className="loc-list">
            {PLACES.map((p) => (
              <li key={p.id} className={on === p.id ? 'on' : ''} onMouseEnter={() => setOn(p.id)} onClick={() => setOn(p.id)}>
                <span className="ll-name">{p.name}</span>
                <span className="ll-dots" />
                <span className="mono ll-d">{p.dist}</span>
                <span className="mono ll-t">{p.time}</span>
              </li>
            ))}
            <li className="ll-air"><span className="ll-name">Riga International Airport</span><span className="ll-dots" /><span className="mono ll-d">11 km</span><span className="mono ll-t">15 min by car</span></li>
          </ul>
        </div>

        <div className="map">
          <svg viewBox="0 0 1000 720" role="img" aria-label="Stylised map of Ķīpsala and Riga Old Town">
            <defs>
              <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.9" fill="currentColor" opacity="0.22" />
              </pattern>
              <clipPath id="mapclip"><rect x="0" y="0" width="1000" height="720" /></clipPath>
            </defs>
            <g clipPath="url(#mapclip)">
              <rect x="0" y="0" width="1000" height="720" fill="url(#dots)" />
              {/* river */}
              <path className="map-river" d="M 440 -10 C 505 150, 545 280, 570 400 S 640 620, 750 730 L 905 730 C 795 610, 740 480, 718 380 S 655 140, 615 -10 Z" />
              {[0, 1, 2, 3].map((k) => (
                <path key={k} className="map-flow" style={{ animationDelay: `${-k * 2.5}s` }}
                  d={`M ${505 + k * 30} -10 C ${560 + k * 30} 150, ${595 + k * 28} 280, ${620 + k * 28} 400 S ${690 + k * 26} 620, ${800 + k * 22} 730`} />
              ))}
              <path className="map-draw map-water" pathLength="1" d="M 440 -10 C 505 150, 545 280, 570 400 S 640 620, 750 730" />
              <path className="map-draw map-water" pathLength="1" d="M 615 -10 C 655 140, 718 380, 718 380 S 795 610, 905 730" />
              {/* Zunds channel */}
              <path className="map-draw map-channel" pathLength="1" d="M 330 -10 C 312 120, 300 260, 328 400 S 420 560, 572 548" />
              {/* streets */}
              <path className="map-draw map-street" pathLength="1" d="M 0 250 L 330 245 L 560 228 L 680 205 L 1000 170" />
              <path className="map-draw map-street" pathLength="1" d="M 0 470 L 320 455 L 575 470 L 740 448 L 1000 440" />
              <path className="map-draw map-street" pathLength="1" d="M 860 -10 L 830 300 L 870 720" />
              <path className="map-draw map-street" pathLength="1" d="M 120 -10 L 160 720" />
              <path className="map-draw map-street thin" pathLength="1" d="M 360 120 L 520 112 M 352 360 L 545 352 M 380 520 L 560 505" />
              {/* bridges */}
              <path className="map-draw map-bridge" pathLength="1" d="M 520 232 L 650 206" />
              <path className="map-draw map-bridge" pathLength="1" d="M 565 472 L 725 450" />
              {/* old town blocks */}
              {blocks.map((b, i) => <rect key={i} className="map-draw map-block" pathLength="1" x={b.x} y={b.y} width={b.w} height={b.h} />)}
              {/* walking rings */}
              {[84, 168, 252].map((r, i) => (
                <g key={r}>
                  <circle className="map-ring" cx={HOME.x} cy={HOME.y} r={r} />
                  <text className="map-ring-t mono" x={HOME.x + r * 0.71 + 4} y={HOME.y - r * 0.71 - 4}>{(i + 1) * 5} min</text>
                </g>
              ))}
              {/* route line to the selected place */}
              {cur && (
                <g key={cur.id} className="map-route">
                  <line x1={HOME.x} y1={HOME.y} x2={cur.x} y2={cur.y} pathLength="1" />
                  <text className="mono" x={(HOME.x + cur.x) / 2 + 8} y={(HOME.y + cur.y) / 2 - 8}>{cur.dist}</text>
                </g>
              )}
              {PLACES.map((p) => (
                <g key={p.id} className={`map-pt ${on === p.id ? 'on' : ''}`}
                  onMouseEnter={() => setOn(p.id)}>
                  <circle cx={p.x} cy={p.y} r="5" />
                  <text className="mono" x={p.end ? p.x - 10 : p.x + 10} y={p.y + 4} textAnchor={p.end ? 'end' : 'start'}>{p.name}</text>
                </g>
              ))}
              {/* home */}
              <g className="map-home" style={{ transformOrigin: `${HOME.x}px ${HOME.y}px` }}>
                <circle className="pulse" cx={HOME.x} cy={HOME.y} r="12" />
                <rect x={HOME.x - 7} y={HOME.y - 7} width="14" height="14" />
                <text className="serif" x={HOME.x - 16} y={HOME.y + 26} textAnchor="end">STRATA</text>
              </g>
              <text className="map-name mono" x="390" y="170" transform="rotate(-80 390 170)">Ķīpsala</text>
              <text className="map-name mono" x="610" y="95" transform="rotate(68 610 95)">Daugava</text>
              <text className="map-name mono" x="770" y="250">Vecrīga</text>
            </g>
            {/* drawing frame + ticks */}
            <rect className="map-frame" x="0.5" y="0.5" width="999" height="719" />
            {Array.from({ length: 11 }).map((_, i) => (
              <g key={i} className="map-tick">
                <line x1={i * 100} y1="0" x2={i * 100} y2="10" />
                <line x1={i * 100} y1="710" x2={i * 100} y2="720" />
              </g>
            ))}
            <text className="map-coord mono" x="12" y="24">56°57′ N</text>
            <text className="map-coord mono" x="12" y="708">24°05′ E</text>
            <g className="map-north" transform="translate(955 52)">
              <circle r="16" /><path d="M0 -12 L5 7 L0 3 L-5 7 Z" /><text y="-22" textAnchor="middle" className="mono">N</text>
            </g>
          </svg>
        </div>
      </div>
    </section>
  )
}
