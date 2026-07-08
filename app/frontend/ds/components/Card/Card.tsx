/**
 * Figma (file FDrHYp9F366R2GZ0Ra9koO, "Card" page) — component "Card":
 * surface-raised, density/pad padding, line border, radius/surface, shadow/raised;
 * title + body + footer (divider + small ink-muted).
 * - flush | interactive hover-lift | proximity-glow | focus states are omitted
 * - shadow via per-skin "shadow/raised" effect styles (effects can't mode-switch)
 * @see https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=96-3
 * Tokens come from the "Tokens" variable collection — skins galenti | rails-era
 * | react-era | agentic (+ night/day zones); flip mode at the frame level.
 */
import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react'
import styles from './styles.module.css'

export interface CardProps {
  title?: string
  href?: string
  flush?: boolean
  footer?: ReactNode
  children: ReactNode
  ref?: Ref<HTMLDivElement | HTMLAnchorElement>
}

export function Card({ title, href, flush = false, footer, children, ref }: CardProps) {
  const isInteractive = href !== undefined
  const isFlush = flush === true

  const baseProps = {
    className: styles.card,
    ref,
    ...(!isFlush ? {} : { 'data-flush': '' }),
    ...(isInteractive ? { 'data-interactive': '' } : {}),
  }

  const content = (
    <>
      {title !== undefined && (
        <div className={styles.title}>
          {/* Styled row, deliberately not a heading — consumers add their own heading semantics in children */}
          {title}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </>
  )

  if (isInteractive) {
    const anchorProps = baseProps as ComponentPropsWithoutRef<'a'>
    return (
      <a {...anchorProps} href={href}>
        {content}
      </a>
    )
  }

  const divProps = baseProps as ComponentPropsWithoutRef<'div'>
  return <div {...divProps}>{content}</div>
}
