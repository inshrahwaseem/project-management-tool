'use client';

/**
 * Kanban Board View — Drag-and-drop task management with real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { KANBAN_COLUMNS } from '@/lib/constants';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { TaskCard } from '@/components/tasks/TaskCard';
import type { TaskWithRelations, TaskStatus } from '@/types';

export default function BoardPage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
    tasks,
    setTasks,
    moveTask,
    isLoading,
    setLoading,
    openDetail,
  } = useTaskStore();

  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [projectTitle, setProjectTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projectRes] = await Promise.all([
        fetch(`/api/v1/projects/${projectId}/tasks?limit=100`),
        fetch(`/api/v1/projects/${projectId}`),
      ]);

      const tasksData = await tasksRes.json();
      const projectData = await projectRes.json();

      if (tasksData.success) setTasks(tasksData.data);
      if (projectData.success) setProjectTitle(projectData.data.title);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [projectId, setTasks, setLoading]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group tasks by status
  const columns = KANBAN_COLUMNS.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.status === col.id)
      .sort((a, b) => a.position - b.position),
  }));

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine new status — overId could be a column ID or another task ID
    let newStatus: TaskStatus;
    const overTask = tasks.find((t) => t.id === overId);

    if (overTask) {
      newStatus = overTask.status;
    } else {
      // overId is a column ID
      newStatus = overId as TaskStatus;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || (task.status === newStatus && !overTask)) return;

    // Calculate new position
    const columnTasks = tasks
      .filter((t) => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;
    if (overTask) {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      if (overIndex === 0) {
        newPosition = columnTasks[0].position - 1000;
      } else if (overIndex === columnTasks.length - 1) {
        newPosition = columnTasks[overIndex].position + 1000;
      } else {
        newPosition = Math.floor(
          (columnTasks[overIndex - 1].position + columnTasks[overIndex].position) / 2
        );
      }
    } else {
      newPosition = columnTasks.length > 0
        ? columnTasks[columnTasks.length - 1].position + 1000
        : 1000;
    }

    // Optimistic update
    moveTask(taskId, newStatus, newPosition);

    // Persist to server
    try {
      await fetch('/api/v1/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: [{ id: taskId, status: newStatus, position: newPosition }],
        }),
      });
    } catch {
      toast.error('Failed to save — reverting');
      fetchTasks();
    }
  };

  // Quick add task
  const handleQuickAdd = async (status: string, title: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status }),
      });
      const data = await res.json();

      if (data.success) {
        setTasks([...tasks, data.data]);
        toast.success('Task created');
      }
    } catch {
      toast.error('Failed to create task');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-10 skeleton rounded-lg" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-32 skeleton rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Board Header Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} across {columns.length} columns
        </p>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={column.tasks}
              onTaskClick={(task) => openDetail(task)}
              onQuickAdd={(title) => handleQuickAdd(column.id, title)}
            />
          ))}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
