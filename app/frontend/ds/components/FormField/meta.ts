import type { ComponentMeta } from '../componentMeta'

// FormField has no visual variant axes — boolean states (data-invalid,
// data-multiline) are rendered states, not enumerable axes. variants is {}
// (empty object) per the spec; the M3 drift check expects this exact shape.
export const meta = {
  slug: 'form-field',
  name: 'Form Field',
  tier: 'hero',
  description: 'Labeled input or textarea with hint, error, and required states.',
  variants: {},
  props: [
    {
      name: 'label',
      type: 'string',
      description: 'Always-visible label — never use a placeholder as a label substitute.',
    },
    {
      name: 'hint',
      type: 'string',
      description: 'Helper text below the control; linked via aria-describedby.',
    },
    {
      name: 'error',
      type: 'string',
      description: 'Validation error text; its presence sets the invalid state.',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Adds native required attr and a decorative aria-hidden asterisk marker.',
    },
    {
      name: 'multiline',
      type: 'boolean',
      default: 'false',
      description: 'Renders a <textarea> instead of an <input>; the rows prop passes through.',
    },
    {
      name: 'id',
      type: 'string',
      description: 'Explicit field id; falls back to a stable React useId-generated value.',
    },
    {
      name: 'ref',
      type: 'Ref<HTMLInputElement | HTMLTextAreaElement>',
      description: 'Forwarded ref to the underlying control element.',
    },
  ],
} as const satisfies ComponentMeta
