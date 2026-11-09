import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { colorFor, initials } from './Avatar'
import { useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { useLive } from '../lib/live'
import { go, href } from '../lib/router'
import type { Person, Status } from '../types'

// BlueLink draws people as dots and connections as lines, like a map of a brain.
// The pictures live here: the landing sky, the side menu sky, your network in the rail, and profile covers.

// The same seed always gives the same numbers, so a person's cover never changes.
function seeded(text: string) {
  let s = 2166136261
  for (const ch of text) s = Math.imul(s ^ ch.charCodeAt(0), 16777619)
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const stillMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Sizes a canvas to its box and the screen's pixel density. Calls draw on every frame while it is on screen.
function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void, setup: (w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = stillMotion()
    let w = 0
    let h = 0
    let raf = 0
    let last = 0
    let onScreen = true

    const frame = (t: number) => {
      const dt = Math.min(50, last ? t - last : 16)
      last = t
      ctx.clearRect(0, 0, w, h)
      draw(ctx, w, h, still ? 0 : t, still ? 0 : dt)
      if (!still && onScreen) raf = requestAnimationFrame(frame)
    }
    const start = () => {
      cancelAnimationFrame(raf)
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      setup(w, h)
      start()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      if (onScreen) start()
    })
    io.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, deps)
  return ref
}

/* ---------------- The sky ---------------- */

type Rand = () => number
const TAU = Math.PI * 2

// Real stars are not all white. Most are, some are blue-white, a few are warm.
const TINTS = ['242,244,255', '242,244,255', '226,234,255', '205,218,255', '255,236,214', '255,214,174']
const tint = (rand: Rand) => TINTS[Math.floor(rand() * TINTS.length)]

// Roughly a bell curve between -1 and 1. Most values sit near 0.
const bell = (rand: Rand) => (rand() + rand() + rand() - 1.5) / 1.5

// One bright star: a soft glow and a sharp core. The brightest get thin spikes, like a telescope photo.
function brightStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1, spike = 0) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 8)
  g.addColorStop(0, `rgba(${color},${(0.32 * a).toFixed(3)})`)
  g.addColorStop(0.3, `rgba(${color},${(0.06 * a).toFixed(3)})`)
  g.addColorStop(1, `rgba(${color},0)`)
  ctx.fillStyle = g
  ctx.fillRect(x - r * 8, y - r * 8, r * 16, r * 16)
  if (spike) {
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ]) {
      const s = ctx.createLinearGradient(x - dx * spike, y - dy * spike, x + dx * spike, y + dy * spike)
      s.addColorStop(0, `rgba(${color},0)`)
      s.addColorStop(0.5, `rgba(${color},${(0.45 * a).toFixed(3)})`)
      s.addColorStop(1, `rgba(${color},0)`)
      ctx.strokeStyle = s
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(x - dx * spike, y - dy * spike)
      ctx.lineTo(x + dx * spike, y + dy * spike)
      ctx.stroke()
    }
  }
  ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a).toFixed(3)})`
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

interface SkyLook {
  density?: number // how many faint stars
  band?: number // how strong the Milky Way is, 0 for none
  angle?: number // the band's slope
  offset?: number // where the band crosses the middle, 0 = top, 1 = bottom
  bright?: number // how many bright stars
}

// Paints a still night sky: thousands of faint stars, the soft band of the Milky Way with dark dust in it,
// and a few bright stars. Painted once, then reused, so it costs nothing per frame.
function paintSky(ctx: CanvasRenderingContext2D, w: number, h: number, rand: Rand, look: SkyLook = {}) {
  const { density = 1, band = 1, angle = -0.32, offset = 0.45, bright = 1 } = look
  const cx = w / 2
  const cy = h * offset
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const span = Math.hypot(w, h)
  const width = Math.max(90, Math.min(h * 0.32, w * 0.16))
  const along = (s: number, d: number) => [cx + ux * s - uy * d, cy + uy * s + ux * d] as const

  if (band > 0) {
    // The glow: many wide, faint clouds along the band. Warmer near the middle, like the galactic core.
    for (let i = 0; i < 60; i++) {
      const s = (rand() - 0.5) * span
      const [x, y] = along(s, bell(rand) * width * 0.7)
      const r = width * (0.5 + rand() * 1.3)
      const core = Math.max(0, 1 - Math.abs(s) / (span * 0.28))
      const color = rand() < core * 0.55 ? '255,210,180' : rand() < 0.5 ? '110,135,255' : '175,190,255'
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(${color},${(0.03 * band * (0.6 + core)).toFixed(3)})`)
      g.addColorStop(1, `rgba(${color},0)`)
      ctx.fillStyle = g
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    // The dust: dark lanes that break up the middle of the band.
    for (let i = 0; i < 26; i++) {
      const [x, y] = along((rand() - 0.5) * span, bell(rand) * width * 0.22)
      const r = width * (0.18 + rand() * 0.42)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(3,5,13,${(0.4 * band).toFixed(3)})`)
      g.addColorStop(1, 'rgba(3,5,13,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
  }

  // Faint stars. A lot of them crowd into the band.
  const count = Math.round(((w * h) / 520) * density)
  for (let i = 0; i < count; i++) {
    const [x, y] = band > 0 && rand() < 0.55 ? along((rand() - 0.5) * span, bell(rand) * width * 1.1) : [rand() * w, rand() * h]
    if (x < 0 || y < 0 || x > w || y > h) continue
    const m = rand()
    const r = 0.22 + m ** 6 * 1.05
    ctx.fillStyle = `rgba(${tint(rand)},${(0.12 + rand() * 0.5 * (0.35 + m)).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
  }

  // A few bright ones. The first two get spikes.
  const many = Math.round(((w * h) / 90000) * bright) + 2
  for (let i = 0; i < many; i++) brightStar(ctx, rand() * w, rand() * h, 0.7 + rand() * 0.6, tint(rand), 0.65 + rand() * 0.35, i < 2 ? 9 + rand() * 8 : 0)
}

// A canvas painted once per size. For skies that do not move.
function useStill(paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint(ctx, r.width, r.height)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, deps)
  return ref
}

