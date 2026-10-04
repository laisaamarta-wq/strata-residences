import { MASTER, BUILDING_BOX } from '../data.js'

export const isMobile = (vw, vh = window.innerHeight) => vw < 760 || (vw < 1100 && vw / vh < 0.9)

// Resting camera: whole building, placed right-of-centre on desktop, lower-centre on mobile.
// vh is the stage height (stable), heroBottom the headline's bottom edge in stage coordinates.
export function baseLayout(vw, vh, heroBottom = 0) {
  const B = BUILDING_BOX
  const mobile = isMobile(vw, vh)
  let s, cx, cy
  if (mobile) {
    // the building is the hero: it takes the whole band from just under the headline
    // copy down to the floor bar (which sits 16 px + 48 px above the stage bottom)
    const top = Math.max(vh * 0.3, heroBottom - 8), bottom = vh - 70
    s = Math.min((vw * 0.94) / B.w, (bottom - top) / B.h)
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

// Mobile approach: the camera physically moves toward the building as the visitor
// scrolls the stage away. p is the stage's own scroll progress (0 = at rest,
// 1 = scrolled out); the move is a pure function of p, so every scroll position
// has exactly one camera and p = 0 is exactly the resting frame — no states to
// switch between, nothing to catch up with.
//  · push-in: scale grows around the building's centre, starting with a gentle but
//    non-zero speed (so the first touch already reads as motion) and gaining depth;
//  · parallax: the building travels up slower than the page, as a distant object would.
export const PUSH = { zoom: 0.62, lead: 0.4, lag: 0.34 }
export function pushCam(L, p, vh) {
  if (p <= 0) return L
  const B = BUILDING_BOX
  const e = PUSH.lead * p + (1 - PUSH.lead) * p * p // 0 → 1, slope 0.4 at the start
  const f = 1 + PUSH.zoom * e
  const ox = L.x + (B.x + B.w / 2) * L.s
  const oy = L.y + (B.y + B.h / 2) * L.s
  return {
    s: L.s * f,
    x: ox - (ox - L.x) * f,
    y: oy - (oy - L.y) * f + PUSH.lag * p * vh,
  }
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
