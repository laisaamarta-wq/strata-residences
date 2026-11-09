// Image warm-up: big pictures are decoded *before* they are needed, so a new picture
// never makes the frame wait for its decode (the visible "hitch" while scrolling or
// stepping through a scene). Lazy images near the viewport are switched to eager.
export function decodeOne(im) {
  if (!im) return
  if (im.loading === 'lazy') im.loading = 'eager'
  const go = () => { if (im.decode) im.decode().catch(() => {}) }
  if (im.complete && im.naturalWidth) go()
  else im.addEventListener('load', go, { once: true })
}

export function decodeAll(root, sel = 'img') {
  if (root) root.querySelectorAll(sel).forEach(decodeOne)
}

// decode every picture of `root` once it comes within `margin` of the viewport
export function warmImages(root, margin = '160% 0px') {
  if (!root) return () => {}
  if (typeof IntersectionObserver === 'undefined') { decodeAll(root); return () => {} }
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); decodeAll(root) }
  }, { rootMargin: margin })
  io.observe(root)
  return () => io.disconnect()
}
