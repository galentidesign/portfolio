import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FormField } from './FormField'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Controlled() {
  const [value, setValue] = useState('')
  return <FormField label="Name" value={value} onChange={(e) => setValue(e.target.value)} />
}

// ---------------------------------------------------------------------------
// Label association
// ---------------------------------------------------------------------------

describe('FormField — label association', () => {
  it('getByLabelText resolves the control via htmlFor/id wiring', () => {
    render(<FormField label="Email" />)
    // aria-hidden * is excluded from accessible name, so 'Email' matches
    const control = screen.getByLabelText('Email')
    expect(control).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// aria-describedby
// ---------------------------------------------------------------------------

describe('FormField — aria-describedby', () => {
  it('references both hint and error ids when both are provided', () => {
    render(<FormField label="Email" hint="Use your work email" error="Invalid address" />)
    const control = screen.getByLabelText('Email')
    const hint = screen.getByText('Use your work email')
    const error = screen.getByText('Invalid address')

    expect(hint.id).not.toBe('')
    expect(error.id).not.toBe('')

    const described = control.getAttribute('aria-describedby') ?? ''
    const ids = described.split(' ')
    expect(ids).toContain(hint.id)
    expect(ids).toContain(error.id)
  })

  it('references only the hint id when no error is provided', () => {
    render(<FormField label="Email" hint="Use your work email" />)
    const control = screen.getByLabelText('Email')
    const hint = screen.getByText('Use your work email')
    expect(control).toHaveAttribute('aria-describedby', hint.id)
  })

  it('references only the error id when no hint is provided', () => {
    render(<FormField label="Email" error="Required" />)
    const control = screen.getByLabelText('Email')
    const error = screen.getByText('Required')
    expect(control).toHaveAttribute('aria-describedby', error.id)
  })

  it('omits aria-describedby when neither hint nor error is provided', () => {
    render(<FormField label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby')
  })
})

// ---------------------------------------------------------------------------
// aria-invalid
// ---------------------------------------------------------------------------

describe('FormField — aria-invalid', () => {
  it('is absent when no error is provided', () => {
    render(<FormField label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid')
  })

  it('is set to "true" when error is provided', () => {
    render(<FormField label="Email" error="Required field" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('toggles correctly when error appears and disappears', () => {
    const { rerender } = render(<FormField label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid')

    rerender(<FormField label="Email" error="Required" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')

    rerender(<FormField label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid')
  })
})

// ---------------------------------------------------------------------------
// Required state
// ---------------------------------------------------------------------------

describe('FormField — required', () => {
  it('renders the native required attribute on the control', () => {
    render(<FormField label="Email" required />)
    // getByRole uses ARIA accessible name computation, which excludes the
    // aria-hidden * span — confirming the accessible name is "Email" not "Email *"
    const control = screen.getByRole('textbox', { name: 'Email' })
    expect(control).toHaveAttribute('required')
  })

  it('renders the aria-hidden asterisk marker when required', () => {
    render(<FormField label="Email" required />)
    // Accessible name via role is "Email" (aria-hidden * excluded)
    screen.getByRole('textbox', { name: 'Email' })
    const marker = screen.getByText('*')
    expect(marker).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not render required attribute or marker when not required', () => {
    render(<FormField label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('required')
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Multiline (textarea vs input)
// ---------------------------------------------------------------------------

describe('FormField — multiline', () => {
  it('renders a textarea when multiline is true', () => {
    render(<FormField label="Bio" multiline />)
    expect(screen.getByLabelText('Bio').tagName).toBe('TEXTAREA')
  })

  it('renders an input when multiline is false (default)', () => {
    render(<FormField label="Name" />)
    expect(screen.getByLabelText('Name').tagName).toBe('INPUT')
  })

  it('passes rows through to the textarea', () => {
    render(<FormField label="Notes" multiline rows={6} />)
    expect(screen.getByLabelText('Notes')).toHaveAttribute('rows', '6')
  })
})

// ---------------------------------------------------------------------------
// Typing (user-event)
// ---------------------------------------------------------------------------

describe('FormField — typing', () => {
  it('accepts text in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<FormField label="Name" />)
    const control = screen.getByLabelText('Name')
    await user.type(control, 'hello')
    expect(control).toHaveValue('hello')
  })

  it('accepts text in controlled mode', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const control = screen.getByLabelText('Name')
    await user.type(control, 'hello')
    expect(control).toHaveValue('hello')
  })
})

// ---------------------------------------------------------------------------
// Id handling
// ---------------------------------------------------------------------------

describe('FormField — id', () => {
  it('uses the custom id when provided', () => {
    render(<FormField label="Email" id="custom-email" />)
    const control = screen.getByLabelText('Email')
    expect(control).toHaveAttribute('id', 'custom-email')
    expect(document.querySelector('label[for="custom-email"]')).not.toBeNull()
  })

  it('generates a stable for/id pair when no id prop is provided', () => {
    render(<FormField label="Email" />)
    const control = screen.getByLabelText('Email')
    const generatedId = control.getAttribute('id')
    expect(generatedId).toBeTruthy()
    // Label for must point at the same id
    expect(document.querySelector(`label[for="${generatedId}"]`)).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// data-* states on root
// ---------------------------------------------------------------------------

describe('FormField — data attributes', () => {
  it('sets data-invalid on the root when error is present', () => {
    render(<FormField label="Email" error="Required" />)
    const root = screen.getByLabelText('Email').closest('[data-invalid]')
    expect(root).not.toBeNull()
  })

  it('does not set data-invalid when no error', () => {
    render(<FormField label="Email" />)
    expect(document.querySelector('[data-invalid]')).not.toBeInTheDocument()
  })

  it('sets data-multiline on the root when multiline', () => {
    render(<FormField label="Bio" multiline />)
    expect(document.querySelector('[data-multiline]')).not.toBeNull()
  })

  it('does not set data-multiline when not multiline', () => {
    render(<FormField label="Name" />)
    expect(document.querySelector('[data-multiline]')).not.toBeInTheDocument()
  })
})
