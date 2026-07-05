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
