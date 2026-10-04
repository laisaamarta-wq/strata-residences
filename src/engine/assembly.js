/*
 * The STRATA assembly — one construction language for the site and for Behind the Case.
 *
 * The building is laid down the way it is named: in strata. Each of the seven floor
 * slices of the production stage (cut from the real photograph, in image coordinates)
 * is lowered onto the one below, ground floor first. A slab arrives from above with
 * weight — a decelerating descent that stops dead on its seat (power3.out: no bounce,
 * no overshoot) — and only then does the photograph resolve over the finished stack.
 *
 * Distances are in world (image) pixels, so the drop scales with the camera on every
 * screen: a phone sees the same movement as a desktop, at its own size.
 */
export const ASSEMBLY = {
  drop: 70,       // world px a slab is lowered through
  dur: 1.15,      // descent of one slab
  stagger: 0.36,  // the next slab starts while the previous one settles
  fade: 0.55,     // a slab becomes solid early in its descent
  focus: 0.9,     // and sharp as it lands
  blur: 5,
  ease: 'power3.out',
}

export const assemblyStart = () => ({ opacity: 0, y: -ASSEMBLY.drop, filter: `blur(${ASSEMBLY.blur}px)` })

/**
 * Adds the floor-by-floor assembly to a timeline, starting at `at` (seconds).
 * `onFloor(i)` fires as floor i begins its descent. Returns the time the last slab lands.
 */
export function addAssembly(tl, slices, at = 0, onFloor) {
  const A = ASSEMBLY
  slices.forEach((el, i) => {
    const t = at + i * A.stagger
    tl.to(el, { y: 0, duration: A.dur, ease: A.ease }, t)
      .to(el, { opacity: 1, duration: A.fade, ease: 'power1.out' }, t)
      .to(el, { filter: 'blur(0px)', duration: A.focus, ease: 'power2.out' }, t)
    if (onFloor) tl.call(onFloor, [i], t)
  })
  return at + (slices.length - 1) * A.stagger + A.dur
}
