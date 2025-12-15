/**
 * Tests for taskFormSchema
 *
 * Validates all form validation rules:
 * - Title requirements
 * - Description length limits
 * - Priority enum values
 * - Tags array handling
 * - Due date validation (no past dates)
 * - Recurrence enum values
 */

import { taskFormSchema, type TaskFormData } from '@/lib/schemas/taskFormSchema'

describe('taskFormSchema', () => {
  describe('Valid data', () => {
    it('validates complete valid task data', () => {
      const validData: TaskFormData = {
        title: 'Complete project',
        description: 'Finish the todo app',
        priority: 'HIGH',
        tags: ['work', 'urgent'],
        dueDate: '2025-12-20',
        recurrence: 'NONE',
      }

      const result = taskFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('validates minimal required data (only title and priority)', () => {
      const minimalData = {
        title: 'Simple task',
        priority: 'MEDIUM',
      }

      const result = taskFormSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('accepts all priority levels', () => {
      const priorities = ['HIGH', 'MEDIUM', 'LOW']

      priorities.forEach((priority) => {
        const data = {
          title: 'Task',
          priority,
        }
        const result = taskFormSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('accepts all recurrence types', () => {
      const recurrences = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

      recurrences.forEach((recurrence) => {
        const data = {
          title: 'Task',
          priority: 'MEDIUM',
          recurrence,
        }
        const result = taskFormSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('accepts empty tags array', () => {
      const data = {
        title: 'Task',
        priority: 'MEDIUM',
        tags: [],
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('accepts future due date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const data = {
        title: 'Task',
        priority: 'MEDIUM',
        dueDate: futureDate.toISOString().split('T')[0],
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('accepts today as due date', () => {
      const today = new Date().toISOString().split('T')[0]

      const data = {
        title: 'Task',
        priority: 'MEDIUM',
        dueDate: today,
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid title', () => {
    it('rejects empty title', () => {
      const data = {
        title: '',
        priority: 'MEDIUM',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required')
      }
    })

    it('rejects whitespace-only title', () => {
      const data = {
        title: '   ',
        priority: 'MEDIUM',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title cannot be only whitespace')
      }
    })

    it('rejects title over 200 characters', () => {
      const data = {
        title: 'a'.repeat(201),
        priority: 'MEDIUM',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be 200 characters or less')
      }
    })

    it('accepts title at exactly 200 characters', () => {
      const data = {
        title: 'a'.repeat(200),
        priority: 'MEDIUM',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid description', () => {
    it('rejects description over 1000 characters', () => {
      const data = {
        title: 'Task',
        description: 'a'.repeat(1001),
        priority: 'MEDIUM',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Description must be 1000 characters or less'
        )
      }
    })

    it('accepts description at exactly 1000 characters', () => {
      const data = {
        title: 'Task',
        description: 'a'.repeat(1000),
        priority: 'MEDIUM',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid priority', () => {
    it('rejects invalid priority value', () => {
      const data = {
        title: 'Task',
        priority: 'CRITICAL',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('rejects missing priority', () => {
      const data = {
        title: 'Task',
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Priority is required')
      }
    })
  })

  describe('Invalid due date', () => {
    it('rejects past due date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const data = {
        title: 'Task',
        priority: 'MEDIUM',
        dueDate: pastDate.toISOString().split('T')[0],
      }

      const result = taskFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Due date cannot be in the past')
      }
    })
  })

  describe('Default values', () => {
    it('applies default values for optional fields', () => {
      const data = {
        title: 'Task',
        priority: 'MEDIUM' as const,
      }

      const result = taskFormSchema.parse(data)
      expect(result.description).toBe('')
      expect(result.tags).toEqual([])
      expect(result.recurrence).toBe('NONE')
    })
  })
})
