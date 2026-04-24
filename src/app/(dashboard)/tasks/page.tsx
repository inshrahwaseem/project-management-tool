'use client';

/**
 * My Tasks Page — All tasks assigned to current user across all projects.
 * Fetches real data from /api/v1/tasks/mine with filter support.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckSquare, Calendar, Filter, Loader2, Search } from 'lucide-react';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/lib/constants';
import type { TaskWithRelations } from '@/types';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { useTaskStore } from '@/stores/taskStore';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { openDetail, isDetailOpen } = useTaskStore();

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/v1/tasks/mine?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTasks(data.data);
      } else {
        toast.error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Group tasks by status for a nice display
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const inReviewTasks = tasks.filter((t) => t.status === 'IN_REVIEW');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} assigned to you across all projects`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <CheckSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {statusFilter || priorityFilter || searchQuery ? 'No matching tasks' : 'No tasks assigned'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter || priorityFilter || searchQuery
              ? 'Try adjusting your filters'
              : "When tasks are assigned to you, they'll show up here"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {tasks.map((task, i) => (
            <motion.button
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => openDetail(task)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: TASK_STATUS_COLORS[task.status] }}
                />
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.project?.title || 'Unknown project'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={task.status}
                  onChange={async (e) => {
                    e.stopPropagation();
                    const newStatus = e.target.value;
                    try {
                      await fetch(`/api/v1/tasks/${task.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                      });
                      fetchTasks();
                    } catch {
                      toast.error('Failed to update status');
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary transition-colors"
                  style={{ color: TASK_STATUS_COLORS[task.status] }}
                >
                  {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key} style={{ color: 'initial' }}>{label}</option>
                  ))}
                </select>
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    color: TASK_PRIORITY_COLORS[task.priority],
                    backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}15`,
                  }}
                >
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
                {task.dueDate && (
                  <span className={cn(
                    'text-xs',
                    isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-destructive font-medium' : 'text-muted-foreground'
                  )}>
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      <TaskDetail />
    </div>
  );
}
