import type { ComponentMeta } from '../componentMeta'

// Tabs has no variant axes — which tab is selected is runtime state, not an
// enumerable styling axis, so variants is {} per the M3 drift-check contract.
export const meta = {
  slug: 'tabs',
  name: 'Tabs',
  tier: 'gallery',
  description: 'Tabbed panels with roving tabindex and automatic activation.',
  variants: {},
  props: [
    {
      name: 'items',
      type: 'readonly TabItem[]',
      description: 'Tab definitions; TabItem is { id: string; label: string; content: ReactNode }.',
    },
    {
      name: 'selected',
      type: 'string',
      description: 'Controlled selected tab id — pair with onChange.',
    },
    {
      name: 'defaultSelected',
      type: 'string',
      description: 'Uncontrolled initial selection; defaults to the first item.',
    },
    {
      name: 'onChange',
      type: '(id: string) => void',
      description: 'Fires with the item id on click or keyboard selection, in both modes.',
    },
    {
      name: 'label',
      type: 'string',
      default: "'Tabs'",
      description: 'aria-label for the tablist.',
    },
  ],
} as const satisfies ComponentMeta
