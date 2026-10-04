import gsap from 'gsap'
import { FLOORS } from '../data.js'
import { baseLayout, floorCam, zoomAbout, facadeMatchScale, isMobile } from './camera.js'

const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The Director owns every camera move on the stage.
 * React renders the layers; the Director animates them imperatively with GSAP.
 */
export class Director {
  constructor(els, onState) {
    this.els = els
    this.onState = onState
    this.mode = 'overview' // overview | moving | floor
    this.active = -1
    this.zone = 0
    this.tl = null
    this.queue = null
    this.layout()
    gsap.set(this.els.world, { transformOrigin: '0 0', ...this.camProps(this.L) })
    gsap.set([...els.facades, ...els.interiors, els.plate, els.flash], { opacity: 0 })
    gsap.set(els.slices, { opacity: 0 })
    els.interiors.forEach((el) => {
      const imgs = el.querySelectorAll('img')
      gsap.set(imgs, { opacity: 0 })
      if (imgs[0]) gsap.set(imgs[0], { opacity: 1 })
    })
  }

  get vw() { return window.innerWidth }
  get vh() { return window.innerHeight }

  camProps(c) { return { x: c.x, y: c.y, scale: c.s } }

  layout() {
    this.L = baseLayout(this.vw, this.vh)
    return this.L
  }

  resize() {
    this.layout()
    if (this.mode === 'overview') {
      gsap.set(this.els.world, this.camProps(this.L))
    } else if (this.mode === 'floor' && this.active >= 0) {
      // rebuild the timeline for the new viewport, parked at its end
      this.tl?.kill()
      this.tl = this.buildEnter(this.active)
      this.tl.progress(1).pause()
    }
    this.emit()
  }

  emit() {
    this.onState({ mode: this.mode, active: this.active, zone: this.zone, L: this.L })
  }

  // ---------- asset loading ----------
  loadImg(el) {
    if (!el || el.getAttribute('src')) return Promise.resolve()
    const ds = el.dataset
    if (ds.srcset) el.setAttribute('srcset', ds.srcset)
    el.setAttribute('src', ds.src)
    return el.decode ? el.decode().catch(() => {}) : Promise.resolve()
  }
  preloadFloor(i) {
    if (i < 0) return Promise.resolve()
    const f = this.els.facades[i]
    const imgs = [...this.els.interiors[i].querySelectorAll('img')]
    return Promise.all([this.loadImg(f), this.loadImg(imgs[0]), ...imgs.slice(1).map((im) => this.loadImg(im))])
  }
  preloadAllFacades() {
    this.els.facades.forEach((f) => this.loadImg(f))
  }

  // ---------- public API ----------
  go(i) {
    if (i === this.active && this.mode === 'floor') return
    if (this.mode === 'moving') { this.queue = i; return }
    if (i < 0) return this.back()
    if (this.mode === 'overview') return this.enter(i)
    return this.elevator(this.active, i)
  }
  finish() {
    this.mode = this.active >= 0 ? 'floor' : 'overview'
    this.emit()
    if (this.queue !== null) {
      const q = this.queue
      this.queue = null
      if (q !== this.active) setTimeout(() => this.go(q), 60)
    }
  }

