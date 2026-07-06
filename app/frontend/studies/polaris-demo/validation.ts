import type { ChoreFormData } from './types'

export interface ValidationErrors {
  title?: string
  household?: string
  points?: string
  steps?: string
}

/**
 * Validates the chore form data, including the divisibility rule:
 * when is_sharable is true and there are more than one assignee,
 * points must be evenly divisible by the number of assignees.
 */
export function validateChoreForm(data: ChoreFormData): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!data.title.trim()) {
    errors.title = 'Title is required'
  }

  if (!data.householdId) {
    errors.household = 'Choose a household'
  }

  const assigneeCount = data.assigneeIds.length
  if (data.isSharable && assigneeCount > 1 && data.points > 0) {
    if (data.points % assigneeCount !== 0) {
      const perChild = Math.floor(data.points / assigneeCount)
      const remainder = data.points % assigneeCount
      errors.points = `Points must divide evenly among ${assigneeCount} assignees. ${data.points} ÷ ${assigneeCount} = ${perChild} remainder ${remainder}.`
    }
  }

  if (data.isMultiStep) {
    const hasEmpty = data.steps.some((s) => !s.title.trim())
    if (hasEmpty) {
      errors.steps = 'All steps must have a title'
    }
  }

  return errors
}

/** Returns true if the form is valid (no errors). */
export function isFormValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0
}
