import { Badge } from './Badge'

export const galleryMeta = { slug: 'badge', title: 'Badge / Tag' }

const tones = ['neutral', 'accent', 'positive', 'caution', 'critical'] as const

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

export default function BadgeGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      {/* One row per tone at md */}
      {tones.map((tone) => (
        <GalleryRow key={`${tone}-md`} label={`tone=${tone} size=md`}>
          <Badge tone={tone} size="md">
            {tone}
          </Badge>
        </GalleryRow>
      ))}

      {/* One row of all tones at sm */}
      <GalleryRow label="all tones size=sm">
        {tones.map((tone) => (
          <Badge key={`${tone}-sm`} tone={tone} size="sm">
            {tone}
          </Badge>
        ))}
      </GalleryRow>
    </div>
  )
}
