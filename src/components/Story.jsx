import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLOORS, img, srcset } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

const CHAPTERS = [
  {
    k: 'Who designed it', img: 'facade-g',
    title: 'Studio Ainava',
    text: 'A Riga–Oslo practice working between landscape and building. For STRATA the brief was a single sentence: make a house for the river, not a tower above it.',
    facts: [['Founded', '2011'], ['Offices', 'Riga · Oslo'], ['Team', '34 architects']],
  },
  {
    k: 'Architecture', img: 'detail',
    title: 'Seven slabs, gently out of step',
    text: 'Each floor plate cantilevers up to 2.4 m and shifts a few centimetres from the one below, like layers of sediment. The deep edges shade the glass in summer and let the low winter sun reach far inside.',
    facts: [['Levels', '7'], ['Slab depth', '2.40 m'], ['Height', '24.6 m']],
  },
  {
    k: 'Materials', img: 'materials',
    title: 'Heavy at the water, light at the sky',
    text: 'Basalt at the plinth, honed travertine for every slab edge, bronze fins that weather to a soft brown, oak and lime plaster inside. Nothing is painted; everything is allowed to age.',
    facts: [['Stone', 'Travertine · Basalt'], ['Metal', 'Bronze, untreated'], ['Timber', 'Oak, walnut']],
  },
  {
    k: 'Light', img: '04-view',
    title: 'A different hour on every floor',
    text: 'Interiors were tuned to the light each level receives: misted mornings in the garden residences, silver noon on the second floor, long gold afternoons on the third, river sunsets above.',
    facts: [['Glazing', 'Floor to ceiling'], ['Ceiling', '3.1 m'], ['Aspect', 'Dual / corner']],
  },
  {
    k: 'Landscape', img: 'landscape',
    title: 'A birch grove on the riverbank',
    text: 'The plaza gives way to 1,400 m² of birch, fern and meadow grasses around a long reflecting pool that mirrors the building at dusk and collects rainwater from the roofs.',
    facts: [['Garden', '1,400 m²'], ['Trees', '62 birches'], ['Pool', '48 m']],
  },
  {
    k: 'Sustainability', img: 'ph-pool',
    title: 'Built to last a century',
    text: 'Ground-source heat pumps, a planted roof that slows storm water, triple glazing and a low-carbon concrete frame. Targeting BREEAM Excellent and a nearly-zero-energy rating.',
    facts: [['Energy', 'Class A · NZEB'], ['Heating', 'Ground source'], ['Target', 'BREEAM Excellent']],
  },
]

export default function Story() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // statement: words light up as you read
      const words = root.current.querySelectorAll('.statement .w')
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.05, ease: 'none',
        scrollTrigger: { trigger: '.statement', start: 'top 78%', end: 'bottom 45%', scrub: true },
      })
      gsap.fromTo('.statement-rule', { scaleX: 0 }, { scaleX: 1, ease: 'none', transformOrigin: '0 50%',
        scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 50%', scrub: true } })

      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        const frames = gsap.utils.toArray('.ch-frame')
        const chapters = gsap.utils.toArray('.chapter')
        gsap.set(frames, { clipPath: 'inset(100% 0% 0% 0%)' })
        gsap.set(frames[0], { clipPath: 'inset(0% 0% 0% 0%)' })
        chapters.forEach((ch, i) => {
          const fr = frames[i]
          const im = fr.querySelector('img')
          if (i > 0) {
            gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 85%', end: 'top 30%', scrub: 0.6 } })
              .to(fr, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut' }, 0)
              .fromTo(im, { scale: 1.25, yPercent: 6 }, { scale: 1.05, yPercent: 0, ease: 'power2.out' }, 0)
          }
          ScrollTrigger.create({
            trigger: ch, start: 'top 55%', end: 'bottom 55%',
            onToggle: (self) => {
              ch.classList.toggle('is-on', self.isActive)
              if (self.isActive) root.current.querySelector('.ch-count b').textContent = String(i + 1).padStart(2, '0')
            },
          })
        })
        gsap.to('.ch-progress i', { scaleY: 1, ease: 'none', transformOrigin: '50% 0',
          scrollTrigger: { trigger: '.chapters', start: 'top top', end: 'bottom bottom', scrub: true } })
      })
      mm.add('(max-width: 899px)', () => {
        gsap.utils.toArray('.chapter').forEach((ch) => {
          gsap.fromTo(ch.querySelector('.ch-m img'), { scale: 1.2 }, { scale: 1, ease: 'none',
            scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } })
          ch.classList.add('is-on')
        })
      })

      // hour strip
      gsap.fromTo('.hours li', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.08, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.hours', start: 'top 85%' } })
      gsap.fromTo('.break-img img', { yPercent: -12, scale: 1.15 }, { yPercent: 12, scale: 1.05, ease: 'none',
        scrollTrigger: { trigger: '.break', start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.fromTo('.break h2 .ln > span', { yPercent: 110 }, { yPercent: 0, stagger: 0.12, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.break', start: 'top 60%' } })
    }, root)
    return () => ctx.revert()
  }, [])

  const statement = 'Built the way a riverbank is built — in layers. Basalt at the waterline, travertine in the middle, glass where the building meets the sky.'

  return (
    <section id="architecture" className="story" ref={root}>
      <div className="wrap">
        <p className="kicker mono"><span>03</span><span>Architecture</span></p>
        <p className="statement serif">
          {statement.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)}
        </p>
        <span className="statement-rule" />
      </div>

      <div className="chapters">
        <div className="ch-media">
          <div className="ch-sticky">
            {CHAPTERS.map((c) => (
              <figure className="ch-frame" key={c.k}>
                <img alt={c.title} src={img(c.img, 1280)} srcSet={srcset(c.img)} sizes="50vw" loading="lazy" />
              </figure>
            ))}
            <div className="ch-count mono"><b>01</b> / {String(CHAPTERS.length).padStart(2, '0')}</div>
            <div className="ch-progress"><i /></div>
          </div>
        </div>
        <div className="ch-text">
          {CHAPTERS.map((c, i) => (
            <article className="chapter" key={c.k}>
              <div className="ch-m"><img alt="" src={img(c.img, 1280)} loading="lazy" /></div>
              <p className="mono ch-k"><span>{String(i + 1).padStart(2, '0')}</span>{c.k}</p>
              <h3 className="serif">{c.title}</h3>
              <p className="ch-p">{c.text}</p>
              <dl className="ch-facts">
                {c.facts.map(([a, b]) => <div key={a}><dt className="mono">{a}</dt><dd>{b}</dd></div>)}
              </dl>
            </article>
          ))}
        </div>
      </div>

      <div className="break">
        <div className="break-img"><img alt="Terrace on the third floor at golden hour" src={img('03-terrace', 2400)} srcSet={srcset('03-terrace')} sizes="100vw" loading="lazy" /></div>
        <div className="break-in">
          <h2 className="serif">
            <span className="ln"><span>Every level keeps</span></span>
            <span className="ln"><span><em>a different hour.</em></span></span>
          </h2>
          <ol className="hours">
            {FLOORS.slice(1).map((f) => (
              <li key={f.id}><span className="mono">{f.label}</span><b className="serif">{f.hour}</b><span className="mono">{f.light}</span></li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
