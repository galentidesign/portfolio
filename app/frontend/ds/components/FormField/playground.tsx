import type { PlaygroundHostProps, PlaygroundValues } from '../playground'
import { FormField, type FormFieldProps } from './FormField'

export const playgroundMeta = { slug: 'form-field' }

export default function FormFieldPlayground({ values }: PlaygroundHostProps) {
  // label is required in FormFieldProps; fall back to a demo value when the
  // text control is empty (empty strings are omitted before the host sees them).
  const { label: rawLabel, ...rest } = values
  const label = typeof rawLabel === 'string' && rawLabel ? rawLabel : 'Email address'

  return (
    <FormField
      label={label}
      placeholder="you@example.com"
      {...(rest as unknown as Partial<FormFieldProps>)}
    />
  )
}

export function snippet(attrs: string, values: PlaygroundValues): string {
  // When the label control is empty the host supplies the fallback — reflect that here.
  const labelAttr = values.label ? '' : ' label="Email address"'
  return `<FormField${labelAttr}${attrs} />`
}