// A quiet sky with no band. Sits behind the side menu.
export function Sky({ seed, className = 'sky' }: { seed: string; className?: string }) {
  const ref = useStill((ctx, w, h) => paintSky(ctx, w, h, seeded(seed), { band: 0, density: 0.7, bright: 0.6 }), [seed])
  return <canvas ref={ref} className={className} aria-hidden />
}

/* ---------------- Landing hero ---------------- */

interface Star {
  x: number
  y: number
  z: number
  r: number
  a: number
  tw: number
  ph: number
  c: string
}
interface Group {
  links: [number, number][]
  stars: number[]
  ph: number
  period: number
}

const PAD = 24 // extra sky around the edges, so the drift never shows an edge

// Deep space over a planet's edge. The far sky is painted once; the near stars twinkle and drift a little
// with the pointer. Now and then a few of them link up into a small constellation, then fade out again.
export function HeroGraph() {
  const state = useRef({ far: null as HTMLCanvasElement | null, stars: [] as Star[], groups: [] as Group[], lit: new Float32Array(0), px: 0, py: 0, tx: 0, ty: 0 })

  const ref = useCanvas(
    (ctx, w, h, t, dt) => {
      const s = state.current
      const ease = dt ? Math.min(1, dt / 900) : 1
      s.px += (s.tx - s.px) * ease
      s.py += (s.ty - s.py) * ease
      if (s.far) ctx.drawImage(s.far, -PAD - s.px * 8, -PAD - s.py * 6, w + PAD * 2, h + PAD * 2)
      const pos = (st: Star) => [st.x + s.px * st.z * 22 + Math.sin(t * 0.00004 + st.ph) * st.z * 3, st.y + s.py * st.z * 14] as const

      // How visible each constellation is right now: fades in, stays, fades out.
      s.lit.fill(0)
      const shown = s.groups.map((g) => {
        const k = Math.max(0, Math.sin(((t / g.period + g.ph) % 1) * TAU))
        const v = k * k * (3 - 2 * k)
        for (const i of g.stars) s.lit[i] = Math.max(s.lit[i], v)
        return v
      })

      ctx.lineWidth = 0.6
      s.groups.forEach((g, gi) => {
        const v = shown[gi]
        if (v < 0.01) return
        ctx.strokeStyle = `rgba(176,194,255,${(0.22 * v).toFixed(3)})`
        ctx.beginPath()
        for (const [a, b] of g.links) {
          const [ax, ay] = pos(s.stars[a])
          const [bx, by] = pos(s.stars[b])
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
        }
        ctx.stroke()
      })

      s.stars.forEach((st, i) => {
        const [x, y] = pos(st)
        const twinkle = dt ? 0.75 + 0.25 * Math.sin(t * st.tw + st.ph) : 1
        const a = Math.min(1, st.a * twinkle + s.lit[i] * 0.4)
        if (st.r > 0.95) brightStar(ctx, x, y, st.r, st.c, a)
        else {
          ctx.fillStyle = `rgba(${st.c},${a.toFixed(3)})`
          ctx.beginPath()
          ctx.arc(x, y, st.r, 0, TAU)
          ctx.fill()
        }
      })
    },
    (w, h) => {
      const s = state.current
      const rand = seeded('bluelink-deep-field')
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const far = (s.far ??= document.createElement('canvas'))
      far.width = Math.round((w + PAD * 2) * dpr)
      far.height = Math.round((h + PAD * 2) * dpr)
      const fctx = far.getContext('2d')!
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintSky(fctx, w + PAD * 2, h + PAD * 2, rand, { angle: w < 700 ? -0.9 : -0.36, offset: 0.34, band: 0.8, bright: 0.5 })

      const count = Math.max(40, Math.min(110, Math.round((w * h) / 12000)))
      s.stars = Array.from({ length: count }, () => {
        const z = 0.25 + rand() ** 1.5 * 0.75
        return { x: rand() * w, y: rand() * h * 0.92, z, r: rand() < 0.12 ? 1 + rand() * 0.5 : 0.45 + z * 0.4, a: 0.35 + z * 0.5, tw: 0.0006 + rand() * 0.0014, ph: rand() * TAU, c: tint(rand) }
      })
      // A few small constellations, kept away from the words and the card.
      s.groups = []
      const used = new Set<number>()
      const seeds = s.stars.map((st, i) => ({ st, i })).filter(({ st }) => st.y > h * 0.06 && st.y < h * 0.8 && (w < 900 || st.y < h * 0.16 || st.x > w * 0.9 || (st.x > w * 0.44 && st.x < w * 0.56)))
      for (let g = 0; g < 7 && seeds.length; g++) {
        const { i: c } = seeds[Math.floor(rand() * seeds.length)]
        if (used.has(c)) continue
        const near = s.stars
          .map((st, j) => ({ j, d: Math.hypot(st.x - s.stars[c].x, st.y - s.stars[c].y) }))
          .filter(({ j, d }) => !used.has(j) && d < 190)
          .sort((a, b) => a.d - b.d)
          .slice(0, 4 + Math.floor(rand() * 3))
          .map(({ j }) => j)
        if (near.length < 3) continue
        near.forEach((j) => used.add(j))
        // Join each star to the closest star already in the shape, like a real constellation.
        const links: [number, number][] = []
        for (let k = 1; k < near.length; k++) {
          let best = near[0]
          for (let m = 0; m < k; m++) if (Math.hypot(s.stars[near[k]].x - s.stars[near[m]].x, s.stars[near[k]].y - s.stars[near[m]].y) < Math.hypot(s.stars[near[k]].x - s.stars[best].x, s.stars[near[k]].y - s.stars[best].y)) best = near[m]
          links.push([best, near[k]])
        }
        s.groups.push({ links, stars: near, ph: rand(), period: 18000 + rand() * 12000 })
      }
      s.lit = new Float32Array(s.stars.length)
    },
    [],
  )

  useEffect(() => {
    const host = ref.current?.parentElement
    if (!host) return
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      state.current.tx = (e.clientX - r.left) / r.width - 0.5
      state.current.ty = (e.clientY - r.top) / r.height - 0.5
    }
    const leave = () => ((state.current.tx = 0), (state.current.ty = 0))
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerleave', leave)
    return () => {
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
    }
  }, [ref])

  return <canvas ref={ref} className="hero-graph" aria-hidden />
}

