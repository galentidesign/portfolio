import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mountAssemblyMotion } from './index'
import { BEAT_IDS, beatForProgress, setActiveBeat, type BeatId } from './timeline'

// jsdom is layout-less and ScrollTrigger needs a scroller it can measure, so we
// stub the plugin (acceptable in tests only — the module always registers the
// real one). Everything else — gsap.context, gsap.timeline, gsap.set — is real.
vi.mock('gsap/ScrollTrigger', () => {
  const create = vi.fn(() => ({ kill: vi.fn() }))
  return {
    ScrollTrigger: { create, register: vi.fn(), getAll: () => [], refresh: vi.fn() },
    default: { create },
  }
})

/** A section carrying every data hook the beats look up, matching the DOM. */
function makeSection(): HTMLElement {
  const section = document.createElement('section')
  section.setAttribute('data-testid', 'assembly-opening')
  const chip = (n: string) => `<span data-chip="${n}"></span>`
  const tick = (n: number) => `<span data-tick="${n}"></span>`
  section.innerHTML = `
    <button data-testid="skip-intro">Skip</button>
    <div data-assembly-hero><h1>J Galenti</h1><p>subline</p></div>
    <ol data-assembly-steps>
      <li data-beat="tokens"><div data-exhibit="tokens">
        <div data-assembly-part="chips">${['surface', 'ink', 'accent', 'positive', 'line'].map(chip).join('')}</div>
        <div data-assembly-part="specimens"><span>Aa</span><code>16px</code></div>
        <div data-assembly-part="ruler">${[1, 2, 3, 4, 5, 6].map(tick).join('')}</div>
        <svg data-assembly-part="ease"><path></path></svg>
      </div></li>
      <li data-beat="atom"><div data-exhibit="atom">
        <button data-assembly-part="button">Assemble</button>
      </div></li>
      <li data-beat="molecule"><div data-exhibit="molecule">
        <div><label>Email</label><input data-assembly-part="field" /></div>
        <button data-assembly-part="button">Assemble</button>
      </div></li>
      <li data-beat="organisms"><div data-exhibit="organisms">
        <div data-assembly-part="bar">bar</div>
        <div data-assembly-part="table"><table><tbody>
          <tr><td>a</td></tr><tr><td>b</td></tr><tr><td>c</td></tr>
        </tbody></table></div>
      </div></li>
      <li data-beat="shell"><div data-exhibit="shell">
        <div data-assembly-part="frame"><div>bar</div></div>
      </div></li>
    </ol>
  `
  document.body.appendChild(section)
  return section
}

const createMock = vi.mocked(ScrollTrigger.create)
const createVars = () => createMock.mock.calls[0][0]
const createdTrigger = () => createMock.mock.results[0].value as { kill: ReturnType<typeof vi.fn> }
const master = () => createVars().animation as gsap.core.Timeline

beforeEach(() => {
  // The stub is not a real plugin; neutralise registration so it never warns.
  vi.spyOn(gsap, 'registerPlugin').mockImplementation(() => undefined)
  createMock.mockClear()
})

afterEach(() => {
  document.querySelectorAll('[data-testid="assembly-opening"]').forEach((el) => el.remove())
  vi.restoreAllMocks()
})

