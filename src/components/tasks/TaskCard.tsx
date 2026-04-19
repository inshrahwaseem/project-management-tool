'use client';

/**
 * TaskCard — Compact draggable card for Kanban board.
 * Shows title, priority badge, assignee avatar, due date, comment count.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, formatDate, getInitials, isOverdue } from '@/lib/utils';
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/lib/constants';
import { MessageSquare, Paperclip, Calendar, GripVertical } from 'lucide-react';
import type { TaskWithRelations } from '@/types';

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate) && task.status !== 'DONE';
  const commentCount = task._count?.comments || 0;
  const attachmentCount = task._count?.attachments || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-pointer rounded-xl border border-border bg-card/80 p-3.5 transition-all duration-200 shadow-sm backdrop-blur-md',
        'hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg ring-2 ring-primary bg-card',
      )}
      onClick={onClick}
    >
      {/* Drag handle + priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab rounded p-0.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <h4 className="text-sm font-medium text-foreground leading-snug">
            {task.title}
          </h4>
        </div>

        {/* Priority badge */}
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
          style={{
            color: TASK_PRIORITY_COLORS[task.priority],
            backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}15`,
          }}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Footer: assignee, date, counts */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
          {task.assignee && (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background"
              title={task.assignee.name}
            >
              {task.assignee.image ? (
                <img
                  src={task.assignee.image}
                  alt={task.assignee.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(task.assignee.name)
              )}
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-[11px]',
                overdue
                  ? 'font-medium text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* Counts */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" />
              {attachmentCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