/* ---------------- Your network (right rail) ---------------- */

type Kind = 'me' | 'connected' | 'pending' | 'other'
interface GNode {
  person?: Person
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  r: number
  ph: number
  color: string
}
interface GLink {
  a: number
  b: number
  kind: Kind
  len: number
  k: number
  show: boolean
}

const VW = 268
const VH = 210
const RADIUS: Record<Kind, number> = { me: 19, connected: 12, pending: 11, other: 5 }
const RANK: Record<Status, number> = { self: 0, connected: 0, received: 1, sent: 1, none: 2 }
const kindOf = (s?: Status): Kind => (s === 'connected' ? 'connected' : s === 'sent' || s === 'received' ? 'pending' : 'other')

// A small force layout, run once. People you know sit close; people from the same school drift together.
function layout(me: Person, people: Person[]) {
  const rand = seeded(me.uid)
  const nodes: GNode[] = [{ person: me, kind: 'me', x: VW / 2, y: VH / 2, vx: 0, vy: 0, r: RADIUS.me, ph: 0, color: colorFor(me.uid) }]
  people.forEach((p, i) => {
    const kind = kindOf(p.status)
    const ring = kind === 'connected' ? 55 : kind === 'pending' ? 72 : 95
    const ang = i * 2.399963 + rand() * 0.4
    nodes.push({ person: p, kind, x: VW / 2 + Math.cos(ang) * ring, y: VH / 2 + Math.sin(ang) * ring * 0.8, vx: 0, vy: 0, r: RADIUS[kind], ph: rand() * Math.PI * 2, color: colorFor(p.uid) })
  })

  const links: GLink[] = []
  nodes.forEach((n, i) => {
    if (n.kind === 'connected' || n.kind === 'pending') links.push({ a: 0, b: i, kind: n.kind, len: n.kind === 'connected' ? 56 : 74, k: 0.04, show: true })
  })
  // Same school, same cluster
  nodes.forEach((n, i) => {
    if (i === 0) return
    const j = nodes.findIndex((m, jj) => jj > i && m.person?.school && m.person.school === n.person?.school)
    if (j > 0) links.push({ a: i, b: j, kind: 'other', len: 40, k: 0.02, show: true })
  })
  // Everyone stays loosely near you
  nodes.forEach((n, i) => {
    if (n.kind === 'other') links.push({ a: 0, b: i, kind: 'other', len: 86, k: 0.03, show: false })
  })

  for (let step = 0; step < 320; step++) {
    for (let i = 1; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue
        const A = nodes[i]
        const B = nodes[j]
        const dx = A.x - B.x
        const dy = A.y - B.y
        const d2 = Math.max(40, dx * dx + dy * dy)
        const min = A.r + B.r + 6
        const f = (min * min * 0.6) / d2
        A.vx += (dx / Math.sqrt(d2)) * f
        A.vy += (dy / Math.sqrt(d2)) * f
      }
    }
    for (const l of links) {
      const A = nodes[l.a]
      const B = nodes[l.b]
      const dx = B.x - A.x
      const dy = B.y - A.y
      const d = Math.max(1, Math.hypot(dx, dy))
      const f = (d - l.len) * l.k
      if (l.a) ((A.vx += (dx / d) * f), (A.vy += (dy / d) * f))
      B.vx -= (dx / d) * f
      B.vy -= (dy / d) * f
    }
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i]
      n.vx *= 0.8
      n.vy *= 0.8
      n.x = Math.min(VW - n.r - 4, Math.max(n.r + 4, n.x + n.vx))
      n.y = Math.min(VH - n.r - 4, Math.max(n.r + 4, n.y + n.vy))
    }
  }
  return { nodes, links: links.filter((l) => l.show) }
}

