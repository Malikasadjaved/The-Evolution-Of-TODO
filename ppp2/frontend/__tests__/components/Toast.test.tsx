import { render, screen, act, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '@/lib/hooks/useToast'

// Test component that uses the toast hook
function TestComponent() {
  const { addToast } = useToast()

  return (
    <div>
      <button onClick={() => addToast({ type: 'success', message: 'Success!' })}>
        Show Success
      </button>
      <button onClick={() => addToast({ type: 'error', message: 'Error!' })}>
        Show Error
      </button>
      <button onClick={() => addToast({ type: 'warning', message: 'Warning!' })}>
        Show Warning
      </button>
      <button onClick={() => addToast({ type: 'info', message: 'Info!' })}>
        Show Info
      </button>
      <button onClick={() => addToast({ type: 'success', message: 'Custom Duration', duration: 1000 })}>
        Custom Duration
      </button>
    </div>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('displays success toast when addToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      screen.getByText('Show Success').click()
    })

    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('displays error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      screen.getByText('Show Error').click()
    })

    expect(screen.getByText('Error!')).toBeInTheDocument()
  })

  it('auto-dismisses toast after default duration (3000ms)', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      screen.getByText('Show Success').click()
    })

    expect(screen.getByText('Success!')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument()
    })
  })

  it('auto-dismisses toast after custom duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      screen.getByText('Custom Duration').click()
    })

    expect(screen.getByText('Custom Duration')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(screen.queryByText('Custom Duration')).not.toBeInTheDocument()
    })
  })

  it('displays multiple toasts simultaneously', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      screen.getByText('Show Success').click()
      screen.getByText('Show Error').click()
    })

    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Error!')).toBeInTheDocument()
  })

  it('throws error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useToast must be used within ToastProvider')

    spy.mockRestore()
  })
})
