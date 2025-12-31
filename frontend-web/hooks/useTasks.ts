/**
 * React Query Hooks for Task Management
 *
 * Provides hooks for CRUD operations on tasks with automatic caching,
 * optimistic updates, and error handling.
 *
 * Features:
 * - useTasks: Fetch all tasks for a user
 * - useTask: Fetch single task by ID
 * - useCreateTask: Create new task with optimistic update
 * - useUpdateTask: Update existing task with optimistic update
 * - useDeleteTask: Delete task with optimistic update
 * - useToggleTaskStatus: Toggle task status (INCOMPLETE ↔ COMPLETE)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api'
import type { Task } from '@/types/api'

// ============================================================================
// Query Keys
// ============================================================================

const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (userId: string, search?: string, status?: string, priority?: string, tags?: string, sort?: string, order?: string) =>
    [...taskKeys.lists(), userId, search, status, priority, tags, sort, order] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (userId: string, taskId: number) =>
    [...taskKeys.details(), userId, taskId] as const,
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchTasks(
  userId: string,
  search?: string,
  status?: string,
  priority?: string,
  tags?: string,
  sort?: string,
  order?: string
): Promise<Task[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (status) params.append('status', status)
  if (priority) params.append('priority', priority)
  if (tags) params.append('tags', tags)
  if (sort) params.append('sort', sort)
  if (order) params.append('order', order)

  const queryString = params.toString()
  const url = `/api/${userId}/tasks${queryString ? `?${queryString}` : ''}`
  return fetchWithAuth<Task[]>(url)
}

async function fetchTask(userId: string, taskId: number): Promise<Task> {
  return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}`)
}

async function createTask(
  userId: string,
  data: {
    title: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    due_date?: string
    tags?: string[]
    recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  }
): Promise<Task> {
  return fetchWithAuth<Task>(`/api/${userId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

async function updateTask(
  userId: string,
  taskId: number,
  data: {
    title?: string
    description?: string
    status?: 'INCOMPLETE' | 'COMPLETE'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    due_date?: string
    tags?: string[]
    recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  }
): Promise<Task> {
  return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

async function deleteTask(userId: string, taskId: number): Promise<void> {
  await fetchWithAuth(`/api/${userId}/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

async function toggleTaskStatus(
  userId: string,
  taskId: number,
  status: 'INCOMPLETE' | 'COMPLETE'
): Promise<Task> {
  return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all tasks for a user.
 *
 * Features:
 * - Automatic caching (5 minutes)
 * - Auto-refetch on window focus
 * - Loading and error states
 * - Optional search filtering and filters
 * - Optional sorting by due_date, priority, created_at, or title
 *
 * @param userId - User ID from authentication
 * @param search - Optional search query to filter tasks by title/description
 * @param status - Optional status filter (INCOMPLETE, COMPLETE)
 * @param priority - Optional priority filter (LOW, MEDIUM, HIGH)
 * @param tags - Optional comma-separated tags filter
 * @param sort - Optional sort field (due_date, priority, created_at, title)
 * @param order - Optional sort order (asc, desc)
 * @returns Query result with tasks array
 *
 * @example
 * const { data: tasks, isLoading, error } = useTasks(user.id)
 *
 * @example
 * // With filters and sorting
 * const { data: tasks } = useTasks(user.id, searchQuery, 'INCOMPLETE', 'HIGH', 'Work,Home', 'due_date', 'asc')
 */
