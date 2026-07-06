import { describe, expect, it } from 'vitest'
import { validateChoreForm, isFormValid } from './validation'
import type { ChoreFormData } from './types'

function baseForm(overrides: Partial<ChoreFormData> = {}): ChoreFormData {
  return {
    title: 'Water plants',
    description: '',
    points: 10,
    recurrenceType: 'none',
    dayOfWeek: 0,
    dayOfMonth: 1,
    scheduledTime: '',
    requiresVerification: false,
    isSharable: false,
    isMultiStep: false,
    steps: [],
    householdId: '1',
    assigneeIds: [],
    ...overrides,
  }
}

describe('validateChoreForm', () => {
  it('returns no errors for a valid form', () => {
    const errors = validateChoreForm(baseForm())
    expect(errors).toEqual({})
    expect(isFormValid(errors)).toBe(true)
  })

  it('returns a title error when title is empty', () => {
    const errors = validateChoreForm(baseForm({ title: '' }))
    expect(errors.title).toBeDefined()
    expect(isFormValid(errors)).toBe(false)
  })

  it('returns a title error when title is only whitespace', () => {
    const errors = validateChoreForm(baseForm({ title: '   ' }))
    expect(errors.title).toBeDefined()
  })

  describe('divisibility rule', () => {
    it('allows non-divisible points when is_sharable is false', () => {
      const errors = validateChoreForm(
        baseForm({ isSharable: false, assigneeIds: ['1', '2', '3'], points: 10 }),
      )
      expect(errors.points).toBeUndefined()
    })

    it('allows non-divisible points with only one assignee', () => {
      const errors = validateChoreForm(
        baseForm({ isSharable: true, assigneeIds: ['1'], points: 7 }),
      )
      expect(errors.points).toBeUndefined()
    })

    it('allows non-divisible points with zero assignees', () => {
      const errors = validateChoreForm(baseForm({ isSharable: true, assigneeIds: [], points: 7 }))
      expect(errors.points).toBeUndefined()
    })

    it('allows evenly divisible points when sharable with multiple assignees', () => {
      const errors = validateChoreForm(
        baseForm({ isSharable: true, assigneeIds: ['1', '2'], points: 10 }),
      )
      expect(errors.points).toBeUndefined()
    })

    it('rejects non-divisible points when sharable with 2 assignees', () => {
      const errors = validateChoreForm(
        baseForm({ isSharable: true, assigneeIds: ['1', '2'], points: 7 }),
      )
      expect(errors.points).toBeDefined()
      expect(errors.points).toContain('2')
    })

    it('rejects non-divisible points when sharable with 3 assignees', () => {
      const errors = validateChoreForm(
        baseForm({ isSharable: true, assigneeIds: ['1', '2', '3'], points: 10 }),
      )
      expect(errors.points).toBeDefined()
      expect(isFormValid(errors)).toBe(false)
    })

    it('allows divisible points when sharable with 3 assignees', () => {
      const errors = validateChoreForm(
        baseForm({ isSharable: true, assigneeIds: ['1', '2', '3'], points: 9 }),
      )
      expect(errors.points).toBeUndefined()
    })

    it('allows 0 points regardless of shareability', () => {
      const errors = validateChoreForm(
        baseForm({ isSharable: true, assigneeIds: ['1', '2'], points: 0 }),
      )
      expect(errors.points).toBeUndefined()
    })
  })

  describe('steps validation', () => {
    it('reports no step error when isMultiStep is false', () => {
      const errors = validateChoreForm(
        baseForm({ isMultiStep: false, steps: [{ key: '1', title: '' }] }),
      )
      expect(errors.steps).toBeUndefined()
    })

    it('reports a step error when a step title is empty', () => {
      const errors = validateChoreForm(
        baseForm({ isMultiStep: true, steps: [{ key: '1', title: '' }] }),
      )
      expect(errors.steps).toBeDefined()
    })

    it('no step error when all steps have titles', () => {
      const errors = validateChoreForm(
        baseForm({
          isMultiStep: true,
          steps: [
            { key: '1', title: 'Fill can' },
            { key: '2', title: 'Water plants' },
          ],
        }),
      )
      expect(errors.steps).toBeUndefined()
    })
  })
})