  // ---------- building → floor ----------
  buildEnter(i) {
    const { world, master, plate, slices, facades, interiors, flash } = this.els
    const vw = this.vw, vh = this.vh
    const fl = FLOORS[i]
    const L = this.L
    const C1 = floorCam(fl.slice, vw, vh)
    const m = facadeMatchScale(fl.slice, C1, vw, vh)
    const C2 = zoomAbout(C1, 1 / m, vw, vh)
    const mobile = isMobile(vw)

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: false, lazy: false } })

    // Phase 0 — swap the flat image for the stacked floor slices
    tl.fromTo(slices, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0)
    tl.fromTo(master, { opacity: 1 }, { opacity: 0, duration: 0.45, ease: 'power1.inOut' }, 0.02)
    tl.fromTo(plate, { opacity: 0, filter: 'brightness(1)' },
      { opacity: 1, filter: 'brightness(0.42)', duration: 1.2, ease: 'power2.inOut' }, 0)

    // Phase 1 — dolly to the floor; the building opens up and down around it
    tl.fromTo(world, this.camProps(L), { ...this.camProps(C1), duration: 1.45, ease: 'power3.inOut' }, 0)
    slices.forEach((el, j) => {
      if (j === i) {
        tl.fromTo(el, { y: 0, scale: 1, filter: 'brightness(1)' },
          { y: 0, scale: 1.015, filter: 'brightness(1.12)', duration: 1.3, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0.1)
        return
      }
      const d = j - i
      const dir = d > 0 ? -1 : 1 // floors above go up, below go down
      const spread = ((vh * (mobile ? 0.16 : 0.15)) + Math.abs(d) * vh * 0.09) / C1.s
      tl.fromTo(el, { y: 0, opacity: 1, scale: 1, filter: 'brightness(1)' },
        { y: dir * spread, opacity: Math.max(0.1, 0.55 - Math.abs(d) * 0.12), scale: 0.9, filter: 'brightness(0.7)',
          duration: 1.45, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0.05)
    })

    // Phase 2 — matched cut: slice → photographic close-up of the same floor
    const T2 = 1.2
    tl.fromTo(world, this.camProps(C1), { ...this.camProps(C2), duration: 1.0, ease: 'power2.in', immediateRender: false }, T2)
    tl.fromTo(facades[i], { opacity: 0, scale: m, filter: 'blur(4px)', '--fe': '22%' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', '--fe': '0%', duration: 1.0, ease: 'power2.in' }, T2)

    // Phase 3 — push through the glass into the interior
    const T3 = 2.12
    tl.fromTo(facades[i], { scale: 1 }, { scale: 1.55, duration: 1.0, ease: 'power2.in', immediateRender: false }, T3)
    tl.to(facades[i], { filter: 'blur(10px)', opacity: 0, duration: 0.5, ease: 'power1.in' }, T3 + 0.45)
    tl.fromTo(flash, { opacity: 0 }, { opacity: 0.55, duration: 0.35, ease: 'power1.in' }, T3 + 0.45)
    tl.to(flash, { opacity: 0, duration: 0.7, ease: 'power2.out' }, T3 + 0.8)
    tl.fromTo(interiors[i], { opacity: 0, scale: 1.32, filter: 'blur(14px)' },
      { opacity: 1, scale: 1.0, filter: 'blur(0px)', duration: 1.25, ease: 'power3.out' }, T3 + 0.55)

    tl.timeScale(reduce ? 3 : 1.12)
    return tl
  }

  async enter(i) {
    this.mode = 'moving'
    this.active = i
    this.zone = 0
    this.resetZones(i)
    this.emit()
    this.onState({ phase: 'leaving-overview' })
    await this.preloadFloor(i)
    gsap.killTweensOf(this.els.slices)
    this.tl?.kill()
    this.tl = this.buildEnter(i)
    this.tl.eventCallback('onComplete', () => this.finish())
    this.tl.call(() => this.onState({ phase: 'floor-ui' }), null, 2.55)
    this.tl.play(0)
  }

  back() {
    if (this.mode !== 'floor' || !this.tl) return
    this.mode = 'moving'
    const tl = this.tl
    this.onState({ phase: 'leaving-floor' })
    this.emit()
    tl.eventCallback('onComplete', null)
    tl.eventCallback('onReverseComplete', () => {
      this.active = -1
      gsap.set(this.els.slices, { opacity: 0 })
      gsap.set(this.els.master, { opacity: 1 })
      gsap.set(this.els.world, { opacity: 1, ...this.camProps(this.L) })
      gsap.set(this.els.plate, { opacity: 0 })
      this.finish()
    })
    tl.call(() => this.onState({ phase: 'overview-ui' }), null, 0.5)
    tl.timeScale(reduce ? 3 : 1.4).reverse()
  }

  // ---------- floor → floor: the elevator ----------
  async elevator(from, to) {
    this.mode = 'moving'
    const { facades, interiors, flash } = this.els
    const dir = to > from ? 1 : -1
    const path = []
    for (let k = from; k !== to + dir; k += dir) path.push(k)
    this.active = to
    this.zone = 0
    this.resetZones(to)
    this.emit()
    this.onState({ phase: 'elevator', from, to })
    await Promise.all(path.map((k) => this.loadImg(facades[k]))).then(() => this.preloadFloor(to))

    this.tl?.kill()
    const n = path.length - 1
    const tl = gsap.timeline()
    // 1. step back out to the facade
    tl.to(interiors[from], { opacity: 0, scale: 1.12, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' }, 0)
    tl.fromTo(facades[from], { opacity: 0, scale: 1.4, filter: 'blur(8px)', yPercent: 0 },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.75, ease: 'power3.out' }, 0.2)
    // 2. travel vertically along the facade, floor by floor
    const p = { v: 0 }
    path.forEach((k, idx) => {
      if (idx > 0) tl.set(facades[k], { opacity: 1, scale: 1, filter: 'blur(0px)', yPercent: -dir * 100 * idx }, 0.9)
    })
    const travel = reduce ? 0.3 : 0.75 + n * 0.32
    tl.to(p, {
      v: n, duration: travel, ease: 'power2.inOut',
      onUpdate: () => {
        path.forEach((k, idx) => {
          const off = (p.v - idx) * 100 * dir // moving up → content slides down
          gsap.set(facades[k], { yPercent: off })
        })
        const near = path[Math.round(p.v)]
        if (near !== this._lastNear) { this._lastNear = near; this.onState({ phase: 'elevator-pass', at: near }) }
      },
    }, 0.95)
    const T = 0.95 + travel
    // 3. push into the new interior
    tl.to(facades[to], { scale: 1.55, duration: 1.0, ease: 'power2.in' }, T + 0.05)
    tl.to(facades[to], { filter: 'blur(10px)', opacity: 0, duration: 0.5, ease: 'power1.in' }, T + 0.5)
    tl.fromTo(flash, { opacity: 0 }, { opacity: 0.45, duration: 0.35 }, T + 0.5)
    tl.to(flash, { opacity: 0, duration: 0.7, ease: 'power2.out' }, T + 0.85)
    tl.fromTo(interiors[to], { opacity: 0, scale: 1.32, filter: 'blur(14px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.25, ease: 'power3.out' }, T + 0.6)
    tl.call(() => this.onState({ phase: 'floor-ui' }), null, T + 0.7)
    tl.timeScale(reduce ? 3 : 1.1)
    tl.eventCallback('onComplete', () => {
      path.forEach((k) => { if (k !== to) gsap.set(facades[k], { opacity: 0, yPercent: 0 }) })
      gsap.set(facades[to], { yPercent: 0 })
      gsap.set(interiors[from], { opacity: 0, scale: 1, filter: 'blur(0px)' })
      // park a fresh building→floor timeline at its end so "back" can reverse it
      this.tl = this.buildEnter(to)
      this.tl.progress(1).pause()
      this.finish()
    })
  }

  // ---------- zones inside a floor ----------
  resetZones(i) {
    const imgs = this.els.interiors[i].querySelectorAll('img')
    this.drift?.kill()
    gsap.killTweensOf(imgs)
    imgs.forEach((im, k) => gsap.set(im, { opacity: k === 0 ? 1 : 0, xPercent: 0, scale: 1 }))
    this.startDrift(imgs[0])
  }
  startDrift(el) {
    this.drift?.kill()
    if (!el || reduce) return
    this.drift = gsap.fromTo(el, { scale: 1.0 }, { scale: 1.06, duration: 16, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  }
  setZone(z) {
    if (this.mode !== 'floor' || z === this.zone) return
    const imgs = [...this.els.interiors[this.active].querySelectorAll('img')]
    const nxt = imgs[z]
    if (!nxt) return
    const dir = z > this.zone ? 1 : -1
    this.loadImg(nxt)
    this.drift?.kill()
    // Interruption-safe: every other image fades out from wherever it currently is,
    // so rapid switching never leaves two rooms stacked on screen.
    imgs.forEach((im) => {
      if (im === nxt) return
      gsap.to(im, { opacity: 0, xPercent: -2.5 * dir, scale: 1.04, duration: 0.9, ease: 'power2.inOut', overwrite: true })
    })
    const midway = +gsap.getProperty(nxt, 'opacity') > 0.05
    const to = { opacity: 1, xPercent: 0, scale: 1, duration: 1.1, ease: 'power3.out', overwrite: true, onComplete: () => this.startDrift(nxt) }
    if (midway) gsap.to(nxt, to)
    else gsap.fromTo(nxt, { opacity: 0, xPercent: 3 * dir, scale: 1.06 }, { ...to, delay: 0.08 })
    this.zone = z
    this.emit()
  }
}

