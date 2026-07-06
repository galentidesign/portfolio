export type DemoState = 'success' | 'loading' | 'empty' | 'error'
export type DemoView = 'index' | 'create' | 'edit'

export interface ChoreAssignee {
  id: number
  name: string
  hue: number
}

export interface ChoreStep {
  id: number
  title: string
  position: number
}

export interface ChoreHousehold {
  id: number
  name: string
  hue?: number
  children?: ChoreAssignee[]
}

export interface ChoreRecurrence {
  type: 'daily' | 'weekly' | 'monthly'
  day_of_week?: number
  day_of_month?: number
}

export interface Chore {
  id: number
  title: string
  description: string | null
  points: number
  recurrence: ChoreRecurrence | null
  scheduled_time: string | null
  requires_verification: boolean
  is_sharable: boolean
  is_multi_step: boolean
  steps: ChoreStep[]
  assignees: ChoreAssignee[]
  household: ChoreHousehold
}

export interface ChoreFormData {
  title: string
  description: string
  points: number
  recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly'
  dayOfWeek: number
  dayOfMonth: number
  scheduledTime: string
  requiresVerification: boolean
  isSharable: boolean
  isMultiStep: boolean
  steps: Array<{ key: string; title: string }>
  householdId: string
  assigneeIds: string[]
}
