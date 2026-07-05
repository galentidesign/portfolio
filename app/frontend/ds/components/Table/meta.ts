import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'table',
  name: 'Table',
  tier: 'hero',
  description:
    'Accessible sortable data table with controlled sort, custom cell renderers, and empty state.',
  // Table has no data-* visual variant axes — all configurability is through
  // props (column definitions, sort state, empty content). No skins need
  // component edits to re-theme it.
  variants: {},
  props: [
    {
      name: 'caption',
      type: 'string',
      description:
        'Table caption text (required for accessibility). Rendered as a real <caption> element; visually hidden by default via captionHidden.',
    },
    {
      name: 'captionHidden',
      type: 'boolean',
      default: 'true',
      description:
        'Visually hides the caption with the standard clip pattern while keeping it accessible to screen readers.',
    },
    {
      name: 'columns',
      type: 'readonly TableColumn<T>[]',
      description:
        'Column definitions — each specifies key, header, optional align (start | end), optional sortable flag, and optional render override.',
    },
    {
      name: 'rows',
      type: 'readonly T[]',
      description:
        'Data rows rendered in the provided order. The component never sorts internally; the owner manages ordering.',
    },
    {
      name: 'rowKey',
      type: '(row: T) => string',
      description: 'Derives a stable React key from each row object.',
    },
    {
      name: 'sort',
      type: 'TableSort | undefined',
      description:
        'Controlled sort state ({ key: string; dir: "asc" | "desc" }). Reflected as aria-sort on the active column header.',
    },
    {
      name: 'onSortChange',
      type: '((sort: TableSort) => void) | undefined',
      description:
        'Called when a sortable column header button is clicked. New column → { key, dir: "asc" }; active column → toggles asc ↔ desc.',
    },
    {
      name: 'empty',
      type: 'ReactNode | undefined',
      description: 'Rendered in a single full-span <td> when rows is empty.',
    },
  ],
} as const satisfies ComponentMeta
