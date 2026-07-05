import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'toast',
  name: 'Toast / Banner',
  tier: 'gallery',
  description: 'Transient notifications (toast) and static in-flow banners.',
  variants: {
    tone: ['neutral', 'positive', 'caution', 'critical'],
    /* inline is a mode, not a variant axis — it changes behavior (always render,
       no fixed positioning, no auto-hide) but renders as data-inline attribute */
  },
  props: [
    {
      name: 'tone',
      type: "'neutral' | 'positive' | 'caution' | 'critical'",
      default: "'neutral'",
      description: 'Color/semantic intent. Uses WCAG-verified color pairs from the token contract.',
    },
    {
      name: 'inline',
      type: 'boolean',
      default: 'false',
      description:
        'Banner mode: static in-flow element, always renders, ignores open prop, no auto-hide, no fixed positioning.',
    },
    {
      name: 'open',
      type: 'boolean',
      default: 'true',
      description:
        'Toast mode only: controls visibility. Renders nothing when false (unmounts). Inline mode ignores this.',
    },
    {
      name: 'title',
      type: 'string',
      description:
        'Optional heading; uses --type-body-* + --type-title-weight. Omit when not needed.',
    },
    {
      name: 'onDismiss',
      type: '() => void',
      description:
        'Callback fired by the × button click or auto-hide timer. Renders a × button when provided.',
    },
    {
      name: 'autoHideMs',
      type: 'number',
      description:
        'Toast mode only: milliseconds before auto-calling onDismiss. Pauses on hover/focus, resumes with full duration on leave.',
    },
    {
      name: 'children',
      type: 'ReactNode',
      description:
        'Body content. Uses --type-small-* when title is present, else --type-body-*. Inline mode is always body-size.',
    },
  ],
} as const satisfies ComponentMeta
