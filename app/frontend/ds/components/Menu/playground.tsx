import type { PlaygroundHostProps, PlaygroundValues } from '../playground'
import { Menu, type MenuItem, type MenuProps } from './Menu'

export const playgroundMeta = { slug: 'menu' }

// items is a non-scalar prop (objects carrying handlers) — auto-skipped by
// the control system. The host supplies a small fixed list; selection is a
// no-op since only the trigger/menu chrome is under test here.
const items: readonly MenuItem[] = [
  { id: 'archive', label: 'Archive', onSelect: () => {} },
  { id: 'duplicate', label: 'Duplicate', onSelect: () => {} },
  { id: 'delete', label: 'Delete', onSelect: () => {} },
]

export default function MenuPlayground({ values }: PlaygroundHostProps) {
  const { label: rawLabel, align } = values as {
    label?: string
    align?: MenuProps['align']
  }

  // label is required in MenuProps; fall back to demo value when the text
  // control is empty (empty strings are omitted before the host sees them).
  const label = rawLabel || 'Actions'

  return <Menu label={label} items={items} align={align} />
}

export function snippet(attrs: string, values: PlaygroundValues): string {
  // Reflect the host's label fallback when the control is empty.
  const labelAttr = values.label ? '' : ' label="Actions"'
  return `<Menu${labelAttr}${attrs} items={items} />`
}
