import type { PlaygroundHostProps, PlaygroundValues } from '../playground'
import { EmptyState } from './EmptyState'

export const playgroundMeta = { slug: 'empty-state' }

export default function EmptyStatePlayground({ values }: PlaygroundHostProps) {
  const { title: rawTitle, description } = values as {
    title?: string
    description?: string
  }

  // title is required in EmptyStateProps; fall back to demo value when the
  // text control is empty (empty strings are omitted before the host sees it).
  const title = rawTitle || 'No results found'

  return <EmptyState title={title} description={description} />
}

export function snippet(attrs: string, values: PlaygroundValues): string {
  // Reflect the host's title fallback when the control is empty.
  const titleAttr = values.title ? '' : ' title="No results found"'
  return `<EmptyState${titleAttr}${attrs} />`
}
