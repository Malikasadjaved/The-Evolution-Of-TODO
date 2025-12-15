import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/Modal'

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    )
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    )

    // Click the backdrop (the parent of the dialog panel)
    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(handleClose).toHaveBeenCalled()
    }
  })

  it('does not call onClose when backdrop clicked if preventBackdropClose is true', () => {
    const handleClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" preventBackdropClose>
        <div>Content</div>
      </Modal>
    )

    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(handleClose).not.toHaveBeenCalled()
    }
  })

  it('renders footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={jest.fn()}
        title="Test Modal"
        footer={<button>Submit</button>}
      >
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('applies small size class', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Small Modal" size="sm">
        <div>Content</div>
      </Modal>
    )
    const panel = screen.getByRole('dialog')
    expect(panel).toHaveClass('max-w-sm')
  })

  it('applies large size class', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Large Modal" size="lg">
        <div>Content</div>
      </Modal>
    )
    const panel = screen.getByRole('dialog')
    expect(panel).toHaveClass('max-w-2xl')
  })
})
