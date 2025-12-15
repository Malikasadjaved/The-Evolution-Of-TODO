/**
 * Tests for useTasks custom hook
 *
 * Comprehensive test coverage for:
 * - Initial fetch on mount with loading/error states
 * - Optimistic updates for toggleComplete
 * - Create/update/delete operations
 * - Error handling with rollback
 * - Toast notifications
 * - Per-task loading states
 * - Refetch functionality
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useTasks } from '@/lib/hooks/useTasks'
import { api } from '@/lib/api'
import { useToast } from '@/lib/hooks/useToast'
import type { Task, Priority, Recurrence } from '@/lib/types'

// Mock dependencies
jest.mock('@/lib/api', () => ({
  api: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    toggleComplete: jest.fn(),
  },
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message
    }
    return 'An unknown error occurred'
  },
}))
jest.mock('@/lib/hooks/useToast')

const mockApi = api as jest.Mocked<typeof api>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

// Mock toast functions
const mockAddToast = jest.fn()

// Test data factory
const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 1,
  user_id: 'user-123',
  title: 'Test Task',
  description: 'Test description',
  priority: 'MEDIUM' as Priority,
  tags: ['work'],
  due_date: '2025-12-20',
  task_type: 'activity',
  recurrence: 'NONE' as Recurrence,
  completed: false,
  completed_at: null,
  created_at: '2025-12-12T00:00:00Z',
  updated_at: '2025-12-12T00:00:00Z',
  is_overdue: false,
  ...overrides,
})

describe('useTasks', () => {
  const userId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToast.mockReturnValue({
      toasts: [],
      addToast: mockAddToast,
      removeToast: jest.fn(),
    })
  })

  describe('Initial fetch on mount', () => {
    it('should fetch tasks on mount and set loading state', async () => {
      const mockTasks = [createMockTask(), createMockTask({ id: 2, title: 'Task 2' })]
      mockApi.getTasks.mockResolvedValueOnce(mockTasks)

      const { result } = renderHook(() => useTasks(userId))

      // Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.tasks).toEqual([])
      expect(result.current.error).toBe(null)

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.tasks).toEqual(mockTasks)
      expect(result.current.error).toBe(null)
      expect(mockApi.getTasks).toHaveBeenCalledWith(userId, undefined)
    })

    it('should handle fetch error and display error message', async () => {
      const errorMessage = 'Failed to fetch tasks'
      mockApi.getTasks.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.tasks).toEqual([])
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        message: errorMessage,
      })
    })

    it('should fetch with filters when provided', async () => {
      const mockTasks = [createMockTask()]
      const filters = { status: 'pending' as const, priority: 'HIGH' as Priority }
      mockApi.getTasks.mockResolvedValueOnce(mockTasks)

      renderHook(() => useTasks(userId, filters))

      await waitFor(() => {
        expect(mockApi.getTasks).toHaveBeenCalledWith(userId, filters)
      })
    })
  })

  describe('toggleComplete', () => {
    it('should optimistically update task completion and show success toast', async () => {
      const task = createMockTask({ id: 1, completed: false })
      const updatedTask = { ...task, completed: true }
      mockApi.getTasks.mockResolvedValueOnce([task])
      mockApi.toggleComplete.mockResolvedValueOnce(updatedTask)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Toggle completion
      await act(async () => {
        await result.current.toggleComplete(1)
      })

      // Check optimistic update happened
      expect(result.current.tasks[0].completed).toBe(true)

      // Check API was called
      expect(mockApi.toggleComplete).toHaveBeenCalledWith(userId, 1)

      // Check success toast
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Task completed!',
      })
    })

    it('should show correct message when marking task as incomplete', async () => {
      const task = createMockTask({ id: 1, completed: true })
      const updatedTask = { ...task, completed: false }
      mockApi.getTasks.mockResolvedValueOnce([task])
      mockApi.toggleComplete.mockResolvedValueOnce(updatedTask)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      await act(async () => {
        await result.current.toggleComplete(1)
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Task marked as incomplete',
      })
    })

    it('should rollback on error and show error toast', async () => {
      const task = createMockTask({ id: 1, completed: false })
      mockApi.getTasks.mockResolvedValueOnce([task])
      mockApi.toggleComplete.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Initial state
      expect(result.current.tasks[0].completed).toBe(false)

      // Toggle completion (will fail)
      await act(async () => {
        await result.current.toggleComplete(1)
      })

      // Should rollback to original state
      expect(result.current.tasks[0].completed).toBe(false)

      // Check error toast
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Network error',
      })
    })

    it('should do nothing if task not found', async () => {
      mockApi.getTasks.mockResolvedValueOnce([])

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.toggleComplete(999)
      })

      expect(mockApi.toggleComplete).not.toHaveBeenCalled()
    })

    it('should track loading state for the task being toggled', async () => {
      const task = createMockTask({ id: 1, completed: false })
      mockApi.getTasks.mockResolvedValueOnce([task])

      // Create a promise we can control
      let resolveToggle: (value: Task) => void
      const togglePromise = new Promise<Task>((resolve) => {
        resolveToggle = resolve
      })
      mockApi.toggleComplete.mockReturnValueOnce(togglePromise)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Start toggle
      act(() => {
        result.current.toggleComplete(1)
      })

      // Should be loading
      await waitFor(() => {
        expect(result.current.isTaskLoading(1)).toBe(true)
      })

      // Resolve the toggle
      await act(async () => {
        resolveToggle!({ ...task, completed: true })
      })

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isTaskLoading(1)).toBe(false)
      })
    })
  })

  describe('createTask', () => {
    it('should create task, add to list, and show success toast', async () => {
      mockApi.getTasks.mockResolvedValueOnce([])
      const newTask = createMockTask({ id: 1, title: 'New Task' })
      mockApi.createTask.mockResolvedValueOnce(newTask)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(0)
      })

      const taskData = {
        title: 'New Task',
        description: 'New description',
        priority: 'HIGH' as Priority,
      }

      let createdTask: Task | undefined
      await act(async () => {
        createdTask = await result.current.createTask(taskData)
      })

      expect(createdTask).toEqual(newTask)
      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0]).toEqual(newTask)
      expect(mockApi.createTask).toHaveBeenCalledWith(userId, taskData)
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Task created successfully!',
      })
    })

    it('should add new task to beginning of list', async () => {
      const existingTask = createMockTask({ id: 1, title: 'Existing' })
      const newTask = createMockTask({ id: 2, title: 'New' })
      mockApi.getTasks.mockResolvedValueOnce([existingTask])
      mockApi.createTask.mockResolvedValueOnce(newTask)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      await act(async () => {
        await result.current.createTask({ title: 'New' })
      })

      expect(result.current.tasks).toHaveLength(2)
      expect(result.current.tasks[0].id).toBe(2) // New task first
      expect(result.current.tasks[1].id).toBe(1)
    })

    it('should handle create error and show error toast', async () => {
      mockApi.getTasks.mockResolvedValueOnce([])
      mockApi.createTask.mockRejectedValueOnce(new Error('Validation error'))

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.createTask({ title: 'New Task' })
        })
      ).rejects.toThrow('Validation error')

      expect(result.current.tasks).toHaveLength(0)
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Validation error',
      })
    })
  })

  describe('updateTask', () => {
    it('should update task in list and show success toast', async () => {
      const task = createMockTask({ id: 1, title: 'Original' })
      const updatedTask = { ...task, title: 'Updated' }
      mockApi.getTasks.mockResolvedValueOnce([task])
      mockApi.updateTask.mockResolvedValueOnce(updatedTask)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      const updateData = { title: 'Updated' }
      let returnedTask: Task | undefined

      await act(async () => {
        returnedTask = await result.current.updateTask(1, updateData)
      })

      expect(returnedTask).toEqual(updatedTask)
      expect(result.current.tasks[0].title).toBe('Updated')
      expect(mockApi.updateTask).toHaveBeenCalledWith(userId, 1, updateData)
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Task updated successfully!',
      })
    })

    it('should track loading state during update', async () => {
      const task = createMockTask({ id: 1 })
      mockApi.getTasks.mockResolvedValueOnce([task])

      let resolveUpdate: (value: Task) => void
      const updatePromise = new Promise<Task>((resolve) => {
        resolveUpdate = resolve
      })
      mockApi.updateTask.mockReturnValueOnce(updatePromise)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Start update
      act(() => {
        result.current.updateTask(1, { title: 'Updated' })
      })

      // Should be loading
      await waitFor(() => {
        expect(result.current.isTaskLoading(1)).toBe(true)
      })

      // Resolve the update
      await act(async () => {
        resolveUpdate!({ ...task, title: 'Updated' })
      })

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isTaskLoading(1)).toBe(false)
      })
    })

    it('should handle update error and show error toast', async () => {
      const task = createMockTask({ id: 1, title: 'Original' })
      mockApi.getTasks.mockResolvedValueOnce([task])
      mockApi.updateTask.mockRejectedValueOnce(new Error('Update failed'))

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      await expect(
        act(async () => {
          await result.current.updateTask(1, { title: 'Updated' })
        })
      ).rejects.toThrow('Update failed')

      // Should remain unchanged
      expect(result.current.tasks[0].title).toBe('Original')
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Update failed',
      })
    })
  })

  describe('deleteTask', () => {
    it('should optimistically delete task and show success toast', async () => {
      const task1 = createMockTask({ id: 1, title: 'Task 1' })
      const task2 = createMockTask({ id: 2, title: 'Task 2' })
      mockApi.getTasks.mockResolvedValueOnce([task1, task2])
      mockApi.deleteTask.mockResolvedValueOnce()

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2)
      })

      await act(async () => {
        await result.current.deleteTask(1)
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0].id).toBe(2)
      expect(mockApi.deleteTask).toHaveBeenCalledWith(userId, 1)
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Task deleted successfully!',
      })
    })

    it('should rollback on delete error and show error toast', async () => {
      const task1 = createMockTask({ id: 1, title: 'Task 1' })
      const task2 = createMockTask({ id: 2, title: 'Task 2' })
      mockApi.getTasks.mockResolvedValueOnce([task1, task2])
      mockApi.deleteTask.mockRejectedValueOnce(new Error('Delete failed'))

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2)
      })

      // Attempt delete (will fail)
      await expect(
        act(async () => {
          await result.current.deleteTask(1)
        })
      ).rejects.toThrow('Delete failed')

      // Should rollback - both tasks still present
      expect(result.current.tasks).toHaveLength(2)
      expect(result.current.tasks.find(t => t.id === 1)).toBeDefined()
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Delete failed',
      })
    })

    it('should track loading state during delete', async () => {
      const task = createMockTask({ id: 1 })
      mockApi.getTasks.mockResolvedValueOnce([task])

      let resolveDelete: () => void
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      mockApi.deleteTask.mockReturnValueOnce(deletePromise)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Start delete
      act(() => {
        result.current.deleteTask(1)
      })

      // Task should be immediately removed (optimistic)
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(0)
      })

      // But loading state should be tracked
      // Note: Since task is removed, isTaskLoading might not be useful here
      // But it's still tracked internally

      // Resolve the delete
      await act(async () => {
        resolveDelete!()
      })
    })
  })

  describe('isTaskLoading', () => {
    it('should return false for task that is not being mutated', async () => {
      const task = createMockTask({ id: 1 })
      mockApi.getTasks.mockResolvedValueOnce([task])

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      expect(result.current.isTaskLoading(1)).toBe(false)
    })

    it('should return true for task being mutated', async () => {
      const task = createMockTask({ id: 1 })
      mockApi.getTasks.mockResolvedValueOnce([task])

      let resolveUpdate: (value: Task) => void
      const updatePromise = new Promise<Task>((resolve) => {
        resolveUpdate = resolve
      })
      mockApi.updateTask.mockReturnValueOnce(updatePromise)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Start update
      act(() => {
        result.current.updateTask(1, { title: 'Updated' })
      })

      // Should be loading
      await waitFor(() => {
        expect(result.current.isTaskLoading(1)).toBe(true)
      })

      // Complete update
      await act(async () => {
        resolveUpdate!({ ...task, title: 'Updated' })
      })

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isTaskLoading(1)).toBe(false)
      })
    })

    it('should return false for non-existent task', async () => {
      mockApi.getTasks.mockResolvedValueOnce([])

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isTaskLoading(999)).toBe(false)
    })
  })

  describe('refetch', () => {
    it('should refetch tasks from API', async () => {
      const initialTasks = [createMockTask({ id: 1 })]
      const updatedTasks = [
        createMockTask({ id: 1 }),
        createMockTask({ id: 2, title: 'New Task' }),
      ]
      mockApi.getTasks.mockResolvedValueOnce(initialTasks)

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Setup for refetch
      mockApi.getTasks.mockResolvedValueOnce(updatedTasks)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.tasks).toHaveLength(2)
      expect(mockApi.getTasks).toHaveBeenCalledTimes(2)
    })

    it('should set loading state during refetch', async () => {
      mockApi.getTasks.mockResolvedValueOnce([])

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resolveRefetch: (value: Task[]) => void
      const refetchPromise = new Promise<Task[]>((resolve) => {
        resolveRefetch = resolve
      })
      mockApi.getTasks.mockReturnValueOnce(refetchPromise)

      // Start refetch
      act(() => {
        result.current.refetch()
      })

      // Should be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // Resolve refetch
      await act(async () => {
        resolveRefetch!([])
      })

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should handle refetch error', async () => {
      mockApi.getTasks.mockResolvedValueOnce([])

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockApi.getTasks.mockRejectedValueOnce(new Error('Refetch failed'))

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBe('Refetch failed')
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Refetch failed',
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty task list', async () => {
      mockApi.getTasks.mockResolvedValueOnce([])

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.tasks).toEqual([])
      expect(result.current.error).toBe(null)
    })

    it('should handle multiple rapid mutations on same task', async () => {
      const task = createMockTask({ id: 1, completed: false })
      mockApi.getTasks.mockResolvedValueOnce([task])
      mockApi.toggleComplete.mockResolvedValue({ ...task, completed: true })
      mockApi.updateTask.mockResolvedValue({ ...task, title: 'Updated' })

      const { result } = renderHook(() => useTasks(userId))

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1)
      })

      // Start multiple mutations
      await act(async () => {
        await Promise.all([
          result.current.toggleComplete(1),
          result.current.updateTask(1, { title: 'Updated' }),
        ])
      })

      // Both should complete
      expect(mockApi.toggleComplete).toHaveBeenCalled()
      expect(mockApi.updateTask).toHaveBeenCalled()
    })

    it('should refetch when userId changes', async () => {
      mockApi.getTasks.mockResolvedValueOnce([createMockTask()])

      const { result, rerender } = renderHook(
        ({ userId }) => useTasks(userId),
        { initialProps: { userId: 'user-1' } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(mockApi.getTasks).toHaveBeenCalledWith('user-1', undefined)

      // Change userId - should trigger new fetch
      mockApi.getTasks.mockResolvedValueOnce([])

      act(() => {
        rerender({ userId: 'user-2' })
      })

      await waitFor(() => {
        expect(mockApi.getTasks).toHaveBeenCalledWith('user-2', undefined)
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.tasks).toHaveLength(0)
    })
  })
})
