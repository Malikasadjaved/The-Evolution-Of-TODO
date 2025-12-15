import { renderHook, act } from '@testing-library/react'
import { useModal } from '@/lib/hooks/useModal'

describe('useModal', () => {
  it('initializes with isOpen false by default', () => {
    const { result } = renderHook(() => useModal())
    expect(result.current.isOpen).toBe(false)
  })

  it('initializes with isOpen true when initialOpen is true', () => {
    const { result } = renderHook(() => useModal(true))
    expect(result.current.isOpen).toBe(true)
  })

  it('opens modal when open is called', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('closes modal when close is called', () => {
    const { result } = renderHook(() => useModal(true))

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('toggles modal state', () => {
    const { result } = renderHook(() => useModal())

    // Initially closed
    expect(result.current.isOpen).toBe(false)

    // Toggle to open
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    // Toggle to close
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('stores trigger element when opening', () => {
    const { result } = renderHook(() => useModal())

    // Mock active element
    const mockElement = document.createElement('button')
    jest.spyOn(document, 'activeElement', 'get').mockReturnValue(mockElement)

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })
})
