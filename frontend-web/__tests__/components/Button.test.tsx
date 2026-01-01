import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../../components/ui/Button'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    button: React.forwardRef(({ children, whileHover, whileTap, transition, ...props }: any, ref) => (
      <button ref={ref} {...props}>{children}</button>
    )),
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)

    fireEvent.click(screen.getByText('Click Me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shows loading spinner when loading prop is true', () => {
    render(<Button loading>Loading</Button>)

    // Check if the svg spinner exists
    const spinner = document.querySelector('svg.animate-spin')
    expect(spinner).toBeInTheDocument()

    // Button should be disabled when loading
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-gradient-to-r from-blue-600 to-cyan-500')

    rerender(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-500')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('border border-cyan-400')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3 py-2 text-sm')

    rerender(<Button size="xl">Extra Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-8 py-5 text-xl')
  })

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full Width</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })
})
