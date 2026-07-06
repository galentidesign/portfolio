/**
 * Structural integrity tests for the agent-build receipt data.
 * Verifies shape, ordering, and filesystem presence of source files.
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { receipts } from './data'

describe('receipts data', () => {
  it('has one entry per milestone, m0 through m10', () => {
    expect(receipts).toHaveLength(11)
  })

  it('ids are m0..m10, unique, in order', () => {
    const expected = Array.from({ length: 11 }, (_, i) => `m${i}`)
    expect(receipts.map((r) => r.id)).toEqual(expected)
  })

  describe('each entry', () => {
    receipts.forEach((receipt) => {
      describe(receipt.id, () => {
        it('date is ISO format', () => {
          expect(receipt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })

        it('date matches the date in sourcePath', () => {
          const dateFromPath = receipt.sourcePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1]
          expect(receipt.date).toBe(dateFromPath)
        })

        it('sourcePath matches expected pattern', () => {
          expect(receipt.sourcePath).toMatch(/^docs\/receipts\/\d{4}-\d{2}-\d{2}-m\d+\.md$/)
        })

        it('source file exists on disk', () => {
          const abs = resolve(process.cwd(), receipt.sourcePath)
          expect(existsSync(abs)).toBe(true)
        })

        it('commits >= 1', () => {
          expect(receipt.commits).toBeGreaterThanOrEqual(1)
        })

        it('agents is non-empty', () => {
          expect(receipt.agents.length).toBeGreaterThan(0)
        })

        it('exactly one orchestrator-role group, listed first', () => {
          const orchestratorGroups = receipt.agents.filter((a) => a.role === 'orchestrator')
          expect(orchestratorGroups).toHaveLength(1)
          expect(receipt.agents[0].role).toBe('orchestrator')
        })

        it('moments length is 2–4', () => {
          expect(receipt.moments.length).toBeGreaterThanOrEqual(2)
          expect(receipt.moments.length).toBeLessThanOrEqual(4)
        })

        it('each moment is ≤160 chars', () => {
          receipt.moments.forEach((m, i) => {
            expect(m.length, `moment[${i}] = ${m.length} chars`).toBeLessThanOrEqual(160)
          })
        })

        it('excerpt is ≤300 chars when present', () => {
          if (receipt.excerpt !== undefined) {
            expect(
              receipt.excerpt.length,
              `excerpt = ${receipt.excerpt.length} chars`,
            ).toBeLessThanOrEqual(300)
          }
        })

        it('suite counts are positive when present', () => {
          if (receipt.suite !== undefined) {
            expect(receipt.suite.unit).toBeGreaterThan(0)
            expect(receipt.suite.rspec).toBeGreaterThan(0)
            expect(receipt.suite.e2e).toBeGreaterThan(0)
          }
        })
      })
    })
  })
})
