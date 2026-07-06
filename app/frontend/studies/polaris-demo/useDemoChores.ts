import { useState, useEffect, useCallback } from 'react'
import type { Chore, ChoreHousehold, DemoState } from './types'

export type FetchStatus = 'fetching' | 'success' | 'empty' | 'loading' | 'error'

export interface UseDemoChoresResult {
  status: FetchStatus
  chores: Chore[]
  households: ChoreHousehold[]
  error: string | null
  retry: () => void
}

const POLL_DELAY_MS = 600

/**
 * Fetches the demo chores list from the Rails demo API.
 *
 * - Aborts the in-flight request when `state` changes or on unmount.
 * - When the server responds with state:"loading", re-polls after POLL_DELAY_MS
 *   for as long as the switcher stays on "loading".
 * - The `retry` callback bumps an internal key to restart the fetch loop,
 *   used by the error Banner's retry action.
 */
export function useDemoChores(state: DemoState, latency = 450): UseDemoChoresResult {
  const [status, setStatus] = useState<FetchStatus>('fetching')
  const [chores, setChores] = useState<Chore[]>([])
  const [households, setHouseholds] = useState<ChoreHousehold[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let aborted = false
    const controller = new AbortController()
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    const doFetch = async () => {
      setStatus('fetching')
      setError(null)
      try {
        const url = `/demo/api/chores?state=${state}&latency=${latency}`
        const res = await fetch(url, { signal: controller.signal })

        if (aborted) return

        // For error states the server returns 500
        const data: unknown = await res.json()
        if (aborted) return

        const payload = data as {
          state: string
          chores?: Chore[]
          households?: ChoreHousehold[]
          error?: { code: string; message: string }
        }

        if (payload.state === 'success' || payload.state === 'empty') {
          setChores(payload.chores ?? [])
          setHouseholds(payload.households ?? [])
          setStatus(payload.state as 'success' | 'empty')
        } else if (payload.state === 'loading') {
          setChores([])
          setStatus('loading')
          // Re-poll after delay while switcher remains on "loading"
          pollTimer = setTimeout(() => {
            if (!aborted) void doFetch()
          }, POLL_DELAY_MS)
        } else if (payload.state === 'error') {
          setError(payload.error?.message ?? 'Unknown error')
          setStatus('error')
        } else {
          setError('Unexpected response from server')
          setStatus('error')
        }
      } catch (e) {
        if (aborted) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : 'Network error')
        setStatus('error')
      }
    }

    void doFetch()

    return () => {
      aborted = true
      controller.abort()
      if (pollTimer !== null) clearTimeout(pollTimer)
    }
  }, [state, latency, retryKey])

  const retry = useCallback(() => setRetryKey((k) => k + 1), [])

  return { status, chores, households, error, retry }
}