describe('mountAssemblyMotion', () => {
  it('returns a handle and flips data-motion on after the initial sets', () => {
    const section = makeSection()
    const handle = mountAssemblyMotion(section)

    expect(typeof handle.skipToEnd).toBe('function')
    expect(typeof handle.destroy).toBe('function')
    expect(section.dataset.motion).toBe('on')
    // Proof the initial gsap.set ran: the hero is pinned visible.
    const hero = section.querySelector<HTMLElement>('[data-assembly-hero]')
    expect(hero?.style.opacity).toBe('1')
  })

  it('creates exactly one pinning ScrollTrigger over the section', () => {
    const section = makeSection()
    mountAssemblyMotion(section)

    expect(createMock).toHaveBeenCalledTimes(1)
    const vars = createVars()
    expect(vars.trigger).toBe(section)
    expect(vars.pin).toBe(true)
    expect(vars.scrub).toBe(true)
    expect(vars.start).toBe('top top')
    expect(vars.end).toBe('+=520%')
  })

  it('builds a master timeline labelled with the five beat ids in order', () => {
    const section = makeSection()
    mountAssemblyMotion(section)
    expect(Object.keys(master().labels)).toEqual([...BEAT_IDS])
  })

  it('marks exactly one active beat — tokens — on mount', () => {
    const section = makeSection()
    mountAssemblyMotion(section)
    const active = section.querySelectorAll('[data-beat-active]')
    expect(active).toHaveLength(1)
    expect(active[0].getAttribute('data-beat')).toBe('tokens')
  })

  it('does not fire onComplete on mount', () => {
    const section = makeSection()
    const onComplete = vi.fn()
    mountAssemblyMotion(section, { onComplete })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('advances the active beat as scroll progress maps through the ranges', () => {
    const section = makeSection()
    mountAssemblyMotion(section)
    const onUpdate = createVars().onUpdate
    const at = (progress: number) => {
      onUpdate?.({ progress } as ScrollTrigger)
      return section.querySelector('[data-beat-active]')?.getAttribute('data-beat')
    }

    expect(at(0.05)).toBe('tokens')
    expect(at(0.25)).toBe('atom')
    expect(at(0.45)).toBe('molecule')
    expect(at(0.65)).toBe('organisms')
    expect(at(0.9)).toBe('shell')
    // Still exactly one active step after all the transitions.
    expect(section.querySelectorAll('[data-beat-active]')).toHaveLength(1)
  })

  it('skipToEnd lands the final state, kills the pin, and completes exactly once', () => {
    const section = makeSection()
    const onComplete = vi.fn()
    const handle = mountAssemblyMotion(section, { onComplete })

    handle.skipToEnd()
    expect(master().progress()).toBe(1)
    expect(createdTrigger().kill).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(1)

    // A double-skip stays once.
    handle.skipToEnd()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('fires onComplete once when the trigger leaves past the end', () => {
    const section = makeSection()
    const onComplete = vi.fn()
    mountAssemblyMotion(section, { onComplete })

    const onLeave = createVars().onLeave
    onLeave?.({} as ScrollTrigger)
    onLeave?.({} as ScrollTrigger)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('destroy reverts inline styles, drops data-motion, and clears the active beat', () => {
    const section = makeSection()
    const handle = mountAssemblyMotion(section)
    const hero = section.querySelector<HTMLElement>('[data-assembly-hero]')
    expect(hero?.style.opacity).toBe('1')

    handle.destroy()

    expect(section.dataset.motion).toBeUndefined()
    expect(hero?.style.opacity).toBe('')
    expect(hero?.style.transform).toBe('')
    expect(section.querySelectorAll('[data-beat-active]')).toHaveLength(0)
  })
})

describe('beatForProgress', () => {
  it('maps progress to the active beat — a beat holds through its trailing plateau', () => {
    const cases: [number, BeatId][] = [
      [-0.2, 'tokens'],
      [0, 'tokens'],
      [0.1, 'tokens'],
      [0.15, 'tokens'], // trailing hold — tokens stays active until atom begins
      [0.2, 'atom'],
      [0.3, 'atom'],
      [0.36, 'atom'], // trailing hold
      [0.4, 'molecule'],
      [0.5, 'molecule'],
      [0.57, 'molecule'], // trailing hold
      [0.61, 'organisms'],
      [0.7, 'organisms'],
      [0.78, 'organisms'], // trailing hold
      [0.82, 'shell'],
      [0.9, 'shell'],
      [1, 'shell'],
      [1.4, 'shell'],
    ]
    for (const [progress, id] of cases) expect(beatForProgress(progress)).toBe(id)
  })
})

describe('setActiveBeat', () => {
  it('keeps exactly one step active and switches cleanly', () => {
    const section = makeSection()

    setActiveBeat(section, 'molecule')
    let active = section.querySelectorAll('[data-beat-active]')
    expect(active).toHaveLength(1)
    expect(active[0].getAttribute('data-beat')).toBe('molecule')

    setActiveBeat(section, 'shell')
    active = section.querySelectorAll('[data-beat-active]')
    expect(active).toHaveLength(1)
    expect(active[0].getAttribute('data-beat')).toBe('shell')
  })
})
