import type { PlaygroundHostProps, PlaygroundValues } from '../playground'
import { Button } from '@/ds/components/Button/Button'
import { Tooltip, type TooltipProps } from './Tooltip'

export const playgroundMeta = { slug: 'tooltip' }

export default function TooltipPlayground({ values }: PlaygroundHostProps) {
  const { content: rawContent, position } = values as {
    content?: string
    position?: TooltipProps['position']
  }

  // content is required in TooltipProps; fall back to demo value when the
  // text control is empty (empty strings are omitted before the host sees
  // them).
  const content = rawContent || 'More info'

  return (
    <Tooltip content={content} position={position}>
      <Button variant="ghost">Focus me</Button>
    </Tooltip>
  )
}

export function snippet(attrs: string, values: PlaygroundValues): string {
  // Reflect the host's content fallback when the control is empty.
  const contentAttr = values.content ? '' : ' content="More info"'
  return `<Tooltip${contentAttr}${attrs}>\n  <button type="button">Focus me</button>\n</Tooltip>`
}
