# STRATA — Ķīpsala, Riga

Interactive architectural experience (concept project — the building, names, figures and prices are fictional; visuals AI-generated).

## Local preview
- Double-click `start.command` in Finder, **or**
- `npm install && npm run dev` → http://localhost:5288

## Stack
React 19 + Vite · GSAP (timelines + ScrollTrigger) · Lenis smooth scroll · self-hosted fonts (Instrument Serif, Hanken Grotesk, IBM Plex Mono).

## Structure
- `src/data.js` — floors, specs, zones, plans (edit content here)
- `src/engine/camera.js` — camera framing math (building / floor / matched-cut)
- `src/engine/director.js` — all camera moves: enter, reverse, elevator, zones
- `src/components/Experience.jsx` — the interactive building stage + floor UI
- `src/components/{Residences,Story,Location,Footer}.jsx` — page sections
- `public/img/` — optimized WebP (2400/1280 widths), floor slices with alpha
