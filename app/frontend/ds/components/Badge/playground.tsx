import type { PlaygroundHostProps } from '../playground'
import { Badge, type BadgeProps } from './Badge'

export const playgroundMeta = { slug: 'badge' }

export default function BadgePlayground({ values }: PlaygroundHostProps) {
  return <Badge {...(values as unknown as Partial<BadgeProps>)}>Ready</Badge>
}

export function snippet(attrs: string): string {
  return `<Badge${attrs}>Ready</Badge>`
}
