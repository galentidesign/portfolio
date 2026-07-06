import { useState, useEffect, useCallback } from 'react'
import {
  Page,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  ChoiceList,
  BlockStack,
  InlineStack,
  Button,
  Modal,
  Text,
  Card,
  Divider,
  SkeletonPage,
  SkeletonBodyText,
  Banner,
} from '@shopify/polaris'
import type { Chore, ChoreHousehold, ChoreFormData } from '../types'
import { validateChoreForm, isFormValid } from '../validation'

// ----- Edit fetch hook (exported so PolarisDemo can use it) -----

export interface ChoreDetailState {
  status: 'fetching' | 'ready' | 'error'
  chore: Chore | null
  error: string | null
}

export function useChoreDetail(choreId: number): ChoreDetailState {
  const [state, setState] = useState<ChoreDetailState>({
    status: 'fetching',
    chore: null,
    error: null,
  })

  useEffect(() => {
    let aborted = false
    const controller = new AbortController()

    const load = async () => {
      // Reset to fetching inside the async path — not a synchronous effect setState.
      setState({ status: 'fetching', chore: null, error: null })
      try {
        const res = await fetch(`/demo/api/chores/${choreId}?latency=450`, {
          signal: controller.signal,
        })
        if (aborted) return
        const data = (await res.json()) as {
          chore?: Chore
          state?: string
          error?: { message: string }
        }
        if (aborted) return
        if (data.chore) {
          setState({ status: 'ready', chore: data.chore, error: null })
        } else {
          setState({
            status: 'error',
            chore: null,
            error: data.error?.message ?? 'Chore not found',
          })
        }
      } catch (e) {
        if (aborted) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setState({
          status: 'error',
          chore: null,
          error: e instanceof Error ? e.message : 'Network error',
        })
      }
    }

    void load()
    return () => {
      aborted = true
      controller.abort()
    }
  }, [choreId])

  return state
}

// ----- Form data helpers -----

function emptyForm(): ChoreFormData {
  return {
    title: '',
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
    householdId: '',
    assigneeIds: [],
  }
}

function choreToForm(chore: Chore): ChoreFormData {
  let recurrenceType: ChoreFormData['recurrenceType'] = 'none'
  let dayOfWeek = 0
  let dayOfMonth = 1
  if (chore.recurrence) {
    recurrenceType = chore.recurrence.type
    dayOfWeek = chore.recurrence.day_of_week ?? 0
    dayOfMonth = chore.recurrence.day_of_month ?? 1
  }
  return {
    title: chore.title,
    description: chore.description ?? '',
    points: chore.points,
    recurrenceType,
    dayOfWeek,
    dayOfMonth,
    scheduledTime: chore.scheduled_time ?? '',
    requiresVerification: chore.requires_verification,
    isSharable: chore.is_sharable,
    isMultiStep: chore.is_multi_step,
    steps: chore.steps.map((s) => ({ key: String(s.id), title: s.title })),
    householdId: String(chore.household.id),
    assigneeIds: chore.assignees.map((a) => String(a.id)),
  }
}

// ----- Edit view loader (handles skeleton / error while fetching) -----

interface EditViewLoaderProps {
  choreId: number
  households?: ChoreHousehold[]
  onBack: () => void
  onSubmit: () => void
  onDelete: () => void
}

export function EditViewLoader({
  choreId,
  households,
  onBack,
  onSubmit,
  onDelete,
}: EditViewLoaderProps) {
  const detail = useChoreDetail(choreId)

  if (detail.status === 'fetching') {
    return (
      <SkeletonPage title="Edit chore" backAction>
        <Card>
          <BlockStack gap="400">
            <SkeletonBodyText lines={4} />
            <SkeletonBodyText lines={3} />
          </BlockStack>
        </Card>
      </SkeletonPage>
    )
  }

  if (detail.status === 'error') {
    return (
      <Page title="Edit chore" backAction={{ content: 'Chores', onAction: onBack }}>
        <Banner tone="critical" title="Could not load chore">
          <p>{detail.error}</p>
        </Banner>
      </Page>
    )
  }

  if (!detail.chore) return null

  return (
    <ChoreForm
      key={detail.chore.id}
      mode="edit"
      initialChore={detail.chore}
      households={households}
      onBack={onBack}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  )
}

// ----- Main form component -----

