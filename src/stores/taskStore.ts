/**
 * Task Store — Zustand state management for tasks.
 * Includes Kanban column grouping and drag-drop reorder logic.
 */

import { create } from 'zustand';
import type { TaskWithRelations, TaskStatus, TaskPriority, KanbanColumn } from '@/types';
import { KANBAN_COLUMNS } from '@/lib/constants';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
}

interface TaskState {
  tasks: TaskWithRelations[];
  selectedTask: TaskWithRelations | null;
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
  isDetailOpen: boolean;

  // Actions
  setTasks: (tasks: TaskWithRelations[]) => void;
  addTask: (task: TaskWithRelations) => void;
  updateTask: (id: string, updates: Partial<TaskWithRelations>) => void;
  removeTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => void;
  setSelectedTask: (task: TaskWithRelations | null) => void;
  openDetail: (task: TaskWithRelations) => void;
  closeDetail: () => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getKanbanColumns: () => KanbanColumn[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  filters: {},
  isLoading: false,
  error: null,
  isDetailOpen: false,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
      selectedTask:
        state.selectedTask?.id === id
          ? { ...state.selectedTask, ...updates }
          : state.selectedTask,
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTask:
        state.selectedTask?.id === id ? null : state.selectedTask,
      isDetailOpen:
        state.selectedTask?.id === id ? false : state.isDetailOpen,
    })),

  moveTask: (taskId, newStatus, newPosition) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, position: newPosition }
          : t
      ),
    })),

  setSelectedTask: (task) => set({ selectedTask: task }),

  openDetail: (task) => set({ selectedTask: task, isDetailOpen: true }),

  closeDetail: () => set({ isDetailOpen: false }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: {} }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  getKanbanColumns: () => {
    const { tasks } = get();
    return KANBAN_COLUMNS.map((col) => ({
      id: col.id as TaskStatus,
      title: col.title,
      tasks: tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.position - b.position),
    }));
  },
}));
