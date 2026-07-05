import { type ReactNode, useState } from 'react'
import { FormField } from './FormField'

export const galleryMeta = { slug: 'form-field', title: 'Form Field' }

// ---------------------------------------------------------------------------
// Gallery layout helpers
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--type-mono-family)',
          fontSize: 'var(--type-mono-size)',
          color: 'var(--color-ink-muted)',
          marginBlock: '0 var(--space-2)',
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export default function FormFieldGallery() {
  const [filled, setFilled] = useState('jane@example.com')
  const [multiText, setMultiText] = useState('')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: '28rem', // gallery structural layout value
        padding: 'var(--density-pad)',
      }}
    >
      <Row label="Default">
        <FormField label="Email" placeholder="you@example.com" />
      </Row>

      <Row label="Filled">
        <FormField label="Email" value={filled} onChange={(e) => setFilled(e.target.value)} />
      </Row>

      <Row label="With hint">
        <FormField label="Username" hint="3–20 characters, letters and numbers only" />
      </Row>

      <Row label="With error">
        <FormField label="Email" defaultValue="not-an-email" error="Enter a valid email address" />
      </Row>

      <Row label="Required">
        <FormField label="Full name" required placeholder="J Galenti" />
      </Row>

      <Row label="Multiline">
        <FormField
          label="Bio"
          multiline
          rows={4}
          value={multiText}
          onChange={(e) => setMultiText(e.target.value)}
          placeholder="Tell us about yourself"
        />
      </Row>

      <Row label="Disabled">
        <FormField label="Email" disabled defaultValue="jane@example.com" />
      </Row>
    </div>
  )
}
