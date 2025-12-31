# Dashboard Empty States & Completed Tasks - Implementation Guide

## Changes Required to app/dashboard/page.tsx

### 1. Replace the Task Rendering Section (Lines 862-905 approximately)

Find the section that looks like:
```tsx
{/* Task Cards */}
<div className="space-y-3 flex-1 min-h-[500px]">
  <AnimatePresence mode="popLayout">
    {column.tasks?.length === 0 ? (
      <motion.div className="bg-white/5 ...">
        ...
      </motion.div>
    ) : (
      column.tasks?.map((task, index) => (
        <TaskCard ... />
      ))
    )}
  </AnimatePresence>
</div>
```

Replace with:
```tsx
{/* Task Cards */}
<div className="space-y-3 flex-1 min-h-[500px]">
  <AnimatePresence mode="popLayout">
    {column.tasks?.length === 0 ? (
      // Empty state for completed tasks
      column.status === 'COMPLETE' ? (
        <EmptyState type="completed-empty" />
      ) : (
        <motion.div
          className="bg-white/5 backdrop-blur-lg border border-blue-500/10 rounded-2xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">
            No tasks in this column
          </p>
        </motion.div>
      )
    ) : (
      <>
        {column.tasks?.map((task, index) =>
          column.status === 'COMPLETE' ? (
            <CompletedTaskItem
              key={task.id}
              task={task}
              index={index}
              onClick={() => handleEditTask(task)}
              onDelete={handleDeleteTask}
              onToggleStatus={(taskId, status) =>
                handleToggleStatus(taskId, status)
              }
            />
          ) : (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onClick={() => handleEditTask(task)}
              onDelete={handleDeleteTask}
              onToggleStatus={handleToggleStatus}
            />
          )
        )}
      </>
    )}
  </AnimatePresence>

  {/* Clear Completed Button (only for Complete column) */}
  {column.status === 'COMPLETE' && column.tasks && column.tasks.length > 0 && (
    <ClearCompletedButton
      completedCount={column.tasks.length}
      onClearCompleted={async () => {
        if (!user) return
        // Delete all completed tasks
        for (const task of column.tasks) {
          try {
            await deleteTask.mutateAsync({
              userId: user.id,
              taskId: task.id,
            })
          } catch (error) {
            console.error('Failed to delete task:', error)
          }
        }
        toast.success(
          `Cleared ${column.tasks.length} completed ${
            column.tasks.length === 1 ? 'task' : 'tasks'
          }`
        )
      }}
      isLoading={deleteTask.isPending}
    />
  )}
</div>
```

### 2. Update the global EmptyState for dashboard-wide no tasks (around line 590-610)

Find:
```tsx
) : tasks && tasks.length === 0 ? (
  <EmptyState
    type={
      searchQuery
        ? 'no-search-results'
        : filterPriority !== 'all' || filterTags !== 'all'
        ? 'no-filtered-tasks'
        : 'no-tasks'
    }
    searchQuery={searchQuery}
    onAction={() => {
      if (searchQuery) {
        setSearchQuery('')
      } else if (filterPriority !== 'all' || filterTags !== 'all') {
        setFilterPriority('all')
        setFilterTags('all')
      } else {
        handleCreateTask()
      }
    }}
  />
```

Replace `'no-tasks'` with `'dashboard-empty'`:
```tsx
type={
  searchQuery
    ? 'no-search-results'
    : filterPriority !== 'all' || filterTags !== 'all'
    ? 'no-filtered-tasks'
    : 'dashboard-empty'
}
```

## Files Already Created

- ✅ `components/illustrations/CheckmarkSparkles.tsx`
- ✅ `components/ConfettiEffect.tsx`
- ✅ `components/CompletedTaskItem.tsx`
- ✅ `components/ClearCompletedButton.tsx`
- ✅ `components/EmptyState.tsx` (updated with new variants)

## Next: Update StatsGrid for Zero Overdue Celebration

See STATS_GRID_CELEBRATION_PATCH.md
