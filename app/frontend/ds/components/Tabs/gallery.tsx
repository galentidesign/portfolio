import { useState } from 'react'
import { Tabs, type TabItem } from './Tabs'

export const galleryMeta = { slug: 'tabs', title: 'Tabs' }

const uncontrolledItems: readonly TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: <p>Short overview copy — what this thing is and why it exists.</p>,
  },
  {
    id: 'details',
    label: 'Details',
    content: <p>Denser detail copy: specs, caveats, the fine print.</p>,
  },
  {
    id: 'history',
    label: 'History',
    content: <p>Change history — what shipped and when.</p>,
  },
]

const controlledItems: readonly TabItem[] = [
  { id: 'write', label: 'Write', content: <p>Compose something here.</p> },
  { id: 'preview', label: 'Preview', content: <p>Rendered preview of the draft.</p> },
  { id: 'publish', label: 'Publish', content: <p>Ship it when it is ready.</p> },
]

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
      {children}
    </div>
  )
}

export default function TabsGallery() {
  const [selected, setSelected] = useState('write')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      {/* Uncontrolled — internal state, first item selected by default */}
      <GalleryRow label="uncontrolled (defaults to first item)">
        <Tabs items={uncontrolledItems} label="Uncontrolled demo" />
      </GalleryRow>

      {/* Controlled — parent owns selection; readout mirrors the selected id */}
      <GalleryRow label="controlled (selected + onChange)">
        <Tabs
          items={controlledItems}
          selected={selected}
          onChange={setSelected}
          label="Controlled demo"
        />
        <p
          style={{
            fontFamily: 'var(--type-mono-family)',
            fontSize: 'var(--type-mono-size)',
            color: 'var(--color-ink-muted)',
            margin: 0,
          }}
        >
          selected: {selected}
        </p>
      </GalleryRow>
    </div>
  )
}
