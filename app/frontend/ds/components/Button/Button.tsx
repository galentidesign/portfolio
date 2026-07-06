import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=25-2
// Component set "Button" — variant→Variant, size→Size; CSS states→State;
// busy→Busy; iconStart→"Icon start" boolean + "Icon" INSTANCE_SWAP. Paints
// bind to the "Tokens" variable collection (modes: galenti, rails-era).

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'type'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  busy?: boolean
  href?: string
  iconStart?: ReactNode
  type?: 'button' | 'submit'
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  busy = false,
  href,
  iconStart,
  type = 'button',
  ref,
  disabled,
  onClick,
  children,
  className,
  ...rest
}: ButtonProps) {
  const rootClass = [styles.button, className].filter(Boolean).join(' ')

  const spinner = busy ? <span className={styles.spinner} aria-hidden="true" /> : null

  if (href !== undefined) {
    // Anchor mode — spread rest as anchor props; disabled → aria-disabled
    const anchorProps = rest as ComponentPropsWithoutRef<'a'>
    const isDisabled = disabled === true

    const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isDisabled || busy) {
        e.preventDefault()
        return
      }
      // onClick was destructured from props (typed for button mode), so it is
      // not part of anchorProps — invoke it here or it would be dropped.
      ;(onClick as unknown as React.MouseEventHandler<HTMLAnchorElement> | undefined)?.(e)
    }

    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={isDisabled ? undefined : href}
        // Dropping href also drops the implicit link role; restore it so a
        // disabled link still announces as one (the ARIA disabled-link idiom).
        role={isDisabled ? 'link' : undefined}
        className={rootClass}
        data-variant={variant}
        data-size={size}
        {...(busy ? { 'data-busy': '' } : {})}
        aria-busy={busy ? 'true' : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={handleAnchorClick}
        {...anchorProps}
      >
        {iconStart !== undefined && (
          <span className={styles['icon-slot']} aria-hidden="true">
            {iconStart}
          </span>
        )}
        {spinner}
        {children}
      </a>
    )
  }

  // Button mode
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      className={rootClass}
      data-variant={variant}
      data-size={size}
      {...(busy ? { 'data-busy': '' } : {})}
      aria-busy={busy ? 'true' : undefined}
      disabled={disabled}
      onClick={handleClick}
      {...rest}
    >
      {iconStart !== undefined && (
        <span className={styles['icon-slot']} aria-hidden="true">
          {iconStart}
        </span>
      )}
      {spinner}
      {children}
    </button>
  )
}
