import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { useDemoChores } from './useDemoChores'
import type { DemoState } from './types'

// ----- Fixtures -----
// Each factory returns a FRESH Response — a Response body is single-use,
// so mocks that fetch more than once must use mockImplementation.

const STUB_CHORE = {
  id: 1,
  title: 'Vacuum the living room',
  description: null,
  points: 10,
  recurrence: null,
  scheduled_time: null,
  requires_verification: false,
  is_sharable: false,
  is_multi_step: false,
  steps: [],
  assignees: [],
  household: { id: 1, name: 'Alder Row' },
}

const STUB_HOUSEHOLD = { id: 1, name: 'Alder Row' }

function makeSuccessResponse() {
  return new Response(
    JSON.stringify({ state: 'success', chores: [STUB_CHORE], households: [STUB_HOUSEHOLD] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function makeEmptyResponse() {
  return new Response(
    JSON.stringify({ state: 'empty', chores: [], households: [STUB_HOUSEHOLD] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function makeLoadingResponse() {
  return new Response(JSON.stringify({ state: 'loading', chores: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeErrorResponse() {
  return new Response(
    JSON.stringify({
      state: 'error',
      error: { code: 'demo_simulated_failure', message: 'Simulated upstream failure.' },
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } },
  )
}

// ----- Tests -----
// NOTE: no vi.useFakeTimers() in beforeEach — fake timers break RTL waitFor
// (repo gotcha). The polling test enables them locally and restores in finally.

describe('useDemoChores', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in fetching status with a never-resolving fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useDemoChores('success'))

    await waitFor(() => expect(result.current.status).toBe('fetching'))
  })

  it('transitions to success with chores and households', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(makeSuccessResponse()))

    const { result } = renderHook(() => useDemoChores('success'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.chores).toHaveLength(1)
    expect(result.current.chores[0]?.title).toBe('Vacuum the living room')
    expect(result.current.households).toHaveLength(1)
  })

  it('requests the contract URL with state and latency params', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(makeSuccessResponse()))

    const { result } = renderHook(() => useDemoChores('success', 450))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(fetchSpy).toHaveBeenCalledWith(
      '/demo/api/chores?state=success&latency=450',
      expect.objectContaining({ signal: expect.anything() }),
    )
  })

  it('transitions to empty with no chores', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(makeEmptyResponse()))

    const { result } = renderHook(() => useDemoChores('empty'))

    await waitFor(() => expect(result.current.status).toBe('empty'))
    expect(result.current.chores).toHaveLength(0)
  })

  it('transitions to error with the error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(makeErrorResponse()))

    const { result } = renderHook(() => useDemoChores('error'))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Simulated upstream failure.')
  })

  it('transitions to loading on a loading response and re-polls after 600ms', async () => {
    // Fake timers ONLY inside this test; restored in finally (repo gotcha:
    // fake timers active during sibling tests break RTL waitFor).
    vi.useFakeTimers()
    try {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(makeLoadingResponse()))

      const { result } = renderHook(() => useDemoChores('loading'))

      // Drain the initial fetch promise chain without waitFor.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(result.current.status).toBe('loading')
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // Advance past POLL_DELAY_MS (600ms) — the scheduled re-poll fires.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })

      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(result.current.status).toBe('loading')
    } finally {
      vi.useRealTimers()
    }
  })

  it('aborts the in-flight request when state switches', () => {
    // Spy on the real prototype — replacing globalThis.AbortController leaks
    // into later tests if an assertion throws before manual restore.
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    const { rerender } = renderHook(({ s }: { s: DemoState }) => useDemoChores(s), {
      initialProps: { s: 'success' as DemoState },
    })

    expect(abortSpy).not.toHaveBeenCalled()

    rerender({ s: 'error' as DemoState })

    expect(abortSpy).toHaveBeenCalled()
  })

  it('aborts the in-flight request on unmount', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    const { unmount } = renderHook(() => useDemoChores('success'))

    unmount()

    expect(abortSpy).toHaveBeenCalled()
  })

  it('retry restarts the fetch loop', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(makeErrorResponse()))

    const { result } = renderHook(() => useDemoChores('error'))

    await waitFor(() => expect(result.current.status).toBe('error'))

    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(makeSuccessResponse()))

    act(() => {
      result.current.retry()
    })

    await waitFor(() => expect(result.current.status).toBe('success'))
  })
})
