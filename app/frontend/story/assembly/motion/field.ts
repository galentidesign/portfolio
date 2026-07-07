/**
 * Shader field — the "digital lava lamp" behind the hero (motion mode only;
 * the CSS gradient field in assembly.module.css is the base render and stays
 * put underneath, so losing this layer is never a blank screen).
 *
 * Renderer rules (pinned):
 *   - DPR capped at 1.75
 *   - gsap.ticker drives u_time/u_scroll — no second rAF loop
 *   - IntersectionObserver + visibilitychange pause the draw
 *   - WebGL context loss removes the canvas gracefully (CSS base remains)
 *   - the canvas starts at opacity 0 and fades in (CSS, --motion-duration-lg)
 *     only after the first frame has rendered ([data-ready])
 *
 * Mesh is deliberately skipped: a fullscreen triangle needs no scene graph,
 * and Mesh drags ogl's whole matrix stack into the chunk. `program.use()` +
 * `geometry.draw({ program })` is exactly what Mesh.draw does without a camera.
 */
import { gsap } from 'gsap'
import { Renderer, Program, Triangle } from 'ogl'

export interface FieldHandle {
  /** Master scroll progress 0..1, pushed from the pin's onUpdate. */
  setScroll: (progress: number) => void
  /** Active beat index 0..4 — the shader drifts hue toward it. */
  setBeat: (beat: number) => void
  /** Pin state from ScrollTrigger onToggle — false parks the ticker work. */
  setPinned: (active: boolean) => void
  destroy: () => void
}

const DPR_CAP = 1.75
const POINTER_LERP = 0.045
const BEAT_LERP = 0.03

const VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

// Shader stages (comments live out here — string bytes ship, JS comments
// don't): 3-octave value-noise fbm, gently domain-warped by two more fbm
// reads; four drifting gaussian blobs plus the lerped pointer as a quieter
// fifth attractor; a warm ramp surface → accent-muted → accent with a
// whisper of focus cobalt in the valleys; u_beat leans the ramp deeper into
// the accent per beat; 4×4 Bayer dither + a hair of grain against banding.
const FRAGMENT = /* glsl */ `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform float u_beat;
uniform vec2 u_pointer;
uniform vec2 u_blob0;
uniform vec2 u_blob1;
uniform vec2 u_blob2;
uniform vec2 u_blob3;
uniform vec3 u_surface;
uniform vec3 u_accentMuted;
uniform vec3 u_accent;
uniform vec3 u_focus;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(11.3, 7.9);
    a *= 0.5;
  }
  return v;
}

float blob(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  d.x *= u_res.x / u_res.y;
  return exp(-dot(d, d) / (r * r));
}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2(uv.x * u_res.x / u_res.y, uv.y);
  float t = u_time * 0.03;
  vec2 warp = vec2(
    fbm(p * 1.4 + vec2(t, -t * 0.7)),
    fbm(p * 1.4 + vec2(5.2 - t * 0.8, 1.3 + t))
  );
  float n = fbm(p * 1.7 + (warp - 0.5) * 1.5 + vec2(0.0, u_scroll * 0.8));
  float m = 0.0;
  m += blob(uv, u_blob0, 0.36);
  m += blob(uv, u_blob1, 0.27);
  m += blob(uv, u_blob2, 0.44);
  m += blob(uv, u_blob3, 0.30);
  m += blob(uv, u_pointer, 0.24) * 0.4;
  float v = n * 0.62 + m * 0.42;
  float warmth = 0.10 + u_beat * 0.045;
  vec3 col = u_surface;
  col = mix(col, u_accentMuted, smoothstep(0.30, 0.78, v) * 0.8);
  col = mix(col, u_accent, smoothstep(0.66, 1.05, v) * warmth);
  col = mix(col, u_focus, smoothstep(0.30, 0.02, v) * 0.05);
  float dither = bayer2(gl_FragCoord.xy * 0.5) * 0.25 + bayer2(gl_FragCoord.xy);
  col += (dither - 0.625) * (2.0 / 255.0);
  col += (hash(gl_FragCoord.xy) - 0.5) * (1.5 / 255.0);
  gl_FragColor = vec4(col, 1.0);
}
`

