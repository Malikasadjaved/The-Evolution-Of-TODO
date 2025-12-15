import { render, screen, fireEvent } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders badge with children text', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toHaveClass('bg-gray-100')
  })

  it('applies success variant styles', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('applies warning variant styles', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('applies error variant styles', () => {
    render(<Badge variant="error">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('applies info variant styles', () => {
    render(<Badge variant="info">Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('applies small size styles', () => {
    render(<Badge size="sm">Small</Badge>)
    const badge = screen.getByText('Small')
    expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5')
  })

  it('applies medium size styles', () => {
    render(<Badge size="md">Medium</Badge>)
    const badge = screen.getByText('Medium')
    expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-0.5')
  })

  it('renders remove button when removable is true', () => {
    render(<Badge removable>Removable</Badge>)
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = jest.fn()
    render(<Badge removable onRemove={handleRemove}>Removable</Badge>)
    const removeButton = screen.getByRole('button', { name: /remove/i })
    fireEvent.click(removeButton)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('does not render remove button when removable is false', () => {
    render(<Badge removable={false}>Not Removable</Badge>)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })
})
