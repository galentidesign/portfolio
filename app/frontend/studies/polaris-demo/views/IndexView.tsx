import { useState, useMemo } from 'react'
import {
  Page,
  IndexTable,
  Badge,
  EmptyState,
  Banner,
  TextField,
  BlockStack,
  SkeletonPage,
  SkeletonBodyText,
  Card,
  Text,
  InlineStack,
} from '@shopify/polaris'
import type { FetchStatus } from '../useDemoChores'
import type { Chore } from '../types'
import emptyStateImage from '../empty-state.svg'

// IndexTableSortDirection is not re-exported at the package index level in 13.x.
type SortDirection = 'ascending' | 'descending'

function formatCadence(chore: Chore): string {
  if (!chore.recurrence) return 'One-time'
  const { type } = chore.recurrence
  if (type === 'daily') return 'Daily'
  if (type === 'weekly') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const day = chore.recurrence.day_of_week ?? 0
    return `Weekly · ${days[day]}`
  }
  if (type === 'monthly') {
    const dom = chore.recurrence.day_of_month ?? 1
    return `Monthly · day ${dom}`
  }
  return type
}

function formatAssignees(chore: Chore): string {
  if (chore.assignees.length === 0) return 'Unassigned'
  return chore.assignees.map((a) => a.name).join(', ')
}

type SortCol = 'title' | 'household' | 'assignees' | 'cadence' | 'points'

interface IndexViewProps {
  status: FetchStatus
  chores: Chore[]
  retry: () => void
  onCreateNew: () => void
  onEdit: (id: number) => void
}

export function IndexView({ status, chores, retry, onCreateNew, onEdit }: IndexViewProps) {
  const [filterText, setFilterText] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('title')
  const [sortDir, setSortDir] = useState<SortDirection>('ascending')

  const columnDefs: Array<{ key: SortCol; title: string }> = [
    { key: 'title', title: 'Title' },
    { key: 'household', title: 'Household' },
    { key: 'assignees', title: 'Assignees' },
    { key: 'cadence', title: 'Cadence' },
    { key: 'points', title: 'Points' },
  ]

  const colIndex = columnDefs.findIndex((c) => c.key === sortCol)

  const filtered = useMemo(() => {
    const q = filterText.toLowerCase()
    return q
      ? chores.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.household.name.toLowerCase().includes(q) ||
            c.assignees.some((a) => a.name.toLowerCase().includes(q)),
        )
      : chores
  }, [chores, filterText])

  const sorted = useMemo(() => {
    const asc = sortDir === 'ascending' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortCol === 'title') return asc * a.title.localeCompare(b.title)
      if (sortCol === 'household') return asc * a.household.name.localeCompare(b.household.name)
      if (sortCol === 'assignees') return asc * formatAssignees(a).localeCompare(formatAssignees(b))
      if (sortCol === 'cadence') return asc * formatCadence(a).localeCompare(formatCadence(b))
      if (sortCol === 'points') return asc * (a.points - b.points)
      return 0
    })
  }, [filtered, sortCol, sortDir])

  const handleSort = (index: number, dir: SortDirection) => {
    const col = columnDefs[index]
    if (col) {
      setSortCol(col.key)
      setSortDir(dir)
    }
  }

  if (status === 'fetching') {
    return (
      <SkeletonPage title="Chores" primaryAction backAction>
        <Card>
          <BlockStack gap="400">
            <SkeletonBodyText lines={3} />
            <SkeletonBodyText lines={3} />
            <SkeletonBodyText lines={3} />
          </BlockStack>
        </Card>
      </SkeletonPage>
    )
  }

  if (status === 'loading') {
    return (
      <SkeletonPage title="Chores" primaryAction backAction>
        <Card>
          <BlockStack gap="400">
            <SkeletonBodyText lines={5} />
            <SkeletonBodyText lines={5} />
          </BlockStack>
        </Card>
      </SkeletonPage>
    )
  }

  if (status === 'error') {
    return (
      <Page title="Chores" primaryAction={{ content: 'New chore', onAction: onCreateNew }}>
        <Banner
          tone="critical"
          title="Could not load chores"
          action={{ content: 'Try again', onAction: retry }}
        >
          <p>Simulated upstream failure. Use the state switcher above to recover.</p>
        </Banner>
      </Page>
    )
  }

  if (status === 'empty') {
    return (
      <Page title="Chores" primaryAction={{ content: 'New chore', onAction: onCreateNew }}>
        <EmptyState
          heading="No chores yet"
          image={emptyStateImage}
          action={{ content: 'Add a chore', onAction: onCreateNew }}
        >
          <p>Add chores to track household tasks and assign them to children.</p>
        </EmptyState>
      </Page>
    )
  }

  // success state
  return (
    <Page title="Chores" primaryAction={{ content: 'New chore', onAction: onCreateNew }}>
      <BlockStack gap="400">
        <TextField
          label="Filter chores"
          labelHidden
          placeholder="Filter by title, household, or assignee…"
          value={filterText}
          onChange={setFilterText}
          autoComplete="off"
          clearButton
          onClearButtonClick={() => setFilterText('')}
        />
        <IndexTable
          resourceName={{ singular: 'chore', plural: 'chores' }}
          itemCount={sorted.length}
          selectable={false}
          headings={
            columnDefs.map((c) => ({ title: c.title })) as [
              { title: string },
              ...{ title: string }[],
            ]
          }
          sortable={columnDefs.map(() => true)}
          sortDirection={sortDir}
          sortColumnIndex={colIndex >= 0 ? colIndex : 0}
          onSort={handleSort}
        >
          {sorted.map((chore, position) => (
            <IndexTable.Row
              key={chore.id}
              id={String(chore.id)}
              position={position}
              onClick={() => onEdit(chore.id)}
            >
              <IndexTable.Cell>
                <InlineStack gap="200" wrap={false} blockAlign="center">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {chore.title}
                  </Text>
                  {chore.requires_verification && <Badge tone="attention">Verified</Badge>}
                  {chore.is_sharable && <Badge tone="info">Sharable</Badge>}
                </InlineStack>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" variant="bodyMd">
                  {chore.household.name}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" variant="bodyMd">
                  {formatAssignees(chore)}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" variant="bodyMd">
                  {formatCadence(chore)}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" variant="bodyMd">
                  {chore.points} pts
                </Text>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </BlockStack>
    </Page>
  )
}
