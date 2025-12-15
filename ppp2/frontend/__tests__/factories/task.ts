import { Task, Priority, Recurrence } from '@/lib/types'

/**
 * Create a mock task for testing
 */
export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: Math.floor(Math.random() * 10000),
    user_id: 'test-user-123',
    title: 'Test Task',
    description: 'Test description',
    priority: 'MEDIUM' as Priority,
    tags: [],
    completed: false,
    created_at: new Date().toISOString(),
    due_date: null,
    recurrence: 'NONE' as Recurrence,
    task_type: 'activity',
    ...overrides,
  }
}

/**
 * Create multiple mock tasks
 */
export function createMockTasks(count: number, overrides?: Partial<Task>): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTask({
      id: i + 1,
      title: `Task ${i + 1}`,
      ...overrides,
    })
  )
}

/**
 * Create a mock task with high priority
 */
export function createHighPriorityTask(overrides?: Partial<Task>): Task {
  return createMockTask({
    priority: 'HIGH' as Priority,
    ...overrides,
  })
}

/**
 * Create a mock task that is overdue
 */
export function createOverdueTask(overrides?: Partial<Task>): Task {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return createMockTask({
    due_date: yesterday.toISOString().split('T')[0], // YYYY-MM-DD format
    completed: false,
    task_type: 'scheduled',
    ...overrides,
  })
}

/**
 * Create a completed task
 */
export function createCompletedTask(overrides?: Partial<Task>): Task {
  return createMockTask({
    completed: true,
    ...overrides,
  })
}
