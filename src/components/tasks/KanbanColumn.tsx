'use client';

/**
 * KanbanColumn — Droppable column with task cards and quick-add.
 */

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import { Plus, X } from 'lucide-react';
import type { TaskWithRelations } from '@/types';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
  onQuickAdd: (title: string) => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  onTaskClick,
  onQuickAdd,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({ id });

  const handleAdd = () => {
    if (newTitle.trim()) {
      onQuickAdd(newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full shadow-sm"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-sm font-semibold text-foreground">
            {title}
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-1 ring-border/50">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          'kanban-column flex-1 space-y-2 rounded-xl p-2 transition-all bg-muted/30 backdrop-blur-sm border border-border/50',
          isOver && 'drag-over border-primary bg-primary/5 shadow-inner'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Quick add input */}
        {isAdding && (
          <div className="rounded-xl border border-primary bg-card/80 backdrop-blur-md p-3 shadow-md">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleAdd}
                className="rounded-md px-3 py-1 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Empty column placeholder */}
        {tasks.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-border/50 bg-background/30">
            <p className="text-xs text-muted-foreground">
              No tasks yet
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-1 text-xs font-medium text-primary hover:underline"
            >
              + Add a task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
