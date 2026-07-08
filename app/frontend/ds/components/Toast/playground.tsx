import { useState } from 'react'
import type { PlaygroundHostProps, PlaygroundValues } from '../playground'
import { Button } from '@/ds/components/Button/Button'
import { Toast, type ToastProps } from './Toast'

export const playgroundMeta = { slug: 'toast' }

export default function ToastPlayground({ values }: PlaygroundHostProps) {
  // open is host-managed; the manifest marks it playground:false. onDismiss
  // is a handler type and autoHideMs is a number — both auto-skipped by the
  // control system. We destructure only the scalar props the playground
  // actually sends.
  const [open, setOpen] = useState(false)

  const {
    tone,
    inline,
    title: rawTitle,
  } = values as {
    tone?: ToastProps['tone']
    inline?: boolean
    title?: string
  }

  // title is optional but the playground always shows a heading; fall back
  // to demo value when the text control is empty (empty strings are omitted
  // before the host sees them).
  const title = rawTitle || 'Saved'

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Show toast
      </Button>
      <Toast tone={tone} inline={inline} open={open} title={title} onDismiss={() => setOpen(false)}>
        Your changes have been saved.
      </Toast>
    </>
  )
}

export function snippet(attrs: string, values: PlaygroundValues): string {
  // Reflect the host's title fallback when the control is empty.
  const titleAttr = values.title ? '' : ' title="Saved"'
  return [
    'const [open, setOpen] = useState(false)',
    '',
    `<Toast open={open} onDismiss={() => setOpen(false)}${titleAttr}${attrs}>`,
    '  Your changes have been saved.',
    '</Toast>',
  ].join('\n')
}
