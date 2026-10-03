import { MASTER, BUILDING_BOX } from '../data.js'

export const isMobile = (vw, vh = window.innerHeight) => vw < 760 || (vw < 1100 && vw / vh < 0.9)

// Resting camera: whole building, placed right-of-centre on desktop, lower-centre on mobile.
export function baseLayout(vw, vh) {
  const B = BUILDING_BOX
  const mobile = isMobile(vw, vh)
  let s, cx, cy
  if (mobile) {
    // building sits in the band between the headline and the floor bar
    const hero = typeof document !== 'undefined' && document.querySelector('.hero-copy')
    const heroBottom = hero ? hero.getBoundingClientRect().bottom + 18 : 0
    const top = Math.max(vh * 0.43, heroBottom), bottom = vh - 92
    s = Math.min((vw * 0.86) / B.w, (bottom - top) / B.h)
    cx = vw / 2
    cy = (top + bottom) / 2
  } else {
    s = Math.min((vh * 0.8) / B.h, (vw * 0.5) / B.w)
    cx = vw * 0.6
    cy = vh * 0.535
  }
  s = Math.max(s, vw / MASTER.w)
  let tx = cx - (B.x + B.w / 2) * s
  let ty = cy - (B.y + B.h / 2) * s
  tx = Math.min(0, Math.max(vw - MASTER.w * s, tx))
  if (ty + MASTER.h * s < vh) ty = vh - MASTER.h * s
  if (!mobile && ty > 0) ty = 0
  return { s, x: tx, y: ty }
}

// Camera framing one floor slice in the centre of the screen.
export function floorCam(slice, vw, vh) {
  const mobile = isMobile(vw, vh)
  const k = mobile ? 1.02 : 1.06
  const s = Math.min((vw * k) / slice.w, (vh * 0.5) / slice.h)
  return {
    s,
    x: vw / 2 - (slice.x + slice.w / 2) * s,
    y: vh / 2 - (slice.y + slice.h / 2) * s,
  }
}

// Zoom a camera by factor f around the screen centre.
export function zoomAbout(cam, f, vw, vh) {
  return {
    s: cam.s * f,
    x: vw / 2 - (vw / 2 - cam.x) * f,
    y: vh / 2 - (vh / 2 - cam.y) * f,
  }
}

// Scale at which the (cover-fitted) facade close-up matches the slice on screen.
// The close-ups frame roughly the central 58% of a floor's width.
export function facadeMatchScale(slice, cam, vw, vh) {
  const coverW = Math.max(vw, (vh * 16) / 9)
  const sliceW = slice.w * cam.s
  return Math.min(1, (0.58 * sliceW) / coverW)
}

export const toScreen = (L, x, y) => ({ x: L.x + x * L.s, y: L.y + y * L.s })
export const toImage = (L, x, y) => ({ x: (x - L.x) / L.s, y: (y - L.y) / L.s })
