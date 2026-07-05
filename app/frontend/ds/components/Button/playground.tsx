import type { PlaygroundHostProps } from '../playground'
import { Button, type ButtonProps } from './Button'

export const playgroundMeta = { slug: 'button' }

export default function ButtonPlayground({ values }: PlaygroundHostProps) {
  return <Button {...(values as unknown as Partial<ButtonProps>)}>Save changes</Button>
}

export function snippet(attrs: string): string {
  return `<Button${attrs}>Save changes</Button>`
}
