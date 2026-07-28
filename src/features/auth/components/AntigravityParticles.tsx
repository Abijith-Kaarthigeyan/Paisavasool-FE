import { useEffect, useRef } from "react"

const MIN_PARTICLE_SPACING = 28
const AREA_PER_PARTICLE = 5800
const MIN_PARTICLES = 120
const MAX_PARTICLES = 210

const REPEL_RADIUS = 120
const REPEL_FORCE = 3.4
const DAMPING = 0.86
const JIGGLE_STRENGTH = 0.38
const FALL_SPEED_MIN = 0.05
const FALL_SPEED_MAX = 0.12

const CURRENCY_SYMBOLS = ["₹", "$", "€"] as const
const PREMIUM_GREENS = [
  "rgba(15, 64, 40, 0.32)",
  "rgba(20, 83, 45, 0.28)",
  "rgba(22, 101, 52, 0.26)",
  "rgba(16, 71, 50, 0.30)",
  "rgba(12, 58, 36, 0.24)",
] as const

type CurrencySymbol = (typeof CURRENCY_SYMBOLS)[number]

interface MouseState {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  fallSpeed: number
  symbol: CurrencySymbol
  color: string
  size: number
  baseRotation: number
  rotation: number
  rotationVel: number
  phase: number
  wobbleSpeed: number
}

function targetParticleCount(width: number, height: number): number {
  const byArea = Math.floor((width * height) / AREA_PER_PARTICLE)
  return Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, byArea))
}

function createParticle(
  width: number,
  height: number,
  index: number,
  y?: number
): Particle {
  const marginX = width * 0.03
  return {
    x: marginX + Math.random() * (width - marginX * 2),
    y: y ?? -20 - Math.random() * height,
    vx: 0,
    vy: 0,
    fallSpeed: FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN),
    symbol: CURRENCY_SYMBOLS[index % CURRENCY_SYMBOLS.length],
    color: PREMIUM_GREENS[index % PREMIUM_GREENS.length],
    size: 13 + Math.random() * 7,
    baseRotation: (Math.random() - 0.5) * 0.3,
    rotation: 0,
    rotationVel: 0,
    phase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.85 + Math.random() * 0.55,
  }
}

