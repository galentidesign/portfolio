/**
 * Token playground physics — the dynamic chunk (matter-js only, no gsap).
 *
 * Budget note: gsap core (~28kB gz) + Draggable (~13kB gz) on top of matter-js
 * (~25kB gz) would put this chunk far over its 40kB budget, so dragging is
 * plain pointer events driving a matter constraint instead of gsap Draggable —
 * the soft constraint imparts release velocity naturally (the toss).
 *
 * The chips stay the real token-styled DOM elements; one fixed-step rAF loop
 * writes body transforms back to them. Deterministic by repo rule: pour
 * positions/angles derive from index math (golden-ratio strides) — no
 * Math.random, no Date.now.
 *
 * The engine sleeps: matter sleeping is enabled and the rAF loop parks itself
 * when every body is asleep (and no drag is live), when the section leaves
 * the viewport (setVisible, fed by the host's IntersectionObserver), or when
 * the tab is hidden.
 */
import { Bodies, Body, Composite, Constraint, Engine, Query, Sleeping, Vector } from 'matter-js'

export interface TokenPhysicsHandle {
  /** Re-pour: every chip back to its deterministic spawn state. */
  reset: () => void
  /** Pause/resume the engine as the pen leaves/enters the viewport. */
  setVisible: (visible: boolean) => void
  /** Tear down: restore the static grid render exactly. */
  destroy: () => void
}

const FIXED_DT = 1000 / 60
const MAX_FRAME_MS = 50 // clamp long-frame spikes so the sim never explodes
const WALL = 200 // wall thickness — thick enough that nothing tunnels out
const GOLDEN = 0.618033988749895 // low-discrepancy stride for spawn scatter

interface Spawn {
  x: number
  y: number
  angle: number
}

interface ChipBody {
  el: HTMLElement
  body: Body
  w: number
  h: number
  spawn: Spawn
}

/** Deterministic spawn: scatter x by golden-ratio stride, stagger drop heights
 *  by index so gravity itself staggers the arrivals — no timers, no random. */
function spawnFor(index: number, w: number, h: number, penW: number): Spawn {
  const margin = w / 2 + 8
  const span = Math.max(penW - margin * 2, 1)
  const x = margin + ((index * GOLDEN) % 1) * span
  const y = -h / 2 - 24 - ((index * 89) % 233) - index * 34
  const angle = ((((index * 137.508) % 44) - 22) * Math.PI) / 180
  return { x, y, angle }
}