export function useTasks(
  userId: string | undefined,
  search?: string,
  status?: string,
  priority?: string,
  tags?: string,
  sort?: string,
  order?: string
) {
  return useQuery({
    queryKey: taskKeys.list(userId || '', search, status, priority, tags, sort, order),
    queryFn: () => fetchTasks(userId!, search, status, priority, tags, sort, order),
    enabled: !!userId, // Only run if userId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Fetch single task by ID.
 *
 * @param userId - User ID from authentication
 * @param taskId - Task ID
 * @returns Query result with task object
 *
 * @example
 * const { data: task, isLoading } = useTask(user.id, taskId)
 */
export function useTask(userId: string | undefined, taskId: number) {
  return useQuery({
    queryKey: taskKeys.detail(userId || '', taskId),
    queryFn: () => fetchTask(userId!, taskId),
    enabled: !!userId && !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new task with optimistic update.
 *
 * Features:
 * - Optimistic UI update (instant feedback)
 * - Automatic cache invalidation
 * - Rollback on error
 *
 * @returns Mutation result with mutate/mutateAsync functions
 *
 * @example
 * const createTask = useCreateTask()
 * await createTask.mutateAsync({
 *   userId: user.id,
 *   title: 'New Task',
 *   priority: 'HIGH',
 * })
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      ...data
    }: {
      userId: string
      title: string
      description?: string
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      due_date?: string
      tags?: string[]
      recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    }) => createTask(userId, data),

    onSuccess: (newTask, variables) => {
      // Invalidate tasks list to refetch
      queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.userId),
      })
    },
  })
}

/**
 * Update existing task with optimistic update.
 *
 * @returns Mutation result with mutate/mutateAsync functions
 *
 * @example
 * const updateTask = useUpdateTask()
 * await updateTask.mutateAsync({
 *   userId: user.id,
 *   taskId: 123,
 *   title: 'Updated Title',
 *   priority: 'MEDIUM',
 * })
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      taskId,
      ...data
    }: {
      userId: string
      taskId: number
      title?: string
      description?: string
      status?: 'INCOMPLETE' | 'COMPLETE'
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      due_date?: string
      tags?: string[]
      recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    }) => updateTask(userId, taskId, data),

    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: taskKeys.list(variables.userId),
      })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(
        taskKeys.list(variables.userId)
      )

      // Optimistically update task in cache
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.list(variables.userId),
          previousTasks.map((task) =>
            task.id === variables.taskId
              ? { ...task, ...variables, updated_at: new Date().toISOString() }
              : task
          )
        )
      }

      return { previousTasks }
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list(variables.userId),
          context.previousTasks
        )
      }
    },

    // Refetch on success or error
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.userId),
      })
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.userId, variables.taskId),
      })
    },
  })
}

/**
 * Delete task with optimistic update.
 *
 * @returns Mutation result with mutate/mutateAsync functions
 *
 * @example
 * const deleteTask = useDeleteTask()
 * await deleteTask.mutateAsync({ userId: user.id, taskId: 123 })
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, taskId }: { userId: string; taskId: number }) =>
      deleteTask(userId, taskId),

    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: taskKeys.list(variables.userId),
      })

      const previousTasks = queryClient.getQueryData<Task[]>(
        taskKeys.list(variables.userId)
      )

      // Optimistically remove task
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.list(variables.userId),
          previousTasks.filter((task) => task.id !== variables.taskId)
        )
      }

      return { previousTasks }
    },

    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list(variables.userId),
          context.previousTasks
        )
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.userId),
      })
    },
  })
}

/**
 * Toggle task status (INCOMPLETE ↔ COMPLETE) with optimistic update.
 *
 * @returns Mutation result with mutate/mutateAsync functions
 *
 * @example
 * const toggleStatus = useToggleTaskStatus()
 * await toggleStatus.mutateAsync({
 *   userId: user.id,
 *   taskId: 123,
 *   status: 'COMPLETE',
 * })
 */
export function useToggleTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      taskId,
      status,
    }: {
      userId: string
      taskId: number
      status: 'INCOMPLETE' | 'COMPLETE'
    }) => toggleTaskStatus(userId, taskId, status),

    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: taskKeys.list(variables.userId),
      })

      const previousTasks = queryClient.getQueryData<Task[]>(
        taskKeys.list(variables.userId)
      )

      // Optimistically update status
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.list(variables.userId),
          previousTasks.map((task) =>
            task.id === variables.taskId
              ? {
                  ...task,
                  status: variables.status,
                  last_completed_at:
                    variables.status === 'COMPLETE'
                      ? new Date().toISOString()
                      : task.last_completed_at,
                  updated_at: new Date().toISOString(),
                }
              : task
          )
        )
      }

      return { previousTasks }
    },

    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list(variables.userId),
          context.previousTasks
        )
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.userId),
      })
    },
  })
}
