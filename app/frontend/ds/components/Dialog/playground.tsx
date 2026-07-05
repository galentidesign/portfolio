import { useState } from 'react'
import type { PlaygroundHostProps, PlaygroundValues } from '../playground'
import { Button } from '@/ds/components/Button/Button'
import { Prose } from '@/ds/components/Prose/Prose'
import { Dialog, type DialogProps } from './Dialog'

export const playgroundMeta = { slug: 'dialog' }

export default function DialogPlayground({ values }: PlaygroundHostProps) {
  // open and onClose are host-managed; the manifest marks open playground:false
  // and onClose is a handler type (auto-skipped by the control system).
  // footer and children are ReactNode (auto-skipped). We destructure only the
  // scalar props the playground actually sends.
  const [open, setOpen] = useState(false)

  const {
    title: rawTitle,
    description,
    size,
    dismissible,
  } = values as {
    title?: string
    description?: string
    size?: DialogProps['size']
    dismissible?: boolean
  }

  // title is required in DialogProps; fall back to demo value when the text
  // control is empty (empty strings are omitted before the host sees them).
  const title = rawTitle || 'Confirm action'

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        size={size}
        dismissible={dismissible}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <Prose>
          <p>This is the dialog body. Confirm or cancel using the footer buttons below.</p>
        </Prose>
      </Dialog>
    </>
  )
}

export function snippet(attrs: string, values: PlaygroundValues): string {
  // Reflect the host's title fallback when the control is empty.
  const titleAttr = values.title ? '' : ' title="Confirm action"'
  return [
    'const [open, setOpen] = useState(false)',
    '',
    `<Dialog open={open} onClose={() => setOpen(false)}${titleAttr}${attrs}>`,
    '  …',
    '</Dialog>',
  ].join('\n')
}
