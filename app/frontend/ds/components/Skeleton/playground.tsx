import type { PlaygroundHostProps } from '../playground'
import { Skeleton, type SkeletonProps } from './Skeleton'

export const playgroundMeta = { slug: 'skeleton' }

export default function SkeletonPlayground({ values }: PlaygroundHostProps) {
  return <Skeleton {...(values as unknown as Partial<SkeletonProps>)} />
}

export function snippet(attrs: string): string {
  return `<Skeleton${attrs} />`
}
