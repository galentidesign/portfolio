import { useId, type ComponentPropsWithoutRef, type Ref } from 'react'
import styles from './styles.module.css'

// Merge all native input + textarea props (minus id and children which this
// component owns). Using the intersection lets callers pass type, rows,
// maxLength, autocomplete, etc. without ceremony. Two-branch `unknown` casts
// below handle the TS narrowing — the public surface is what matters.
type NativeProps = Omit<
  ComponentPropsWithoutRef<'input'> & ComponentPropsWithoutRef<'textarea'>,
  'id' | 'children'
>

export interface FormFieldProps extends NativeProps {
  /** Always-visible label — never use a placeholder as a label substitute. */
  label: string
  /** Helper text rendered below the control; linked via aria-describedby. */
  hint?: string
  /** Validation error; its presence sets the invalid state. */
  error?: string
  /** Adds the native required attr and a decorative asterisk marker. */
  required?: boolean
  /** Renders a <textarea> instead of an <input>; the rows prop passes through. */
  multiline?: boolean
  /**
   * Explicit field id for the control; falls back to a React useId-generated
   * value that is stable across renders for a given component instance.
   */
  id?: string
  ref?: Ref<HTMLInputElement | HTMLTextAreaElement>
}

export function FormField({
  label,
  hint,
  error,
  required,
  multiline = false,
  id: idProp,
  ref,
  ...rest
}: FormFieldProps) {
  const generated = useId()
  const id = idProp ?? generated
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div
      className={styles.field}
      data-invalid={error ? '' : undefined}
      data-multiline={multiline ? '' : undefined}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
        {/* Asterisk is aria-hidden — native required attr carries the semantics. */}
        {required && (
          <span aria-hidden="true" className={styles['required-marker']}>
            *
          </span>
        )}
      </label>

      {multiline ? (
        // Two-branch cast: rest is the input+textarea prop intersection;
        // `unknown` mediates the narrowing since TypeScript can't prove it
        // directly. Textarea-specific attrs (e.g. rows) pass through here;
        // input-specific attrs in the input branch mirror the same pattern.
        <textarea
          {...(rest as unknown as ComponentPropsWithoutRef<'textarea'>)}
          className={styles.control}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          ref={ref as unknown as Ref<HTMLTextAreaElement>}
        />
      ) : (
        <input
          {...(rest as unknown as ComponentPropsWithoutRef<'input'>)}
          className={styles.control}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          ref={ref as unknown as Ref<HTMLInputElement>}
        />
      )}

      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {/* No live region — announcing errors on submit is a form-level
              concern (e.g. a live-region summary or focus management). */}
          {error}
        </p>
      )}
    </div>
  )
}
