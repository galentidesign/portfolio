/**
 * Unit tests for the useFx gate: reduced motion mounts nothing (and never
 * imports the fx barrel's dependencies), motion mode dynamically imports and
 * mounts, unmount and live reduced flips destroy the handle.
 */
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFx } from './useFx'

const { motionPref, destroySpy, mountSpy } = vi.hoisted(() => {
  const destroySpy = vi.fn()
  return {
    motionPref: { reduced: false },
    destroySpy,
    mountSpy: vi.fn(() => ({ destroy: destroySpy })),
  }
})

vi.mock('./useMotionPref', () => ({
  useMotionPref: () => ({
    reduced: motionPref.reduced,
    manualReduced: false,
    setManualReduced: vi.fn(),
  }),
}))

// The barrel is mocked so the gate's import/mount wiring is observable
// without loading GSAP.
vi.mock('./fx', () => ({ mountProximityGlow: mountSpy }))

function Probe() {
  const ref = useFx<HTMLDivElement>((fx, el) => fx.mountProximityGlow(el))
  return <div data-testid="probe" ref={ref} />
}

// beforeEach, not afterEach: testing-library's auto-cleanup (setup.ts) runs
// after this file's hooks, so an unmount-destroy would leak past an afterEach
// reset into the next test's call counts.
beforeEach(() => {
  motionPref.reduced = false
  mountSpy.mockClear()
  destroySpy.mockClear()
})

describe('useFx', () => {
  it('imports the fx barrel and mounts on the referenced element in motion mode', async () => {
    const { getByTestId } = render(<Probe />)

    await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(1))
    expect(mountSpy).toHaveBeenCalledWith(getByTestId('probe'))
  })

  it('destroys the handle on unmount', async () => {
    const { unmount } = render(<Probe />)
    await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(1))

    unmount()
    expect(destroySpy).toHaveBeenCalledTimes(1)
  })

  it('mounts nothing under reduced motion', async () => {
    motionPref.reduced = true
    render(<Probe />)

    // Flush the microtask queue a dynamic import would resolve on.
    await new Promise<void>((r) => setTimeout(r, 20))
    expect(mountSpy).not.toHaveBeenCalled()
  })

  it('destroys the handle on a live flip to reduced motion', async () => {
    const { rerender } = render(<Probe />)
    await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(1))

    motionPref.reduced = true
    rerender(<Probe />)

    await waitFor(() => expect(destroySpy).toHaveBeenCalledTimes(1))
    expect(mountSpy).toHaveBeenCalledTimes(1)
  })
})
