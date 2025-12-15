/**
 * Tests for ConfirmDialog component
 *
 * Tests cover:
 * - Rendering based on isOpen prop
 * - Title and message display
 * - Custom button text
 * - Callback invocations
 * - Variant styling
 * - Loading state
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const mockCallbacks = {
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
}

describe('ConfirmDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Task?"
          message="This action cannot be undone."
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('Delete Task?')).toBeInTheDocument()
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(
        <ConfirmDialog
          isOpen={false}
          title="Delete Task?"
          message="This action cannot be undone."
          {...mockCallbacks}
        />
      )

      expect(screen.queryByText('Delete Task?')).not.toBeInTheDocument()
    })

    it('shows default button text', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Confirm"
          message="Are you sure?"
          {...mockCallbacks}
        />
      )

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows custom confirmText and cancelText', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Task?"
          message="This action cannot be undone."
          confirmText="Delete Forever"
          cancelText="Keep It"
          {...mockCallbacks}
        />
      )

      expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keep It' })).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('calls onConfirm when confirm button clicked', async () => {
      const user = userEvent.setup()
      render(
        <ConfirmDialog
          isOpen={true}
          title="Confirm"
          message="Are you sure?"
          {...mockCallbacks}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      expect(mockCallbacks.onConfirm).toHaveBeenCalledTimes(1)
      expect(mockCallbacks.onCancel).not.toHaveBeenCalled()
    })

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(
        <ConfirmDialog
          isOpen={true}
          title="Confirm"
          message="Are you sure?"
          {...mockCallbacks}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockCallbacks.onCancel).toHaveBeenCalledTimes(1)
      expect(mockCallbacks.onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('Variant styling', () => {
    it('applies danger variant styling by default', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Task?"
          message="This action cannot be undone."
          {...mockCallbacks}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toHaveClass('bg-red-600') // Danger variant
    })

    it('applies warning variant styling', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Archive Task?"
          message="You can restore it later."
          variant="warning"
          {...mockCallbacks}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toHaveClass('bg-yellow-600') // Warning variant
    })

    it('applies primary variant styling', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Save Changes?"
          message="Do you want to save your changes?"
          variant="primary"
          {...mockCallbacks}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toHaveClass('bg-blue-600') // Primary variant
    })
  })

  describe('Loading state', () => {
    it('shows loading spinner on confirm button when isLoading', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Task?"
          message="This action cannot be undone."
          isLoading={true}
          {...mockCallbacks}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toBeDisabled()
      expect(confirmButton.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('does not show loading spinner when not loading', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Task?"
          message="This action cannot be undone."
          isLoading={false}
          {...mockCallbacks}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).not.toBeDisabled()
      expect(confirmButton.querySelector('.animate-spin')).not.toBeInTheDocument()
    })
  })
})
