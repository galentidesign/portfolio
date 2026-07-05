import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AssemblyOpening } from './AssemblyOpening'
import { BEATS } from './beats'

// Gate mock — per-test control over the reduced flag without a provider.
const motionPref = { reduced: true, manualReduced: false, setManualReduced: vi.fn() }
vi.mock('@/ds/motion/useMotionPref', () => ({
  useMotionPref: () => motionPref,
}))

const mountAssemblyMotion = vi.fn(() => ({ skipToEnd: vi.fn(), destroy: vi.fn() }))
vi.mock('./motion', () => ({
  mountAssemblyMotion: (...args: unknown[]) =>
    (mountAssemblyMotion as unknown as (...a: unknown[]) => unknown)(...args),
}))

beforeEach(() => {
  motionPref.reduced = true
  mountAssemblyMotion.mockClear()
  document.getElementById('gateway')?.remove()
})

describe('AssemblyOpening — static base (reduced motion)', () => {
  it('renders the hero from frame one', () => {
    render(<AssemblyOpening />)
    expect(screen.getByRole('heading', { level: 1, name: 'J Galenti' })).toBeInTheDocument()
  })

  it('renders every beat in order with its narrative caption', () => {
    const { container } = render(<AssemblyOpening />)
    const steps = [...container.querySelectorAll('[data-beat]')]
    expect(steps.map((el) => el.getAttribute('data-beat'))).toEqual(BEATS.map((b) => b.id))
    for (const beat of BEATS) {
      expect(screen.getByText(beat.caption)).toBeInTheDocument()
    }
  })

  it('keeps exhibits inert — narrative lives in the captions, not the demos', () => {
    const { container } = render(<AssemblyOpening />)
    const exhibits = [...container.querySelectorAll('[data-exhibit]')]
    expect(exhibits).toHaveLength(BEATS.length)
    for (const exhibit of exhibits) {
      expect(exhibit).toHaveAttribute('inert')
    }
  })

  it('never mounts the motion layer under reduced motion', async () => {
    render(<AssemblyOpening />)
    await new Promise((r) => setTimeout(r, 0))
    expect(mountAssemblyMotion).not.toHaveBeenCalled()
  })

  it('renders no nav landmark (facsimiles are pictures)', () => {
    render(<AssemblyOpening />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})

describe('AssemblyOpening — skip control', () => {
  it('is the first focusable control in the section', () => {
    const { container } = render(<AssemblyOpening />)
    const focusables = container.querySelectorAll('button, a, input, [tabindex]')
    expect(focusables[0]).toHaveAttribute('data-testid', 'skip-intro')
  })

  it('jumps to the gateway, moves focus there, and fires onComplete once', () => {
    const gateway = document.createElement('section')
    gateway.id = 'gateway'
    gateway.tabIndex = -1
    gateway.scrollIntoView = vi.fn()
    document.body.appendChild(gateway)

    const onComplete = vi.fn()
    render(<AssemblyOpening onComplete={onComplete} />)

    fireEvent.click(screen.getByTestId('skip-intro'))
    expect(gateway.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' })
    expect(document.activeElement).toBe(gateway)
    expect(onComplete).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('skip-intro'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('AssemblyOpening — motion enhancement', () => {
  it('mounts the motion layer via dynamic import when motion is allowed', async () => {
    motionPref.reduced = false
    const { container } = render(<AssemblyOpening />)
    await waitFor(() => expect(mountAssemblyMotion).toHaveBeenCalledTimes(1))
    expect(mountAssemblyMotion).toHaveBeenCalledWith(
      container.querySelector('[data-testid="assembly-opening"]'),
      expect.objectContaining({ onComplete: expect.any(Function) }),
    )
  })

  it('destroys the handle when unmounted', async () => {
    motionPref.reduced = false
    const destroy = vi.fn()
    mountAssemblyMotion.mockReturnValueOnce({ skipToEnd: vi.fn(), destroy })
    const { unmount } = render(<AssemblyOpening />)
    await waitFor(() => expect(mountAssemblyMotion).toHaveBeenCalled())
    unmount()
    expect(destroy).toHaveBeenCalledTimes(1)
  })
})