export function MyNetwork() {
  const { me, theme } = useApp()
  const { data, reload } = useFetch<{ people: Person[] }>('/api/people')
  const [hover, setHover] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  const photos = useRef(new Map<string, HTMLImageElement>())
  const scale = useRef(1)
  const pulses = useRef<{ link: number; p: number; out: boolean }[]>([])
  const spawn = useRef(0)
  useLive((e) => e.type === 'inbox' && reload())

  const graph = useMemo(() => {
    if (!data) return null
    const people = [...data.people].sort((a, b) => RANK[a.status ?? 'none'] - RANK[b.status ?? 'none']).slice(0, 18)
    return layout(me, people)
  }, [data, me])

  const colors = useRef({ blue: '#1d45e5', soft: '#6f8cff', line: '#cdd4e2', panel: '#fff', ring: 'rgba(29,69,229,.18)', font: 'sans-serif' })
  const far = useRef<HTMLCanvasElement | null>(null)

  const ref = useCanvas(
    (ctx, w, h, t, dt) => {
      if (!graph) return
      const c = colors.current
      const k = (scale.current = w / VW)
      const offY = (h - VH * k) / 2
      const pos = graph.nodes.map((n) => ({ x: (n.x + (n.kind === 'me' ? 0 : Math.sin(t / 1400 + n.ph) * 2.2)) * k, y: offY + (n.y + (n.kind === 'me' ? 0 : Math.cos(t / 1700 + n.ph) * 2.2)) * k }))
      const hv = hoverRef.current
      if (far.current) ctx.drawImage(far.current, 0, 0, w, h)

      // Lines
      graph.links.forEach((l) => {
        const A = pos[l.a]
        const B = pos[l.b]
        const lit = hv !== null && (l.a === hv || l.b === hv)
        ctx.strokeStyle = l.kind === 'other' ? c.line : c.soft
        ctx.globalAlpha = lit ? 1 : l.kind === 'connected' ? 0.85 : l.kind === 'pending' ? 0.7 : 0.75
        ctx.lineWidth = l.kind === 'connected' ? 1.6 : 1
        ctx.setLineDash(l.kind === 'pending' ? [3, 3] : [])
        ctx.beginPath()
        ctx.moveTo(A.x, A.y)
        ctx.lineTo(B.x, B.y)
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      // Signals between you and the people you know
      const live = graph.links.map((l, i) => (l.a === 0 && l.kind === 'connected' ? i : -1)).filter((i) => i >= 0)
      spawn.current -= dt
      if (dt && live.length && spawn.current <= 0) {
        pulses.current.push({ link: live[Math.floor(Math.random() * live.length)], p: 0, out: Math.random() < 0.5 })
        spawn.current = 900
      }
      pulses.current = pulses.current.filter((q) => (q.p += dt / 900) < 1)
      for (const q of pulses.current) {
        const l = graph.links[q.link]
        const A = q.out ? pos[l.a] : pos[l.b]
        const B = q.out ? pos[l.b] : pos[l.a]
        ctx.fillStyle = c.blue
        ctx.beginPath()
        ctx.arc(A.x + (B.x - A.x) * q.p, A.y + (B.y - A.y) * q.p, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // People
      graph.nodes.forEach((n, i) => {
        const { x, y } = pos[i]
        const r = n.r * Math.min(1.15, k) * (hv === i ? 1.12 : 1)
        if (n.kind === 'me') {
          ctx.fillStyle = c.ring
          ctx.beginPath()
          ctx.arc(x, y, r + 7 + (dt ? Math.sin(t / 700) * 2 : 0), 0, Math.PI * 2)
          ctx.fill()
        }
        // People you have not met yet are stars.
        if (n.kind === 'other') {
          brightStar(ctx, x, y, hv === i ? 2.6 : 1.7, '226,234,255', hv === i ? 1 : 0.8)
          return
        }
        ctx.fillStyle = c.panel
        ctx.beginPath()
        ctx.arc(x, y, r + 2, 0, Math.PI * 2)
        ctx.fill()
        const img = n.person?.photo ? photos.current.get(n.person.photo) : undefined
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.clip()
        if (img?.complete && img.naturalWidth) ctx.drawImage(img, x - r, y - r, r * 2, r * 2)
        else {
          ctx.fillStyle = n.color
          ctx.fillRect(x - r, y - r, r * 2, r * 2)
          ctx.fillStyle = '#fff'
          ctx.font = `600 ${Math.round(r * 0.78)}px ${c.font}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(initials(n.person!.name), x, y + 0.5)
        }
        ctx.restore()
      })
    },
    (w, h) => {
      // The card is always night sky, so read its colors, not the page's.
      const css = getComputedStyle(ref.current ?? document.documentElement)
      const v = (name: string) => css.getPropertyValue(name).trim()
      colors.current = { blue: v('--blue'), soft: v('--blue-soft'), line: v('--line-strong'), panel: v('--panel'), ring: v('--ring'), font: v('--font-ui') || 'sans-serif' }
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const sky = (far.current ??= document.createElement('canvas'))
      sky.width = Math.round(w * dpr)
      sky.height = Math.round(h * dpr)
      const sctx = sky.getContext('2d')!
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintSky(sctx, w, h, seeded(me.uid), { band: 0.6, angle: -0.6, density: 0.6, bright: 0 })
    },
    [graph, theme, me.uid],
  )

  // Load photos once
  useEffect(() => {
    graph?.nodes.forEach((n) => {
      const src = n.person?.photo
      if (src && !photos.current.has(src)) {
        const img = new Image()
        img.src = src
        photos.current.set(src, img)
      }
    })
  }, [graph])

  if (!graph || graph.nodes.length < 2) return null

  const hit = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const k = scale.current
    const offY = (r.height - VH * k) / 2
    const x = (e.clientX - r.left) / k
    const y = (e.clientY - r.top - offY) / k
    let best: number | null = null
    let bestD = Infinity
    graph.nodes.forEach((n, i) => {
      const d = Math.hypot(n.x - x, n.y - y)
      if (d < Math.max(n.r + 5, 10) && d < bestD) ((best = i), (bestD = d))
    })
    return best
  }

  const counts = { connected: 0, pending: 0, other: 0 }
  graph.nodes.forEach((n) => n.kind !== 'me' && counts[n.kind]++)
  const hovered = hover !== null ? graph.nodes[hover] : null
  const tipText = (n: GNode) => (n.kind === 'me' ? 'You' : n.kind === 'connected' ? 'Connected' : n.kind === 'pending' ? (n.person?.status === 'received' ? 'Wants to connect' : 'Request sent') : n.person?.headline || 'Say hi')

  return (
    <section className="card rail-card net-card">
      <div className="net-head">
        <h2>Your network</h2>
        <a href={href.people}>Explore</a>
      </div>
      <div className="net-stage">
        <canvas
          ref={ref}
          role="img"
          aria-label={`Your network: ${counts.connected} connected, ${counts.pending} pending`}
          style={{ cursor: hover !== null ? 'pointer' : 'default' }}
          onPointerMove={(e) => {
            const i = hit(e)
            hoverRef.current = i
            setHover(i)
          }}
          onPointerLeave={() => ((hoverRef.current = null), setHover(null))}
          onClick={(e) => {
            const i = hit(e)
            if (i === null) return
            go(i === 0 ? href.me : href.user(graph.nodes[i].person!.uid))
          }}
        />
        {hovered && hover !== null && (
          <div className="net-tip" style={{ left: hovered.x * scale.current, top: hovered.y * scale.current - hovered.r * scale.current - 8 }}>
            <b>{hovered.kind === 'me' ? me.name : hovered.person!.name}</b>
            <span>{tipText(hovered)}</span>
          </div>
        )}
      </div>
      <p className="net-legend">
        <span>
          <i className="is-on" /> {counts.connected} connected
        </span>
        <span>
          <i className="is-pending" /> {counts.pending} pending
        </span>
        <span>
          <i /> {counts.other} to meet
        </span>
      </p>
    </section>
  )
}

/* ---------------- Profile cover ---------------- */

// Every person and org gets their own patch of sky: a real-looking star field and one small constellation.
// Made from their id, so it never changes. The constellation stays on the right, away from the photo.
export function SpaceCover({ seed }: { seed: string }) {
  const ref = useStill(
    (ctx, w, h) => {
      const rand = seeded(seed)
      paintSky(ctx, w, h, rand, { angle: -0.15 - rand() * 0.5, offset: 0.2 + rand() * 0.6, band: 0.75, density: 0.85, bright: 0.4 })
      const n = 5 + Math.floor(rand() * 3)
      const pts = Array.from({ length: n }, () => ({ x: w * (0.5 + rand() * 0.44), y: h * (0.14 + rand() * 0.72), r: 0.8 + rand() * 0.7 }))
      // Join each star to the closest one already in the shape.
      ctx.strokeStyle = 'rgba(176,194,255,0.3)'
      ctx.lineWidth = 0.7
      ctx.beginPath()
      for (let k = 1; k < n; k++) {
        let best = 0
        for (let m = 1; m < k; m++) if (Math.hypot(pts[k].x - pts[m].x, pts[k].y - pts[m].y) < Math.hypot(pts[k].x - pts[best].x, pts[k].y - pts[best].y)) best = m
        ctx.moveTo(pts[best].x, pts[best].y)
        ctx.lineTo(pts[k].x, pts[k].y)
      }
      ctx.stroke()
      pts.forEach((p, i) => brightStar(ctx, p.x, p.y, p.r, i === 0 ? '255,214,174' : '226,234,255', 0.95))
    },
    [seed],
  )
  return <canvas ref={ref} className="cover-sky" aria-hidden />
}

// A short catalog number for a person or org, like a star's name in an atlas. Same id, same number.
export function catalogNo(seed: string) {
  return `BL-${String(Math.floor(seeded(seed)() * 9000) + 1000)}`
}
