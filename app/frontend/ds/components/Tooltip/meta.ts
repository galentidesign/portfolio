import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'tooltip',
  name: 'Tooltip',
  tier: 'gallery',
  description: 'Plain-text hint shown on hover or focus, anchored to a single trigger.',
  variants: {
    position: ['top', 'bottom'],
  },
  props: [
    {
      name: 'content',
      type: 'string',
      description:
        'Plain text only — tooltips must never hold interactive content (the tip is transient, unfocusable, and pointer-events: none).',
    },
    {
      name: 'position',
      type: "'top' | 'bottom'",
      default: "'top'",
      description:
        'Preferred side. Measured at show time; flips to the other side when the viewport would clip it.',
    },
    {
      name: 'children',
      type: "ReactElement<{ 'aria-describedby'?: string }>",
      description:
        'Exactly one focusable trigger element. Receives aria-describedby (joined with any existing value) while the tooltip is visible.',
    },
  ],
} as const satisfies ComponentMeta
