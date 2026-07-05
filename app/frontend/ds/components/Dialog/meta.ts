import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'dialog',
  name: 'Modal / Dialog',
  tier: 'hero',
  description: 'Controlled modal dialog built on native <dialog> with focus trap and motion.',
  variants: {
    size: ['sm', 'md'],
  },
  props: [
    {
      name: 'open',
      type: 'boolean',
      description: 'Fully controlled — owner flips this to show/hide the dialog.',
    },
    {
      name: 'onClose',
      type: '() => void',
      description:
        'Fired when the user dismisses the dialog (Esc, backdrop click, or × button). Owner must set open=false in response.',
    },
    {
      name: 'title',
      type: 'string',
      description: 'Heading text rendered in the header; wired to aria-labelledby.',
    },
    {
      name: 'description',
      type: 'string',
      description: 'Supporting text below the title; wired to aria-describedby when present.',
    },
    {
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Max-width step: sm=26rem, md=34rem.',
    },
    {
      name: 'dismissible',
      type: 'boolean',
      default: 'true',
      description:
        'When false, removes the × button and blocks backdrop click and Esc from closing the dialog.',
    },
    {
      name: 'footer',
      type: 'ReactNode',
      description: 'Action row slot — rendered in a flex-end row at the bottom of the panel.',
    },
    {
      name: 'children',
      type: 'ReactNode',
      description: 'Dialog body content.',
    },
  ],
} as const satisfies ComponentMeta
