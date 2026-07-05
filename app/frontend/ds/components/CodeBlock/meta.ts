import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'code-block',
  name: 'Code Block',
  tier: 'gallery',
  description: 'Display code verbatim with optional label and copy button.',
  variants: {},
  props: [
    {
      name: 'code',
      type: 'string',
      description: 'Code to display verbatim in <pre><code>; no highlighting at v1.',
    },
    {
      name: 'label',
      type: 'string',
      description: 'Optional filename/language chip in the header row.',
    },
    {
      name: 'copyable',
      type: 'boolean',
      default: 'true',
      description: 'Show a copy-to-clipboard button; controls header row visibility.',
    },
  ],
} as const satisfies ComponentMeta
