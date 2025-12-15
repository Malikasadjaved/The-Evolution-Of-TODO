"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import { TaskList } from "@/components/TaskList";
import { TaskForm } from "@/components/TaskForm";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import { SortDropdown } from "@/components/SortDropdown";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { useTasks } from "@/lib/hooks/useTasks";
import { useModal } from "@/lib/hooks/useModal";
import { useSession } from "@/lib/auth-client";
import { filterTasks, sortTasks, getUniqueTags } from "@/lib/utils/taskFilters";
import { DEFAULT_FILTERS, DEFAULT_SORT } from "@/lib/types";
import type { Task, TaskFilters, SortOption } from "@/lib/types";
import type { TaskFormData } from "@/lib/schemas/taskFormSchema";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>(DEFAULT_SORT);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const createModal = useModal();
  const editModal = useModal();

  // Get user ID from session - don't redirect, let API handle auth
  const userId = session?.user?.id || "";

  // Fetch tasks - if not authenticated, API will return 401
  const {
    tasks: allTasks,
    loading,
    error,
    toggleComplete,
    createTask,
    updateTask,
    deleteTask,
    isTaskLoading,
  } = useTasks(userId, filters);

  // Client-side filtering and sorting
  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(allTasks, filters);
    return sortTasks(filtered, sortBy);
  }, [allTasks, filters, sortBy]);

  // Get unique tags for filter panel
  const availableTags = useMemo(() => getUniqueTags(allTasks), [allTasks]);

  // Handle search change - memoized to prevent infinite loop with SearchBar
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  }, []);

  // Handle create task
  const handleCreateTask = async (data: TaskFormData) => {
    await createTask({
      title: data.title,
      description: data.description,
      priority: data.priority,
      tags: data.tags,
      due_date: data.dueDate || null,
      recurrence: data.recurrence,
      task_type: data.dueDate ? "scheduled" : "activity",
    });
    createModal.close();
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    editModal.open();
  };

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return;

    await updateTask(editingTask.id, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      tags: data.tags,
      due_date: data.dueDate || null,
      recurrence: data.recurrence,
    });
    editModal.close();
    setEditingTask(null);
  };

  const handleCancelEdit = () => {
    editModal.close();
    setEditingTask(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
              <p className="mt-1 text-sm text-gray-500">
                {filteredTasks.length}{" "}
                {filteredTasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={createModal.open}
              leftIcon={<PlusIcon className="h-5 w-5" />}
            >
              New Task
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableTags={availableTags}
            />
          </aside>

          {/* Task List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  value={filters.search || ""}
                  onChange={handleSearchChange}
                  placeholder="Search tasks by title, description, or tags..."
                />
              </div>
              <div className="sm:w-48">
                <SortDropdown value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            {/* Tasks */}
            <TaskList
              tasks={filteredTasks}
              loading={loading}
              error={error}
              onToggleComplete={toggleComplete}
              onEdit={handleEditTask}
              onDelete={deleteTask}
              isTaskLoading={isTaskLoading}
            />
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        title="Create New Task"
        size="lg"
      >
        <TaskForm onSubmit={handleCreateTask} onCancel={createModal.close} />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={handleCancelEdit}
        title="Edit Task"
        size="lg"
      >
        <TaskForm
          task={editingTask}
          onSubmit={handleUpdateTask}
          onCancel={handleCancelEdit}
        />
      </Modal>
    </div>
  );
}
