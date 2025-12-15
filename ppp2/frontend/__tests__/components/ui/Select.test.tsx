import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '@/components/ui/Select'

describe('Select', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  it('renders select element with options', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Select label="Choose option" options={options} />)
    expect(screen.getByLabelText('Choose option')).toBeInTheDocument()
  })

  it('displays placeholder when provided', () => {
    render(<Select placeholder="Select an option" options={options} />)
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    render(<Select label="Status" options={options} error="Status is required" />)
    expect(screen.getByText('Status is required')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('calls onChange handler when selection changes', () => {
    const handleChange = jest.fn()
    render(<Select options={options} onChange={handleChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'option2' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Select options={options} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('applies error styling when error exists', () => {
    render(<Select options={options} error="Invalid selection" />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('border-red-500')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSelectElement>()
    render(<Select ref={ref} options={options} />)
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })
})
