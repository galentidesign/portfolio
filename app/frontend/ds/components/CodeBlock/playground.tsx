import type { PlaygroundHostProps } from '../playground'
import { CodeBlock, type CodeBlockProps } from './CodeBlock'

export const playgroundMeta = { slug: 'code-block' }

// code is host-fixed (manifest opts it out of generated controls); label and
// copyable are driven by the playground.
const demo = 'function greet(name: string) {\n  return `Hi, ${name}`\n}'

export default function CodeBlockPlayground({ values }: PlaygroundHostProps) {
  return <CodeBlock code={demo} {...(values as unknown as Partial<CodeBlockProps>)} />
}

export function snippet(attrs: string): string {
  return `<CodeBlock code={demo}${attrs} />`
}
