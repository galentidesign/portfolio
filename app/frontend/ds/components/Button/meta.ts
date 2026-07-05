import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'button',
  name: 'Button',
  tier: 'hero',
  description: 'Actions at three emphasis levels.',
  variants: {
    variant: ['primary', 'secondary', 'ghost'],
    size: ['sm', 'md'],
  },
  props: [
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'ghost'",
      default: "'primary'",
      description: 'Emphasis level.',
    },
    {
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Control size — md matches --density-control, sm matches --density-control-sm.',
    },
    {
      name: 'busy',
      type: 'boolean',
      default: 'false',
      description:
        'Shows an inline spinner, suppresses onClick activation, and sets aria-busy. Does not disable the button so focus is not lost mid-submit.',
    },
    {
      name: 'href',
      type: 'string',
      description:
        'When provided, renders an <a> element with identical styling. Combine with disabled to get aria-disabled + tabIndex=-1 + click-prevented anchor.',
    },
    {
      name: 'iconStart',
      type: 'ReactNode',
      description: 'Decorative icon slot rendered before children; wrapped in aria-hidden.',
    },
    {
      name: 'type',
      type: "'button' | 'submit'",
      default: "'button'",
      description: 'Native button type. Ignored in href/anchor mode.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      description:
        'Disables the button (native disabled in button mode; aria-disabled + tabIndex=-1 in anchor mode).',
    },
    {
      name: 'onClick',
      type: 'React.MouseEventHandler',
      description: 'Click handler. Suppressed when busy=true.',
    },
    {
      name: 'ref',
      type: 'Ref<HTMLButtonElement | HTMLAnchorElement>',
      description: 'Forwarded to the root element.',
    },
  ],
} as const satisfies ComponentMeta
