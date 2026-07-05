import { useState } from 'react'
import { Dialog } from './Dialog'

export const galleryMeta = { slug: 'dialog', title: 'Modal / Dialog' }

// Local trigger button — not importing Button (parallel build contract).
function TriggerButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 'var(--density-control)',
        paddingInline: 'var(--space-4)',
        borderRadius: 'var(--radius-control)',
        background: 'var(--color-accent)',
        color: 'var(--color-accent-ink)',
        border: 'none',
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

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

// ── Demo: standard md dialog ──────────────────────────────────────────────────

function MdDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)}>Open md dialog</TriggerButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Publish changes?"
        description="Your changes will go live immediately. This action cannot be undone from this panel."
        size="md"
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <TriggerButton onClick={() => setOpen(false)}>Publish</TriggerButton>
          </>
        }
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--type-body-family)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-ink)',
          }}
        >
          Confirm you want to publish the draft. Once published, visitors will see the updated
          content within a few seconds.
        </p>
      </Dialog>
    </>
  )
}

// ── Demo: sm dialog ───────────────────────────────────────────────────────────

function SmDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)}>Open sm dialog</TriggerButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete entry"
        description="This entry will be permanently removed."
        size="sm"
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <TriggerButton onClick={() => setOpen(false)}>Delete</TriggerButton>
          </>
        }
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--type-body-family)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-ink)',
          }}
        >
          Are you sure? This cannot be undone.
        </p>
      </Dialog>
    </>
  )
}

// ── Demo: non-dismissible dialog ──────────────────────────────────────────────

function NonDismissibleDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)}>Open non-dismissible dialog</TriggerButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Required action"
        description="You must complete this step before continuing. Esc and backdrop click are disabled."
        dismissible={false}
        footer={
          <TriggerButton onClick={() => setOpen(false)}>I understand, continue</TriggerButton>
        }
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--type-body-family)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-ink)',
          }}
        >
          This dialog cannot be dismissed with Esc or a backdrop click. Use the button below to
          proceed.
        </p>
      </Dialog>
    </>
  )
}

// ── Demo: no description, no footer ──────────────────────────────────────────

function MinimalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)}>Open minimal dialog</TriggerButton>
      <Dialog open={open} onClose={() => setOpen(false)} title="Notice">
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--type-body-family)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-ink)',
          }}
        >
          No description or footer. Just a title, body, and the × close button.
        </p>
      </Dialog>
    </>
  )
}

// ── Gallery export ────────────────────────────────────────────────────────────

export default function DialogGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      <GalleryRow label="size=md (default) — dismissible, with description + footer">
        <MdDemo />
      </GalleryRow>

      <GalleryRow label="size=sm — dismissible, with description + footer">
        <SmDemo />
      </GalleryRow>

      <GalleryRow label="dismissible=false — no ×, Esc blocked, backdrop blocked">
        <NonDismissibleDemo />
      </GalleryRow>

      <GalleryRow label="minimal — title + body only (no description, no footer)">
        <MinimalDemo />
      </GalleryRow>
    </div>
  )
}