export function mountTokenPhysics(pen: HTMLElement): TokenPhysicsHandle {
  // Flip the pen into physics layout first so chip measurements reflect the
  // absolute (shrink-to-fit) geometry the bodies will drive.
  pen.dataset.physics = 'on'

  const chipEls = Array.from(pen.querySelectorAll<HTMLElement>('[data-physics-chip]'))
  let penW = pen.clientWidth
  let penH = pen.clientHeight

  const engine = Engine.create({ enableSleeping: true })
  const world = engine.world

  const chips: ChipBody[] = chipEls.map((el, i) => {
    const w = el.offsetWidth
    const h = el.offsetHeight
    const spawn = spawnFor(i, w, h, penW)
    // The physical corner mirrors the chip's real token radius.
    const radius = Math.min(
      parseFloat(getComputedStyle(el).borderRadius) || 0,
      Math.min(w, h) / 2 - 1,
    )
    const body = Bodies.rectangle(spawn.x, spawn.y, w, h, {
      angle: spawn.angle,
      chamfer: radius > 0 ? { radius } : undefined,
      restitution: 0.2,
      friction: 0.35,
      frictionAir: 0.015,
    })
    return { el, body, w, h, spawn }
  })
  const bodies = chips.map((c) => c.body)

  // Containment box: floor at the pen bottom, walls/ceiling extended above it
  // so the spawn column (chips start above the pen) can never escape.
  const spawnTop = Math.min(0, ...chips.map((c) => c.spawn.y - c.h)) - WALL
  let walls: Body[] = []
  function buildWalls(): Body[] {
    const height = penH - spawnTop + WALL * 2
    return [
      Bodies.rectangle(penW / 2, penH + WALL / 2, penW + WALL * 2, WALL, { isStatic: true }),
      Bodies.rectangle(penW / 2, spawnTop - WALL / 2, penW + WALL * 2, WALL, { isStatic: true }),
      Bodies.rectangle(-WALL / 2, spawnTop + height / 2 - WALL, WALL, height, { isStatic: true }),
      Bodies.rectangle(penW + WALL / 2, spawnTop + height / 2 - WALL, WALL, height, {
        isStatic: true,
      }),
    ]
  }
  walls = buildWalls()
  Composite.add(world, [...walls, ...bodies])

  // ── Render: bodies → DOM transforms (chips stay real styled elements) ──────

  function render(): void {
    for (const { el, body, w, h } of chips) {
      const x = (body.position.x - w / 2).toFixed(2)
      const y = (body.position.y - h / 2).toFixed(2)
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${body.angle.toFixed(4)}rad)`
    }
  }

  // ── Fixed-step loop with sleep/visibility parking ───────────────────────────

  let raf = 0
  let running = false
  let last = 0
  let acc = 0
  let ioVisible = true
  let pageVisible = !document.hidden
  let destroyed = false

  function stop(): void {
    if (!running) return
    running = false
    cancelAnimationFrame(raf)
  }

  function start(): void {
    if (running || destroyed || !ioVisible || !pageVisible) return
    running = true
    last = 0
    acc = 0
    raf = requestAnimationFrame(tick)
  }

  function tick(ts: number): void {
    raf = requestAnimationFrame(tick)
    if (last === 0) {
      last = ts
      return
    }
    acc += Math.min(ts - last, MAX_FRAME_MS)
    last = ts
    while (acc >= FIXED_DT) {
      Engine.update(engine, FIXED_DT)
      acc -= FIXED_DT
    }
    render()
    // Everything asleep and nothing held — park the engine until poked.
    if (drag === null && bodies.every((b) => b.isSleeping)) stop()
  }

  // ── Drag: pointer events → matter constraint (grab, follow, toss) ──────────

  interface DragState {
    pointerId: number
    body: Body
    constraint: Constraint
  }
  let drag: DragState | null = null

  function toLocal(e: PointerEvent): { x: number; y: number } {
    const rect = pen.getBoundingClientRect()
    return { x: e.clientX - rect.left - pen.clientLeft, y: e.clientY - rect.top - pen.clientTop }
  }

  function onPointerDown(e: PointerEvent): void {
    if (drag !== null || (e.pointerType === 'mouse' && e.button !== 0)) return
    const point = toLocal(e)
    const hit = Query.point(bodies, point)[0]
    if (hit === undefined) return
    e.preventDefault()
    pen.setPointerCapture(e.pointerId)
    Sleeping.set(hit, false)
    const constraint = Constraint.create({
      pointA: point,
      bodyB: hit,
      pointB: Vector.rotate(
        { x: point.x - hit.position.x, y: point.y - hit.position.y },
        -hit.angle,
      ),
      stiffness: 0.15,
      damping: 0.05,
      length: 0,
    })
    Composite.add(world, constraint)
    drag = { pointerId: e.pointerId, body: hit, constraint }
    pen.dataset.dragging = 'on'
    start()
  }

  function onPointerMove(e: PointerEvent): void {
    if (drag === null || e.pointerId !== drag.pointerId) return
    drag.constraint.pointA = toLocal(e)
    Sleeping.set(drag.body, false)
  }

  function endDrag(e: PointerEvent): void {
    if (drag === null || e.pointerId !== drag.pointerId) return
    Composite.remove(world, drag.constraint)
    if (pen.hasPointerCapture(e.pointerId)) pen.releasePointerCapture(e.pointerId)
    drag = null
    delete pen.dataset.dragging
    // Release velocity is already on the body via the constraint — the toss.
  }

  pen.addEventListener('pointerdown', onPointerDown)
  pen.addEventListener('pointermove', onPointerMove)
  pen.addEventListener('pointerup', endDrag)
  pen.addEventListener('pointercancel', endDrag)

  // ── Pause when the tab hides ────────────────────────────────────────────────

  function onVisibilityChange(): void {
    pageVisible = !document.hidden
    if (pageVisible) start()
    else stop()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  // ── Re-pour ────────────────────────────────────────────────────────────────

  function reset(): void {
    for (const { body, spawn } of chips) {
      Body.setPosition(body, { x: spawn.x, y: spawn.y })
      Body.setAngle(body, spawn.angle)
      Body.setVelocity(body, { x: 0, y: 0 })
      Body.setAngularVelocity(body, 0)
      Sleeping.set(body, false)
    }
    render()
    start()
  }

  // ── Resize: rebuild the containment and re-pour at the new width ───────────

  const resizeObserver = new ResizeObserver(() => {
    const w = pen.clientWidth
    const h = pen.clientHeight
    if (Math.abs(w - penW) < 1 && Math.abs(h - penH) < 1) return
    penW = w
    penH = h
    Composite.remove(world, walls)
    walls = buildWalls()
    Composite.add(world, walls)
    for (const [i, chip] of chips.entries()) {
      chip.spawn = spawnFor(i, chip.w, chip.h, penW)
    }
    reset()
  })
  resizeObserver.observe(pen)

  // Initial pour: bodies already sit in their spawn column above the pen —
  // paint them there once, then let gravity stagger the arrivals.
  render()
  start()

  return {
    reset,
    setVisible: (visible: boolean) => {
      ioVisible = visible
      if (visible) start()
      else stop()
    },
    destroy: () => {
      destroyed = true
      stop()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      pen.removeEventListener('pointerdown', onPointerDown)
      pen.removeEventListener('pointermove', onPointerMove)
      pen.removeEventListener('pointerup', endDrag)
      pen.removeEventListener('pointercancel', endDrag)
      if (drag !== null) {
        Composite.remove(world, drag.constraint)
        drag = null
      }
      Engine.clear(engine)
      for (const { el } of chips) {
        el.style.transform = ''
      }
      delete pen.dataset.physics
      delete pen.dataset.dragging
    },
  }
}
