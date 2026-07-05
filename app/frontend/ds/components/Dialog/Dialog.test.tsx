import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

// ─── jsdom polyfill ──────────────────────────────────────────────────────────
// jsdom 29.1.1 does not implement showModal/close on HTMLDialogElement.
// This minimal polyfill lives only here — never in the component itself.
// It sets/removes the `open` attribute to mirror what the real browser does,
// enabling the component's `dialog.open` guards and effect branches to work.
beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    }
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderDialog(props: Partial<React.ComponentProps<typeof Dialog>> = {}) {
  const defaults = {
    open: true,
    onClose: vi.fn(),
    title: 'Test dialog',
    children: <p>Body content</p>,
  }
  return render(<Dialog {...defaults} {...props} />)
}

// ─── open=false: dialog not open ─────────────────────────────────────────────

describe('Dialog closed state', () => {
  it('does not call showModal when open=false', () => {
    const spy = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    renderDialog({ open: false })
    expect(spy).not.toHaveBeenCalled()
  })

  it('dialog element does not have open attribute when open=false', () => {
    renderDialog({ open: false })
    const dialog = document.querySelector('dialog')!
    expect(dialog).not.toHaveAttribute('open')
  })
})

// ─── open=true: calls showModal ───────────────────────────────────────────────

describe('Dialog open state', () => {
  it('calls showModal when open=true', () => {
    const spy = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    renderDialog({ open: true })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('dialog element has open attribute when open=true', () => {
    renderDialog({ open: true })
    const dialog = document.querySelector('dialog')!
    expect(dialog).toHaveAttribute('open')
  })
})

// ─── data-size attribute ──────────────────────────────────────────────────────

describe('Dialog data-size', () => {
  it('defaults to data-size="md"', () => {
    renderDialog()
    expect(document.querySelector('dialog')).toHaveAttribute('data-size', 'md')
  })

  it('applies data-size="sm"', () => {
    renderDialog({ size: 'sm' })
    expect(document.querySelector('dialog')).toHaveAttribute('data-size', 'sm')
  })
})

// ─── Esc / cancel event ───────────────────────────────────────────────────────

describe('Dialog Esc (cancel event)', () => {
  it('always calls preventDefault on cancel', () => {
    renderDialog({ dismissible: true })
    const dialog = document.querySelector('dialog')!
    const cancelEvent = new Event('cancel', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(cancelEvent, 'preventDefault')
    fireEvent(dialog, cancelEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('calls onClose when dismissible=true and Esc fires', () => {
    const onClose = vi.fn()
    renderDialog({ onClose, dismissible: true })
    const dialog = document.querySelector('dialog')!
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when dismissible=false and Esc fires', () => {
    const onClose = vi.fn()
    renderDialog({ onClose, dismissible: false })
    const dialog = document.querySelector('dialog')!
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('dialog does not close itself — open stays controlled (dialog.open unchanged by cancel)', () => {
    const onClose = vi.fn()
    renderDialog({ open: true, onClose, dismissible: true })
    const dialog = document.querySelector('dialog')!
    const cancelEvent = new Event('cancel', { cancelable: true })
    fireEvent(dialog, cancelEvent)
    // Component must not remove the open attribute; only the owner does that.
    // The polyfill's close() removes it, but the component should not call close() on cancel.
    expect(dialog).toHaveAttribute('open')
  })
})

// ─── × button calls onClose ───────────────────────────────────────────────────

describe('Dialog close button', () => {
  it('× button calls onClose when clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderDialog({ onClose, dismissible: true })
    const closeBtn = screen.getByRole('button', { name: 'Close' })
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('× button is not rendered when dismissible=false', () => {
    renderDialog({ dismissible: false })
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })
})

// ─── Backdrop click ───────────────────────────────────────────────────────────

describe('Dialog backdrop click', () => {
  it('calls onClose when the press starts and ends on the backdrop (dismissible=true)', () => {
    const onClose = vi.fn()
    renderDialog({ onClose, dismissible: true })
    const dialog = document.querySelector('dialog')!
    // Full gesture on the backdrop: pointerdown + click, target === dialog
    fireEvent.pointerDown(dialog, { target: dialog })
    fireEvent.click(dialog, { target: dialog })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when backdrop is clicked and dismissible=false', () => {
    const onClose = vi.fn()
    renderDialog({ onClose, dismissible: false })
    const dialog = document.querySelector('dialog')!
    fireEvent.pointerDown(dialog, { target: dialog })
    fireEvent.click(dialog, { target: dialog })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not call onClose when click target is inside the panel (not backdrop)', () => {
    const onClose = vi.fn()
    renderDialog({ onClose, dismissible: true })
    const dialog = document.querySelector('dialog')!
    const panel = dialog.querySelector('div')!
    // Gesture entirely on the inner panel div — should not dismiss
    fireEvent.pointerDown(dialog, { target: panel })
    fireEvent.click(dialog, { target: panel })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not dismiss on a drag that starts in the panel and releases on the backdrop', () => {
    const onClose = vi.fn()
    renderDialog({ onClose, dismissible: true })
    const dialog = document.querySelector('dialog')!
    const panel = dialog.querySelector('div')!
    // Text-selection drag: press begins on content, click lands on backdrop
    fireEvent.pointerDown(dialog, { target: panel })
    fireEvent.click(dialog, { target: dialog })
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ─── ARIA wiring ──────────────────────────────────────────────────────────────

describe('Dialog ARIA', () => {
  it('dialog has aria-labelledby pointing to the title heading', () => {
    renderDialog({ title: 'My title' })
    const dialog = document.querySelector('dialog')!
    const labelledById = dialog.getAttribute('aria-labelledby')!
    expect(labelledById).toBeTruthy()
    const heading = document.getElementById(labelledById)!
    expect(heading).toHaveTextContent('My title')
  })

  it('dialog has aria-describedby pointing to description when present', () => {
    renderDialog({ description: 'Helpful context' })
    const dialog = document.querySelector('dialog')!
    const describedById = dialog.getAttribute('aria-describedby')!
    expect(describedById).toBeTruthy()
    const desc = document.getElementById(describedById)!
    expect(desc).toHaveTextContent('Helpful context')
  })

  it('dialog has no aria-describedby when description is absent', () => {
    renderDialog({ description: undefined })
    const dialog = document.querySelector('dialog')!
    expect(dialog).not.toHaveAttribute('aria-describedby')
  })
})

// ─── Title heading ────────────────────────────────────────────────────────────

describe('Dialog title heading', () => {
  it('renders the title as a heading element', () => {
    renderDialog({ title: 'Confirm action' })
    const heading = screen.getByRole('heading', { name: 'Confirm action' })
    expect(heading).toBeInTheDocument()
  })
})

// ─── Footer ───────────────────────────────────────────────────────────────────

describe('Dialog footer', () => {
  it('renders footer slot content when provided', () => {
    renderDialog({ footer: <button type="button">Confirm</button> })
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('does not render footer container when footer is not provided', () => {
    const { container } = renderDialog({ footer: undefined })
    // The footer div should not be in the DOM when no footer prop is given
    const dialog = container.querySelector('dialog')!
    // Find panel, then check for footer class (it's the last child only when footer exists)
    // We check there's no element after the body div when footer is absent
    const panel = dialog.querySelector('[class]')!
    const children = Array.from(panel.children)
    // Without footer the panel should have header + maybe description + body = 2 or 3 children
    expect(children.length).toBeLessThanOrEqual(3)
  })
})

// ─── Footer renders with description ─────────────────────────────────────────

describe('Dialog full rendition', () => {
  it('renders title, description, body, and footer together', () => {
    renderDialog({
      title: 'Full dialog',
      description: 'Desc text',
      footer: <button type="button">OK</button>,
      children: <span>Body text</span>,
    })
    expect(screen.getByRole('heading', { name: 'Full dialog' })).toBeInTheDocument()
    expect(screen.getByText('Desc text')).toBeInTheDocument()
    expect(screen.getByText('Body text')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
  })
})

// ─── Controlled: open prop drives dialog.open ────────────────────────────────

describe('Dialog controlled contract', () => {
  it('calls close() when open transitions from true to false', () => {
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close')
    const { rerender } = renderDialog({ open: true })
    rerender(
      <Dialog open={false} onClose={vi.fn()} title="Test">
        <p>body</p>
      </Dialog>,
    )
    expect(closeSpy).toHaveBeenCalled()
    expect(document.querySelector('dialog')).not.toHaveAttribute('open')
  })

  it('calls showModal() again when open transitions from false to true', () => {
    const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const { rerender } = renderDialog({ open: false })
    rerender(
      <Dialog open={true} onClose={vi.fn()} title="Test">
        <p>body</p>
      </Dialog>,
    )
    expect(showModalSpy).toHaveBeenCalled()
    expect(document.querySelector('dialog')).toHaveAttribute('open')
  })
})

// ─── Accessible dialog role ───────────────────────────────────────────────────

describe('Dialog role', () => {
  it('exposes a dialog role', () => {
    renderDialog({ open: true })
    // The <dialog> element with aria-labelledby exposes the dialog role
    const dialogs = screen.getAllByRole('dialog')
    expect(dialogs.length).toBeGreaterThanOrEqual(1)
  })

  it('is labelled by the title text via aria-labelledby', () => {
    renderDialog({ open: true, title: 'Delete item' })
    const dialog = screen.getByRole('dialog', { name: 'Delete item' })
    expect(dialog).toBeInTheDocument()
  })
})

// ─── close event sync ────────────────────────────────────────────────────────

describe('Dialog close event', () => {
  it('calls onClose when a close event fires while open is still true', () => {
    const onClose = vi.fn()
    renderDialog({ open: true, onClose })
    const dialog = document.querySelector('dialog')!
    // Simulate a close event (e.g. from form method="dialog")
    fireEvent(dialog, new Event('close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when a close event fires while open is false', () => {
    const onClose = vi.fn()
    renderDialog({ open: false, onClose })
    const dialog = document.querySelector('dialog')!
    fireEvent(dialog, new Event('close'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ─── within dialog query helper ──────────────────────────────────────────────

describe('Dialog within queries', () => {
  it('renders children inside the dialog', () => {
    renderDialog({ children: <p>Inner text</p> })
    const dialog = document.querySelector('dialog')!
    expect(within(dialog).getByText('Inner text')).toBeInTheDocument()
  })
})
