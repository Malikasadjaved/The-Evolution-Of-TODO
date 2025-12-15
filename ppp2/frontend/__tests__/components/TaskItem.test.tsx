/**
 * Tests for TaskItem component
 *
 * Tests cover:
 * - Visual elements rendering (title, description, badges, dates)
 * - Completion styling
 * - Overdue indicator
 * - Interactive callbacks
 * - Loading states
 * - Accessibility
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskItem } from '@/components/TaskItem'
import type { Task } from '@/lib/types'

const mockTask: Task = {
  id: 1,
  user_id: 'user-123',
  title: 'Test Task',
  description: 'Test description for the task',
  priority: 'MEDIUM',
  tags: ['work', 'urgent'],
  due_date: '2025-12-20',
  task_type: 'scheduled',
  recurrence: 'NONE',
  completed: false,
  completed_at: null,
  created_at: '2025-12-10T00:00:00Z',
  updated_at: '2025-12-10T00:00:00Z',
  is_overdue: false,
}

const mockCallbacks = {
  onToggle: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
}

describe('TaskItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders task title and description', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      expect(screen.getByText('Test Task')).toBeInTheDocument()
      expect(screen.getByText('Test description for the task')).toBeInTheDocument()
    })

    it('renders priority badge with correct variant', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const priorityBadge = screen.getByText('MEDIUM')
      expect(priorityBadge).toBeInTheDocument()
      expect(priorityBadge).toHaveClass('bg-yellow-100') // Warning variant
    })

    it('renders all tag badges', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      expect(screen.getByText('work')).toBeInTheDocument()
      expect(screen.getByText('urgent')).toBeInTheDocument()
    })

    it('renders due date when provided', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      expect(screen.getByText(/Dec 20, 2025/)).toBeInTheDocument()
    })

    it('does not render due date when not provided', () => {
      const taskWithoutDueDate = { ...mockTask, due_date: null }
      render(<TaskItem task={taskWithoutDueDate} {...mockCallbacks} />)

      expect(screen.queryByText(/Dec/)).not.toBeInTheDocument()
    })
  })

  describe('Completion styling', () => {
    it('applies strikethrough and opacity to completed tasks', () => {
      const completedTask = { ...mockTask, completed: true }
      render(<TaskItem task={completedTask} {...mockCallbacks} />)

      const title = screen.getByText('Test Task')
      expect(title).toHaveClass('line-through')

      // Check parent has reduced opacity
      const article = screen.getByRole('article')
      expect(article).toHaveClass('opacity-60')
    })

    it('does not apply completion styling to incomplete tasks', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const title = screen.getByText('Test Task')
      expect(title).not.toHaveClass('line-through')

      const article = screen.getByRole('article')
      expect(article).not.toHaveClass('opacity-60')
    })
  })

  describe('Overdue indicator', () => {
    it('shows overdue badge for overdue incomplete tasks', () => {
      const overdueTask = { ...mockTask, is_overdue: true, completed: false }
      render(<TaskItem task={overdueTask} {...mockCallbacks} />)

      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('Overdue')).toHaveClass('bg-red-100') // Error variant
    })

    it('does not show overdue badge for completed tasks', () => {
      const overdueCompletedTask = { ...mockTask, is_overdue: true, completed: true }
      render(<TaskItem task={overdueCompletedTask} {...mockCallbacks} />)

      expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    })

    it('does not show overdue badge for tasks not overdue', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    })
  })

  describe('Interactive callbacks', () => {
    it('calls onToggle when checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(mockCallbacks.onToggle).toHaveBeenCalledWith(mockTask.id)
      expect(mockCallbacks.onToggle).toHaveBeenCalledTimes(1)
    })

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const editButton = screen.getByLabelText('Edit task')
      await user.click(editButton)

      expect(mockCallbacks.onEdit).toHaveBeenCalledWith(mockTask)
      expect(mockCallbacks.onEdit).toHaveBeenCalledTimes(1)
    })

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const deleteButton = screen.getByLabelText('Delete task')
      await user.click(deleteButton)

      expect(mockCallbacks.onDelete).toHaveBeenCalledWith(mockTask.id)
      expect(mockCallbacks.onDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading state', () => {
    it('shows loading overlay when isLoading is true', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} isLoading={true} />)

      // Loading spinner should be visible
      const loadingSpinner = screen.getByRole('status', { name: /loading/i })
      expect(loadingSpinner).toBeInTheDocument()

      // Buttons should be disabled
      const checkbox = screen.getByRole('checkbox')
      const editButton = screen.getByLabelText('Edit task')
      const deleteButton = screen.getByLabelText('Delete task')

      expect(checkbox).toBeDisabled()
      expect(editButton).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })

    it('does not show loading overlay when isLoading is false', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} isLoading={false} />)

      expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
    })
  })

  describe('Compact mode', () => {
    it('renders in compact mode when compact prop is true', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} compact={true} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('p-2') // Less padding in compact mode
    })

    it('renders in default mode when compact prop is false', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} compact={false} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('p-4') // More padding in default mode
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA role and attributes', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-label', 'Test Task')
    })

    it('checkbox has descriptive aria-label', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-label', 'Mark task "Test Task" as complete')
    })

    it('edit button has aria-label', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const editButton = screen.getByLabelText('Edit task')
      expect(editButton).toBeInTheDocument()
    })

    it('delete button has aria-label', () => {
      render(<TaskItem task={mockTask} {...mockCallbacks} />)

      const deleteButton = screen.getByLabelText('Delete task')
      expect(deleteButton).toBeInTheDocument()
    })
  })
})
