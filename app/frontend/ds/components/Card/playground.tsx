import type { PlaygroundHostProps } from '../playground'
import { Card, type CardProps } from './Card'

export const playgroundMeta = { slug: 'card' }

export default function CardPlayground({ values }: PlaygroundHostProps) {
  return <Card {...(values as unknown as Partial<CardProps>)}>Card content goes here.</Card>
}

export function snippet(attrs: string): string {
  return `<Card${attrs}>Card content goes here.</Card>`
}
