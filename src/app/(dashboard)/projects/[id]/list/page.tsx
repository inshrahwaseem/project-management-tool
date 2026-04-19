'use client';

/**
 * List View — Table view of project tasks with sort and inline editing.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn, formatDate, getInitials, isOverdue } from '@/lib/utils';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from '@/lib/constants';
import { ArrowUpDown, List } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import type { TaskWithRelations } from '@/types';

export default function ListViewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tasks, setTasks, isLoading, setLoading, openDetail } = useTaskStore();
  const [sortField, setSortField] = useState<string>('position');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks?limit=100`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, setTasks, setLoading]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aVal = a[sortField as keyof TaskWithRelations];
    const bVal = b[sortField as keyof TaskWithRelations];
    const modifier = sortDir === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    return 0;
  });

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-10 skeleton rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <List className="h-5 w-5 text-[hsl(var(--primary))]" />
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">List View</h2>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          ({tasks.length} tasks)
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
              <th className="px-4 py-3 text-left"><SortHeader field="title">Title</SortHeader></th>
              <th className="px-4 py-3 text-left"><SortHeader field="status">Status</SortHeader></th>
              <th className="px-4 py-3 text-left"><SortHeader field="priority">Priority</SortHeader></th>
              <th className="px-4 py-3 text-left">Assignee</th>
              <th className="px-4 py-3 text-left"><SortHeader field="dueDate">Due Date</SortHeader></th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => openDetail(task)}
                className="cursor-pointer border-b border-[hsl(var(--border)/0.5)] transition-colors hover:bg-[hsl(var(--muted)/0.3)]"
              >
                <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">
                  {task.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      color: TASK_STATUS_COLORS[task.status],
                      backgroundColor: `${TASK_STATUS_COLORS[task.status]}15`,
                    }}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      color: TASK_PRIORITY_COLORS[task.priority],
                      backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}15`,
                    }}
                  >
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-white">
                        {getInitials(task.assignee.name)}
                      </div>
                      <span className="text-[hsl(var(--foreground))]">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-[hsl(var(--muted-foreground))]">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.dueDate ? (
                    <span className={cn(
                      'text-sm',
                      isOverdue(task.dueDate) && task.status !== 'DONE'
                        ? 'font-medium text-[hsl(var(--destructive))]'
                        : 'text-[hsl(var(--muted-foreground))]'
                    )}>
                      {formatDate(task.dueDate)}
                    </span>
                  ) : (
                    <span className="text-[hsl(var(--muted-foreground))]">—</span>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                  No tasks yet. Create your first task!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TaskDetail />
    </div>
  );
}
