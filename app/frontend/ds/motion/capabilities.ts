// Device capability gate for the heavy motion layers (WebGL field, physics).
// Safe to import from base bundles — no gsap, no ogl, no side effects.
//
// The CSS render is always the base; these checks only decide whether the
// enhanced layer is worth mounting on this device. Reduced motion is a
// separate, stronger gate (useMotionPref) checked before capabilities.

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as
      WebGLRenderingContext | WebGL2RenderingContext | null
    if (!gl) return false
    // Software rasterizers (SwiftShader, llvmpipe — headless browsers,
    // GPU-less runners, some VMs) report WebGL but burn main-thread CPU;
    // that's exactly the case the CSS base render exists for.
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    if (info) {
      const renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '')
      if (/swiftshader|llvmpipe|softpipe|software/i.test(renderer)) return false
    }
    return true
  } catch {
    return false
  }
}

/** Data-saver on, or a low-memory device — skip decorative heavy layers. */
export function prefersLiteMotion(): boolean {
  const nav = navigator as NavigatorWithHints
  if (nav.connection?.saveData === true) return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return true
  return false
}

/** Single gate for shader-field surfaces: capable GPU path + no lite signals. */
export function shouldMountGlLayer(): boolean {
  return !prefersLiteMotion() && canUseWebGL()
}

/** Single gate for physics surfaces (matter.js playground). */
export function shouldMountPhysicsLayer(): boolean {
  return !prefersLiteMotion()
}
