import { useState } from 'react'
import { Menu, type MenuItem } from './Menu'

export const galleryMeta = { slug: 'menu', title: 'Select / Menu' }

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
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

function Readout({ value }: { value: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--type-mono-family)',
        fontSize: 'var(--type-mono-size)',
        color: 'var(--color-ink-muted)',
        alignSelf: 'center',
      }}
    >
      last selected: {value}
    </span>
  )
}

function makeItems(onSelect: (label: string) => void): readonly MenuItem[] {
  return [
    { id: 'archive', label: 'Archive', onSelect: () => onSelect('Archive') },
    { id: 'duplicate', label: 'Duplicate', onSelect: () => onSelect('Duplicate') },
    { id: 'delete', label: 'Delete', onSelect: () => onSelect('Delete') },
    {
      id: 'move',
      label: 'Move to project…',
      disabled: true,
      onSelect: () => onSelect('Move to project…'),
    },
    { id: 'export', label: 'Export as PDF', onSelect: () => onSelect('Export as PDF') },
  ]
}

// ── Demo: start-aligned (default) ─────────────────────────────────────────────

function StartAlignedDemo() {
  const [last, setLast] = useState('nothing yet')
  return (
    <>
      <Menu label="Actions" items={makeItems(setLast)} />
      <Readout value={last} />
    </>
  )
}

// ── Demo: end-aligned ─────────────────────────────────────────────────────────

function EndAlignedDemo() {
  const [last, setLast] = useState('nothing yet')
  return (
    <>
      <Menu label="More options" items={makeItems(setLast)} align="end" />
      <Readout value={last} />
    </>
  )
}

// ── Gallery export ────────────────────────────────────────────────────────────

export default function MenuGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      <GalleryRow label="align=start (default) — five actions, one disabled">
        <StartAlignedDemo />
      </GalleryRow>

      <GalleryRow label="align=end — right edges flush with the trigger">
        <EndAlignedDemo />
      </GalleryRow>
    </div>
  )
}
