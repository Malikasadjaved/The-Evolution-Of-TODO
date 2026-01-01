import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTasks } from '../../hooks/useTasks'
import { fetchWithAuth } from '../../lib/api'
import React from 'react'

// Mock fetchWithAuth
jest.mock('../../lib/api', () => ({
  fetchWithAuth: jest.fn(),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useTasks Hook', () => {
  beforeEach(() => {
    queryClient.clear()
    jest.clearAllMocks()
  })

  it('fetches tasks correctly when user is authenticated', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', status: 'INCOMPLETE', priority: 'MEDIUM', user_id: 'user1' },
      { id: 2, title: 'Task 2', status: 'COMPLETE', priority: 'HIGH', user_id: 'user1' },
    ]
    ;(fetchWithAuth as jest.Mock).mockResolvedValue(mockTasks)

    const { result } = renderHook(() => useTasks('user1'), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockTasks)
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/user1/tasks')
  })

  it('does not fetch when userId is missing', () => {
    const { result } = renderHook(() => useTasks(undefined), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPending).toBe(true) // React Query v5 isPending is true while waiting for enabled
    expect(fetchWithAuth).not.toHaveBeenCalled()
  })

  it('applies filters to the API call', async () => {
    ;(fetchWithAuth as jest.Mock).mockResolvedValue([])

    renderHook(() => useTasks('user1', 'search-term', 'COMPLETE', 'HIGH'), { wrapper })

    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('search=search-term')
      )
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('status=COMPLETE')
      )
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('priority=HIGH')
      )
    })
  })

  it('handles API errors', async () => {
    ;(fetchWithAuth as jest.Mock).mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useTasks('user1'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(new Error('API error'))
  })
})
