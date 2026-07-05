'use client'

import { useState } from 'react'
import { Toast } from './Toast'

export const galleryMeta = { slug: 'toast', title: 'Toast / Banner' }

const tones = ['neutral', 'positive', 'caution', 'critical'] as const

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
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function ToastGallery() {
  const [toastOpen, setToastOpen] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      {/* Inline banners: all four tones */}
      {tones.map((tone) => (
        <GalleryRow key={`inline-${tone}`} label={`inline (banner) — tone=${tone}`}>
          <Toast inline tone={tone} title={`${tone.charAt(0).toUpperCase()}${tone.slice(1)}`}>
            This is a static banner message rendered in-flow. It never auto-hides and ignores the
            open prop.
          </Toast>
        </GalleryRow>
      ))}

      {/* Toast with auto-hide demo */}
      <GalleryRow label="toast (fixed) — stateful with auto-hide">
        <button
          onClick={() => setToastOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
            borderRadius: 'var(--radius-control)',
            fontFamily: 'var(--type-body-family)',
            fontSize: 'var(--type-body-size)',
            cursor: 'pointer',
          }}
        >
          Show Toast (4s auto-hide)
        </button>

        {toastOpen && (
          <Toast
            tone="positive"
            title="Success"
            open={toastOpen}
            onDismiss={() => setToastOpen(false)}
            autoHideMs={4000}
          >
            Your action was completed successfully. This toast will auto-dismiss in 4 seconds or
            when you click the × button.
          </Toast>
        )}
      </GalleryRow>
    </div>
  )
}