/** Parse a computed CSS color (#hex or rgb()/rgba()) to linear-ish 0..1 RGB. */
function cssColorToVec3(value: string): [number, number, number] | null {
  const v = value.trim()
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (hex) {
    const n = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [number, number, number]
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
  if (rgb) return [+rgb[1] / 255, +rgb[2] / 255, +rgb[3] / 255]
  return null
}

/** Read a semantic color token as a shader vec3, from the host's cascade. */
function tokenVec3(host: HTMLElement, name: string): [number, number, number] {
  const raw = getComputedStyle(host).getPropertyValue(name)
  return cssColorToVec3(raw) ?? [0.5, 0.5, 0.5]
}

export function mountField(host: HTMLElement): FieldHandle | null {
  let renderer: Renderer
  try {
    renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, DPR_CAP),
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      powerPreference: 'low-power',
      // One fullscreen quad — the copy is nothing, and re-composites
      // (screenshots, print, tab restores) stay correct while the draw loop
      // is parked between frames.
      preserveDrawingBuffer: true,
    })
  } catch {
    return null // CSS base remains the render
  }

  const gl = renderer.gl
  const canvas = gl.canvas as HTMLCanvasElement

  // Palette read once at mount, from the host so zone re-tokens are honoured.
  const uniforms = {
    u_res: { value: [1, 1] },
    u_time: { value: 0 },
    u_scroll: { value: 0 },
    u_beat: { value: 0 },
    u_pointer: { value: [0.5, 0.4] },
    u_blob0: { value: [0.5, 0.6] },
    u_blob1: { value: [0.3, 0.4] },
    u_blob2: { value: [0.7, 0.5] },
    u_blob3: { value: [0.4, 0.7] },
    u_surface: { value: tokenVec3(host, '--color-surface') },
    u_accentMuted: { value: tokenVec3(host, '--color-accent-muted') },
    u_accent: { value: tokenVec3(host, '--color-accent') },
    u_focus: { value: tokenVec3(host, '--color-focus') },
  }

  const geometry = new Triangle(gl)
  const program = new Program(gl, { vertex: VERTEX, fragment: FRAGMENT, uniforms })

  const resize = () => {
    const w = host.clientWidth
    const h = host.clientHeight
    renderer.setSize(w, h)
    renderer.setViewport(w * renderer.dpr, h * renderer.dpr)
    uniforms.u_res.value = [w, h]
  }
  resize()
  host.appendChild(canvas)

  // ── Draw state ─────────────────────────────────────────────────────────────
  let pinned = true
  let intersecting = true
  let pageVisible = !document.hidden
  let rendered = false
  let destroyed = false

  let beatTarget = 0
  const pointerTarget = [0.5, 0.4]

  const tick = (time: number) => {
    if (destroyed || !pinned || !intersecting || !pageVisible) return

    uniforms.u_time.value = time

    // Lerped pointer + beat so both read as drift, never as tracking.
    const ptr = uniforms.u_pointer.value
    ptr[0] += (pointerTarget[0] - ptr[0]) * POINTER_LERP
    ptr[1] += (pointerTarget[1] - ptr[1]) * POINTER_LERP
    uniforms.u_beat.value += (beatTarget - uniforms.u_beat.value) * BEAT_LERP

    // Four blob centres on slow, incommensurate orbits.
    uniforms.u_blob0.value = [
      0.32 + 0.2 * Math.sin(time * 0.11),
      0.62 + 0.16 * Math.cos(time * 0.09),
    ]
    uniforms.u_blob1.value = [
      0.72 + 0.18 * Math.sin(time * 0.07 + 2.1),
      0.38 + 0.2 * Math.sin(time * 0.13 + 0.7),
    ]
    uniforms.u_blob2.value = [
      0.5 + 0.26 * Math.cos(time * 0.05 + 4.2),
      0.72 + 0.14 * Math.sin(time * 0.08 + 3.3),
    ]
    uniforms.u_blob3.value = [
      0.4 + 0.22 * Math.sin(time * 0.09 + 5.6),
      0.3 + 0.18 * Math.cos(time * 0.12 + 1.9),
    ]

    program.use()
    geometry.draw({ program })

    if (!rendered) {
      rendered = true
      // First frame is on screen — let the CSS fade bring it up.
      canvas.dataset.ready = ''
    }
  }

  // ── Listeners ──────────────────────────────────────────────────────────────
  const onPointerMove = (e: PointerEvent) => {
    pointerTarget[0] = e.clientX / window.innerWidth
    pointerTarget[1] = 1 - e.clientY / window.innerHeight
  }
  const onVisibility = () => {
    pageVisible = !document.hidden
  }
  const onContextLost = () => {
    // No restore path — drop to the CSS base for the rest of the visit.
    teardown()
  }

  const io = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting
  })
  io.observe(host)

  // Host-driven (not window-driven): the host's box also changes without a
  // window resize — font swap reflow, the pin engaging — and a stale buffer
  // paints garbage rows at the bottom edge.
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onContextLost)

  gsap.ticker.add(tick)

  const teardown = () => {
    if (destroyed) return
    destroyed = true
    gsap.ticker.remove(tick)
    io.disconnect()
    ro.disconnect()
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('visibilitychange', onVisibility)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    canvas.remove()
  }

  return {
    setScroll: (progress) => {
      uniforms.u_scroll.value = progress
    },
    setBeat: (beat) => {
      beatTarget = beat
    },
    setPinned: (active) => {
      pinned = active
    },
    destroy: teardown,
  }
}
