import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Input from '../../components/ui/Input'

describe('Input Component', () => {
  it('renders correctly with placeholder', () => {
    render(<Input placeholder="Enter something" />)
    expect(screen.getByPlaceholderText('Enter something')).toBeInTheDocument()
  })

  it('displays label when provided', () => {
    render(<Input label="Username" placeholder="Enter username" />)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('handles change events', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here')
    fireEvent.change(input, { target: { value: 'hello' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('displays error message and applies error styles', () => {
    render(<Input error="Invalid input" placeholder="Field" />)

    expect(screen.getByText('Invalid input')).toBeInTheDocument()
    const input = screen.getByPlaceholderText('Field')
    expect(input).toHaveClass('border-red-400')
  })

  it('displays helper text', () => {
    render(<Input helperText="Hint: keep it short" placeholder="Field" />)
    expect(screen.getByText('Hint: keep it short')).toBeInTheDocument()
  })

  it('renders prefix and suffix icons', () => {
    render(
      <Input
        placeholder="Search"
        prefixIcon={<span data-testid="prefix">🔍</span>}
        suffixIcon={<span data-testid="suffix">✖️</span>}
      />
    )

    expect(screen.getByTestId('prefix')).toBeInTheDocument()
    expect(screen.getByTestId('suffix')).toBeInTheDocument()
    const input = screen.getByPlaceholderText('Search')
    expect(input).toHaveClass('pl-10')
    expect(input).toHaveClass('pr-10')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled field" />)
    expect(screen.getByPlaceholderText('Disabled field')).toBeDisabled()
  })

  it('applies fullWidth class to container', () => {
    const { container } = render(<Input fullWidth placeholder="Wide" />)
    expect(container.firstChild).toHaveClass('w-full')
  })
})
