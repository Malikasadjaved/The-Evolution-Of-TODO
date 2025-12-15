import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Input label="Email Address" />)
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    render(<Input label="Email" error="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('displays helper text when provided', () => {
    render(<Input label="Password" helperText="Min 8 characters" />)
    expect(screen.getByText('Min 8 characters')).toBeInTheDocument()
  })

  it('calls onChange handler', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders with left addon', () => {
    render(<Input leftAddon={<span>$</span>} />)
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('renders with right addon', () => {
    render(<Input rightAddon={<span>@example.com</span>} />)
    expect(screen.getByText('@example.com')).toBeInTheDocument()
  })

  it('applies error styling when error exists', () => {
    render(<Input error="Invalid input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
