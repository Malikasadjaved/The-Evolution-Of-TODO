import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce } from '@/lib/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 500 })

    // Value should not update immediately
    expect(result.current).toBe('initial')

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Now value should update
    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })

  it('cancels previous debounce when value changes rapidly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    // Rapid changes
    rerender({ value: 'first' })
    act(() => {
      jest.advanceTimersByTime(200)
    })

    rerender({ value: 'second' })
    act(() => {
      jest.advanceTimersByTime(200)
    })

    rerender({ value: 'third' })

    // Only the last value should be set after full delay
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(result.current).toBe('third')
    })
  })

  it('updates immediately when delay is 0', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    expect(result.current).toBe('updated')
  })
})