function createParticles(width: number, height: number): Particle[] {
  const particles: Particle[] = []
  const target = targetParticleCount(width, height)
  const marginX = width * 0.03
  let spacing = MIN_PARTICLE_SPACING
  let attempts = 0
  const maxAttempts = target * 40

  while (particles.length < target && attempts < maxAttempts) {
    attempts += 1
    const x = marginX + Math.random() * (width - marginX * 2)
    const y = Math.random() * (height + 40) - 20

    const tooClose = particles.some(
      (p) => Math.hypot(p.x - x, p.y - y) < spacing
    )
    if (tooClose) continue

    particles.push(createParticle(width, height, particles.length, y))
  }

  if (particles.length < target * 0.85) {
    spacing *= 0.7
    while (particles.length < target && attempts < maxAttempts * 2) {
      attempts += 1
      const x = marginX + Math.random() * (width - marginX * 2)
      const y = Math.random() * (height + 40) - 20
      const tooClose = particles.some(
        (p) => Math.hypot(p.x - x, p.y - y) < spacing
      )
      if (tooClose) continue
      particles.push(createParticle(width, height, particles.length, y))
    }
  }

  return particles
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  ctx.save()
  ctx.translate(particle.x, particle.y)
  ctx.rotate(particle.rotation)
  ctx.fillStyle = particle.color
  ctx.font = `500 ${particle.size}px Inter, system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(particle.symbol, 0, 0)
  ctx.restore()
}

function respawnParticle(particle: Particle, width: number) {
  const marginX = width * 0.03
  particle.x = marginX + Math.random() * (width - marginX * 2)
  particle.y = -16 - Math.random() * 40
  particle.vx = 0
  particle.vy = 0
  particle.fallSpeed = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN)
}

function updateParticle(
  particle: Particle,
  mouse: MouseState,
  time: number,
  width: number,
  height: number,
  reduceMotion: boolean
) {
  if (reduceMotion) {
    particle.rotation = particle.baseRotation
    particle.vx = 0
    particle.vy = 0
    particle.rotationVel = 0
    return
  }

  let ax = Math.sin(time * 0.0009 * particle.wobbleSpeed + particle.phase) * 0.012
  let ay = particle.fallSpeed

  if (mouse.active) {
    const dx = particle.x - mouse.x
    const dy = particle.y - mouse.y
    const dist = Math.hypot(dx, dy)

    if (dist < REPEL_RADIUS && dist > 0.5) {
      const proximity = 1 - dist / REPEL_RADIUS
      const push = proximity * proximity * REPEL_FORCE
      ax += (dx / dist) * push
      ay += (dy / dist) * push * 0.65
      particle.rotationVel += proximity * 0.016 * Math.sign(dx)
    }

    const mouseSpeed = Math.hypot(mouse.vx, mouse.vy)
    if (mouseSpeed > 0.15 && dist < REPEL_RADIUS * 1.3) {
      const influence = (1 - dist / (REPEL_RADIUS * 1.3)) * Math.min(mouseSpeed, 18)
      const wobble =
        Math.sin(time * 0.014 * particle.wobbleSpeed + particle.phase) *
        influence *
        JIGGLE_STRENGTH *
        0.035
      ax += wobble
      ay += Math.cos(time * 0.013 * particle.wobbleSpeed + particle.phase) * influence * 0.02
      particle.rotationVel += wobble * 0.05
    }
  }

  particle.vx = (particle.vx + ax) * DAMPING
  particle.vy = (particle.vy + ay) * DAMPING
  particle.x += particle.vx
  particle.y += particle.vy

  if (particle.y > height + 24) {
    respawnParticle(particle, width)
  }

  particle.rotationVel += (particle.baseRotation - particle.rotation) * 0.06
  particle.rotationVel *= 0.88
  particle.rotation += particle.rotationVel
}

export function AntigravityParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<MouseState>({ x: -9999, y: -9999, vx: 0, vy: 0, active: false })
  const lastMouseRef = useRef({ x: -9999, y: -9999, time: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId = 0
    let particles: Particle[] = []
    let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = createParticles(width, height)
    }

    const updateMouse = (clientX: number, clientY: number, active: boolean) => {
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const now = performance.now()
      const last = lastMouseRef.current
      const dt = Math.max(now - last.time, 1)

      const vx = active ? ((x - last.x) / dt) * 16 : 0
      const vy = active ? ((y - last.y) / dt) * 16 : 0

      mouseRef.current = {
        x,
        y,
        vx: active ? vx : mouseRef.current.vx * 0.9,
        vy: active ? vy : mouseRef.current.vy * 0.9,
        active,
      }

      lastMouseRef.current = { x, y, time: now }
    }

    const onMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY, true)
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999, vx: 0, vy: 0, active: false }
    }

    const draw = (time: number) => {
      const { width, height } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      if (!mouseRef.current.active) {
        mouseRef.current.vx *= 0.92
        mouseRef.current.vy *= 0.92
      }

      for (const particle of particles) {
        updateParticle(particle, mouseRef.current, time, width, height, reduceMotion)
        drawParticle(ctx, particle)
      }

      animationId = window.requestAnimationFrame(draw)
    }

    resize()
    animationId = window.requestAnimationFrame(draw)

    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseleave", onMouseLeave)

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMotionChange = (e: MediaQueryListEvent) => {
      reduceMotion = e.matches
    }
    motionMq.addEventListener("change", onMotionChange)

    return () => {
      window.cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseleave", onMouseLeave)
      motionMq.removeEventListener("change", onMotionChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full bg-white"
      aria-hidden
    />
  )
}
