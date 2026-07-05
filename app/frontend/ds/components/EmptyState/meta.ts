import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'empty-state',
  name: 'Empty State',
  tier: 'gallery',
  description:
    'Centered content slot for empty states with optional icon, title, description, and action.',
  variants: {/* no visual axes — empty state is context-driven, not a variant matrix */},
  props: [
    {
      name: 'title',
      type: 'string',
      description:
        'Title text, rendered with title-role type as the titleAs element (default <p>, not a heading).',
    },
    {
      name: 'titleAs',
      type: 'ElementType',
      default: "'p'",
      description:
        'Element rendered for the title. Pass a heading tag (e.g. h1) when the empty state ' +
        'is the page content — a 404 page still needs a real page heading.',
    },
    {
      name: 'description',
      type: 'string',
      description: 'Optional descriptive text with limited width for readability.',
    },
    {
      name: 'icon',
      type: 'ReactNode',
      description: 'Decorative icon/glyph slot, wrapped aria-hidden.',
    },
    {
      name: 'action',
      type: 'ReactNode',
      description: 'Slot for a button or link the consumer provides.',
    },
  ],
} as const satisfies ComponentMeta