interface ChoreFormProps {
  mode: 'create' | 'edit'
  /** Pre-loaded chore data for edit mode — form is initialized from this. */
  initialChore?: Chore
  households?: ChoreHousehold[]
  onBack: () => void
  onSubmit: () => void
  onDelete?: () => void
}

let stepKeyCounter = 1

export function ChoreForm({
  mode,
  initialChore,
  households: propHouseholds,
  onBack,
  onSubmit,
  onDelete,
}: ChoreFormProps) {
  const households = propHouseholds ?? []

  // Lazy initializer: no useEffect needed to sync from initialChore,
  // since we receive ready data as a prop. Key-based remounting in
  // EditViewLoader ensures fresh state for different chores.
  const [form, setForm] = useState<ChoreFormData>(() =>
    initialChore ? choreToForm(initialChore) : emptyForm(),
  )
  const [touched, setTouched] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const patch = useCallback(<K extends keyof ChoreFormData>(key: K, value: ChoreFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setTouched(true)
  }, [])

  // Households arrive from the fetched payload; until the user picks one the
  // first household is the derived default (deep-link to ?view=create mounts
  // the form before the index fetch resolves, so this cannot live in state).
  const effectiveHouseholdId =
    form.householdId !== '' ? form.householdId : String(households[0]?.id ?? '')
  const effectiveForm = { ...form, householdId: effectiveHouseholdId }

  const errors = touched ? validateChoreForm(effectiveForm) : {}
  const valid = isFormValid(errors)

  const selectedHousehold = households.find((h) => String(h.id) === effectiveHouseholdId)
  const availableChildren = selectedHousehold?.children ?? []

  const handleSubmit = () => {
    setTouched(true)
    if (!isFormValid(validateChoreForm(effectiveForm))) return
    onSubmit()
  }

  const addStep = () => {
    const key = `new-${stepKeyCounter++}`
    patch('steps', [...form.steps, { key, title: '' }])
  }

  const removeStep = (key: string) => {
    patch(
      'steps',
      form.steps.filter((s) => s.key !== key),
    )
  }

  const moveStep = (key: string, dir: 'up' | 'down') => {
    const idx = form.steps.findIndex((s) => s.key === key)
    if (idx === -1) return
    const next = [...form.steps]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[idx], next[swapIdx]] = [next[swapIdx]!, next[idx]!]
    patch('steps', next)
  }

  const updateStepTitle = (key: string, title: string) => {
    patch(
      'steps',
      form.steps.map((s) => (s.key === key ? { ...s, title } : s)),
    )
  }

  const pageTitle = mode === 'create' ? 'New chore' : 'Edit chore'

  const recurrenceOptions = [
    { value: 'none', label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ]

  const dowOptions = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ]

  const domOptions = Array.from({ length: 28 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }))

  const householdOptions = households.map((h) => ({
    value: String(h.id),
    label: h.name,
  }))

  const childChoices = availableChildren.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  return (
    <>
      <Page
        title={pageTitle}
        backAction={{ content: 'Chores', onAction: onBack }}
        primaryAction={{
          content: mode === 'create' ? 'Add chore' : 'Save changes',
          onAction: handleSubmit,
          disabled: touched && !valid,
        }}
        secondaryActions={
          mode === 'edit'
            ? [
                {
                  content: 'Delete chore',
                  destructive: true,
                  onAction: () => setShowDeleteModal(true),
                },
              ]
            : []
        }
      >
        <BlockStack gap="500">
          <Card>
            <FormLayout>
              <TextField
                label="Title"
                value={form.title}
                onChange={(v) => patch('title', v)}
                autoComplete="off"
                error={errors.title}
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(v) => patch('description', v)}
                multiline={3}
                autoComplete="off"
              />
            </FormLayout>
          </Card>

          <Card>
            <FormLayout>
              <Select
                label="Household"
                options={householdOptions}
                value={effectiveHouseholdId}
                placeholder={householdOptions.length === 0 ? 'No household data' : undefined}
                disabled={householdOptions.length === 0}
                helpText={
                  householdOptions.length === 0
                    ? 'Household data is unavailable in this demo state.'
                    : undefined
                }
                error={errors.household}
                onChange={(v) => {
                  patch('householdId', v)
                  patch('assigneeIds', [])
                }}
              />
              {childChoices.length > 0 && (
                <ChoiceList
                  allowMultiple
                  title="Assign to"
                  choices={childChoices}
                  selected={form.assigneeIds}
                  onChange={(v) => patch('assigneeIds', v)}
                />
              )}
            </FormLayout>
          </Card>

          <Card>
            <FormLayout>
              <TextField
                label="Points"
                type="number"
                value={String(form.points)}
                onChange={(v) => patch('points', Number(v) || 0)}
                autoComplete="off"
                min={0}
                error={errors.points}
                helpText={
                  form.isSharable && form.assigneeIds.length > 1
                    ? `Sharable with ${form.assigneeIds.length} assignees — must divide evenly`
                    : undefined
                }
              />
              <InlineStack gap="400">
                <Checkbox
                  label="Requires verification"
                  checked={form.requiresVerification}
                  onChange={(v) => patch('requiresVerification', v)}
                />
                <Checkbox
                  label="Sharable"
                  checked={form.isSharable}
                  onChange={(v) => patch('isSharable', v)}
                />
              </InlineStack>
            </FormLayout>
          </Card>

          <Card>
            <FormLayout>
              <Select
                label="Recurrence"
                options={recurrenceOptions}
                value={form.recurrenceType}
                onChange={(v) => patch('recurrenceType', v as ChoreFormData['recurrenceType'])}
              />
              {form.recurrenceType === 'weekly' && (
                <Select
                  label="Day of week"
                  options={dowOptions}
                  value={String(form.dayOfWeek)}
                  onChange={(v) => patch('dayOfWeek', Number(v))}
                />
              )}
              {form.recurrenceType === 'monthly' && (
                <Select
                  label="Day of month"
                  options={domOptions}
                  value={String(form.dayOfMonth)}
                  onChange={(v) => patch('dayOfMonth', Number(v))}
                />
              )}
              <TextField
                label="Scheduled time"
                type="time"
                value={form.scheduledTime}
                onChange={(v) => patch('scheduledTime', v)}
                autoComplete="off"
              />
            </FormLayout>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Checkbox
                label="Multi-step chore"
                checked={form.isMultiStep}
                onChange={(v) => {
                  patch('isMultiStep', v)
                  if (!v) patch('steps', [])
                }}
              />
              {form.isMultiStep && (
                <>
                  <Divider />
                  {errors.steps && (
                    <Text as="p" tone="critical" variant="bodySm">
                      {errors.steps}
                    </Text>
                  )}
                  <BlockStack gap="300">
                    {form.steps.map((step, idx) => (
                      <InlineStack key={step.key} gap="200" blockAlign="center" wrap={false}>
                        <div style={{ flex: 1 }}>
                          <TextField
                            label={`Step ${idx + 1}`}
                            labelHidden
                            value={step.title}
                            onChange={(v) => updateStepTitle(step.key, v)}
                            autoComplete="off"
                            placeholder={`Step ${idx + 1}`}
                          />
                        </div>
                        <Button
                          onClick={() => moveStep(step.key, 'up')}
                          disabled={idx === 0}
                          accessibilityLabel={`Move step ${idx + 1} up`}
                          size="slim"
                        >
                          ↑
                        </Button>
                        <Button
                          onClick={() => moveStep(step.key, 'down')}
                          disabled={idx === form.steps.length - 1}
                          accessibilityLabel={`Move step ${idx + 1} down`}
                          size="slim"
                        >
                          ↓
                        </Button>
                        <Button
                          onClick={() => removeStep(step.key)}
                          accessibilityLabel={`Remove step ${idx + 1}`}
                          size="slim"
                          tone="critical"
                        >
                          ✕
                        </Button>
                      </InlineStack>
                    ))}
                  </BlockStack>
                  <Button onClick={addStep} size="slim">
                    Add step
                  </Button>
                </>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>

      {mode === 'edit' && (
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete chore"
          primaryAction={{
            content: 'Delete',
            destructive: true,
            onAction: () => {
              setShowDeleteModal(false)
              onDelete?.()
            },
          }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setShowDeleteModal(false) }]}
        >
          <Modal.Section>
            <Text as="p" variant="bodyMd">
              Are you sure you want to delete &quot;{form.title}&quot;? This action cannot be
              undone.
            </Text>
          </Modal.Section>
        </Modal>
      )}
    </>
  )
}
