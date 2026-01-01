import React from 'react'
import { render, screen } from '@testing-library/react'
import Badge, { getBadgeVariantFromPriority, getBadgeVariantFromStatus } from '../../components/ui/Badge'

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const { container: high } = render(<Badge variant="high">High</Badge>)
    expect(high.firstChild).toHaveClass('bg-red-500/20')
    expect(high.firstChild).toHaveClass('text-red-300')

    const { container: medium } = render(<Badge variant="medium">Medium</Badge>)
    expect(medium.firstChild).toHaveClass('bg-yellow-500/20')
    expect(medium.firstChild).toHaveClass('text-yellow-300')

    const { container: low } = render(<Badge variant="low">Low</Badge>)
    expect(low.firstChild).toHaveClass('bg-green-500/20')
    expect(low.firstChild).toHaveClass('text-green-300')

    const { container: info } = render(<Badge variant="info">Info</Badge>)
    expect(info.firstChild).toHaveClass('bg-blue-500/20')
    expect(info.firstChild).toHaveClass('text-blue-300')
  })

  it('renders with an icon if provided', () => {
    render(
      <Badge icon={<span data-testid="test-icon">icon</span>}>
        With Icon
      </Badge>
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('With Icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Badge</Badge>)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('Badge Utility Functions', () => {
  describe('getBadgeVariantFromPriority', () => {
    it('maps HIGH to high', () => {
      expect(getBadgeVariantFromPriority('HIGH')).toBe('high')
    })
    it('maps MEDIUM to medium', () => {
      expect(getBadgeVariantFromPriority('MEDIUM')).toBe('medium')
    })
    it('maps LOW to low', () => {
      expect(getBadgeVariantFromPriority('LOW')).toBe('low')
    })
  })

  describe('getBadgeVariantFromStatus', () => {
    it('maps COMPLETE to low', () => {
      expect(getBadgeVariantFromStatus('COMPLETE')).toBe('low')
    })
    it('maps INCOMPLETE to info', () => {
      expect(getBadgeVariantFromStatus('INCOMPLETE')).toBe('info')
    })
  })
})
