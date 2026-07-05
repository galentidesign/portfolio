import { CodeBlock } from './CodeBlock'

export const galleryMeta = { slug: 'code-block', title: 'Code Block' }

const tokenSnippet = `{
  "color": {
    "accent": "#0066cc",
    "ink": "#1a1a1a"
  }
}`

function GalleryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span
        style={{
          fontFamily: 'var(--type-mono-family)',
          fontSize: 'var(--type-mono-size)',
          color: 'var(--color-ink-muted)',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {children}
      </div>
    </div>
  )
}

export default function CodeBlockGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      <GalleryRow label="with label">
        <CodeBlock code={tokenSnippet} label="tokens.json" />
      </GalleryRow>

      <GalleryRow label="without label">
        <CodeBlock code={tokenSnippet} />
      </GalleryRow>

      <GalleryRow label="copyable=false">
        <CodeBlock code={tokenSnippet} copyable={false} />
      </GalleryRow>
    </div>
  )
}
