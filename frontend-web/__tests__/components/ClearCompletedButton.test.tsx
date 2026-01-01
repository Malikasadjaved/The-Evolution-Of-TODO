import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClearCompletedButton } from '../../components/ClearCompletedButton'

// Mock ConfirmDialog as it might require complex providers
jest.mock('../../components/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onClose, title }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <h1>{title}</h1>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
}))

describe('ClearCompletedButton Component', () => {
  it('renders correctly when completedCount > 0', () => {
    render(
      <ClearCompletedButton
        completedCount={5}
        onClearCompleted={jest.fn() as any}
      />
    )
    expect(screen.getByText(/Clear completed \(5\)/)).toBeInTheDocument()
  })

  it('renders nothing when completedCount is 0', () => {
    const { container } = render(
      <ClearCompletedButton
        completedCount={0}
        onClearCompleted={jest.fn() as any}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('opens confirmation dialog on click', () => {
    render(
      <ClearCompletedButton
        completedCount={3}
        onClearCompleted={jest.fn() as any}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    expect(screen.getByText('Clear Completed Tasks')).toBeInTheDocument()
  })

  it('calls onClearCompleted when confirmed', async () => {
    const onClearCompleted = jest.fn().mockResolvedValue(undefined)
    render(
      <ClearCompletedButton
        completedCount={3}
        onClearCompleted={onClearCompleted}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Confirm'))

    expect(onClearCompleted).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument())
  })

  it('closes dialog when cancelled', () => {
    render(
      <ClearCompletedButton
        completedCount={3}
        onClearCompleted={jest.fn() as any}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
  })
})
