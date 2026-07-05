import { Tooltip } from './Tooltip'

export const galleryMeta = { slug: 'tooltip', title: 'Tooltip' }

// Local trigger button — not importing Button (parallel build contract).
function DemoButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 'var(--density-control)',
        paddingInline: 'var(--space-4)',
        borderRadius: 'var(--radius-control)',
        background: 'transparent',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-line-strong)',
        fontFamily: 'var(--type-body-family)',
        fontSize: 'var(--type-body-size)',
        fontWeight: 'var(--type-body-weight)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

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
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}
      >
        {children}
      </div>
    </div>
  )
}

export default function TooltipGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      <GalleryRow label="position=top (default)">
        <Tooltip content="Saves the current draft">
          <DemoButton>Save</DemoButton>
        </Tooltip>
        <Tooltip content="Copies a shareable link to your clipboard">
          <DemoButton>Copy link</DemoButton>
        </Tooltip>
      </GalleryRow>

      <GalleryRow label="position=bottom">
        <Tooltip content="Downloads a PDF copy" position="bottom">
          <DemoButton>Download</DemoButton>
        </Tooltip>
        <Tooltip
          content="Long content wraps at a readable measure — this one keeps going well past the max-width so the 36ch cap is visible in the gallery"
          position="bottom"
        >
          <DemoButton>Long content</DemoButton>
        </Tooltip>
      </GalleryRow>

      <GalleryRow label="on a text link">
        <span
          style={{
            fontFamily: 'var(--type-body-family)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-ink)',
          }}
        >
          Read the{' '}
          <Tooltip content="Opens the component contract in this tab">
            <a
              href="https://example.com"
              style={{ color: 'var(--color-accent)', textDecorationLine: 'underline' }}
            >
              component contract
            </a>
          </Tooltip>{' '}
          before building.
        </span>
      </GalleryRow>
    </div>
  )
}
