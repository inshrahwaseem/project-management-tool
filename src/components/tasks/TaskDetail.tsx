'use client';

/**
 * Task Detail — Slide-over panel with full task information.
 * Includes inline editing, comments, attachments, time tracking, and activity.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn, formatDate, formatRelativeTime, getInitials } from '@/lib/utils';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from '@/lib/constants';
import {
  X,
  Calendar,
  User,
  Tag,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { FileUpload } from './FileUpload';
import { AttachmentList } from './AttachmentList';
import type { TaskWithRelations, CommentWithAuthor } from '@/types';

export function TaskDetail() {
  const { selectedTask, isDetailOpen, closeDetail, updateTask } = useTaskStore();
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'time'>('comments');

  // Fetch full task detail when opened
  useEffect(() => {
    if (selectedTask && isDetailOpen) {
      setIsLoading(true);
      fetch(`/api/v1/tasks/${selectedTask.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setTask(data.data);
        })
        .catch(() => toast.error('Failed to load task'))
        .finally(() => setIsLoading(false));
    }
  }, [selectedTask, isDetailOpen]);

  // Update task field
  const handleUpdate = async (field: string, value: unknown) => {
    if (!task) return;

    const oldValue = task[field as keyof TaskWithRelations];
    // Optimistic
    setTask({ ...task, [field]: value } as TaskWithRelations);

    try {
      const res = await fetch(`/api/v1/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.success) {
        updateTask(task.id, { [field]: value } as Partial<TaskWithRelations>);
        toast.success('Task updated');
      } else {
        setTask({ ...task, [field]: oldValue } as TaskWithRelations);
      }
    } catch {
      setTask({ ...task, [field]: oldValue } as TaskWithRelations);
      toast.error('Failed to update');
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!comment.trim() || !task) return;
    setIsSendingComment(true);
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });
      const data = await res.json();
      if (data.success) {
        setTask({
          ...task,
          comments: [...(task.comments || []), data.data],
        } as TaskWithRelations);
        setComment('');
        toast.success('Comment added');
      }
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsSendingComment(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetail]);

  return (
    <AnimatePresence>
      {isDetailOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeDetail}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Task Detail
              </h2>
              <button
                onClick={closeDetail}
                className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex-1 space-y-4 p-6">
                <div className="h-8 w-3/4 skeleton rounded" />
                <div className="h-20 skeleton rounded-xl" />
                <div className="h-10 skeleton rounded" />
                <div className="h-10 skeleton rounded" />
              </div>
            ) : task ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Title (inline editable) */}
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) =>
                      setTask({ ...task, title: e.target.value } as TaskWithRelations)
                    }
                    onBlur={(e) => handleUpdate('title', e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-[hsl(var(--foreground))] outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] rounded px-1"
                  />

                  {/* Status & Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        Status
                      </label>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdate('status', e.target.value)}
                        className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none"
                        style={{
                          color: TASK_STATUS_COLORS[task.status],
                        }}
                      >
                        {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        Priority
                      </label>
                      <select
                        value={task.priority}
                        onChange={(e) => handleUpdate('priority', e.target.value)}
                        className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        style={{
                          color: TASK_PRIORITY_COLORS[task.priority],
                          fontWeight: '600',
                        }}
                      >
                        {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                          <option 
                            key={key} 
                            value={key}
                            style={{ color: TASK_PRIORITY_COLORS[key as keyof typeof TASK_PRIORITY_COLORS], fontWeight: 'normal' }}
                          >
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        Description
                      </label>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/v1/ai/suggest-subtasks`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title: task.title, description: task.description })
                            });
                            const json = await res.json();
                            if (json.success) {
                              const subTasks = json.data.map((t: string) => `- [ ] ${t}`).join('\n');
                              handleUpdate('description', (task.description ? task.description + '\n\n' : '') + '**AI Suggested Subtasks:**\n' + subTasks);
                            }
                          } catch (err) {
                            console.error('AI Suggestion failed:', err);
                          }
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Breakdown
                      </button>
                    </div>
                    <textarea
                      value={task.description || ''}
                      onChange={(e) =>
                        setTask({ ...task, description: e.target.value } as TaskWithRelations)
                      }
                      onBlur={(e) => handleUpdate('description', e.target.value)}
                      placeholder="Add a description..."
                      rows={4}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--primary))]"
                    />
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-4">
                    <AttachmentList 
                      taskId={task.id} 
                      attachments={task.attachments || []} 
                      onRemove={(id) => {
                        setTask(prev => prev ? {
                          ...prev,
                          attachments: prev.attachments?.filter(a => a.id !== id)
                        } : null);
                      }}
                    />
                    <FileUpload 
                      taskId={task.id} 
                      onUploadSuccess={(newAttachment) => {
                        setTask(prev => prev ? {
                          ...prev,
                          attachments: [...(prev.attachments || []), newAttachment]
                        } : null);
                      }}
                    />
                  </div>

                  {/* Custom Fields */}
                  <div className="pt-6 border-t border-[hsl(var(--border))]">
                    <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-4">
                      Custom Fields
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries((task as any).customFields || {}).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 rounded-lg border border-[hsl(var(--border))] bg-muted/20 p-2">
                          <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] capitalize">{key}</span>
                          <div className="flex items-center justify-between">
                            <input 
                              type="text" 
                              value={String(value)}
                              onChange={(e) => {
                                const newFields = { ...(task as any).customFields, [key]: e.target.value };
                                handleUpdate('customFields', newFields);
                              }}
                              className="bg-transparent text-sm font-medium outline-none text-foreground w-full"
                            />
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const name = prompt('Field Name:');
                          if (name) {
                            const newFields = { ...(task as any).customFields, [name]: 'Value' };
                            handleUpdate('customFields', newFields);
                          }
                        }}
                        className="flex h-[45px] items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))] px-3 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Field
                      </button>
                    </div>
                  </div>

                  {/* Meta fields */}
                  <div className="space-y-3">
                    {/* Assignee */}
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-xs text-[hsl(var(--muted-foreground))] w-20">Assignee</span>
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-white">
                              {getInitials(task.assignee.name)}
                            </div>
                            <span className="text-sm text-[hsl(var(--foreground))]">
                              {task.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-[hsl(var(--muted-foreground))]">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-xs text-[hsl(var(--muted-foreground))] w-20">Due Date</span>
                      <input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) =>
                          handleUpdate('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)
                        }
                        className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1 text-sm outline-none"
                      />
                    </div>

                    {/* Estimated Hours */}
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-xs text-[hsl(var(--muted-foreground))] w-20">Estimate</span>
                      <input
                        type="number"
                        value={task.estimatedHours || ''}
                        onChange={(e) =>
                          handleUpdate('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)
                        }
                        placeholder="hours"
                        className="w-20 rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1 text-sm outline-none"
                      />
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">hours</span>
                    </div>

                    {/* Reporter */}
                    {task.reporter && (
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-xs text-[hsl(var(--muted-foreground))] w-20">Reporter</span>
                        <span className="text-sm text-[hsl(var(--foreground))]">
                          {task.reporter.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tabs: Comments / Activity / Time */}
                  <div className="border-t border-[hsl(var(--border))] pt-4">
                    <div className="flex gap-4 border-b border-[hsl(var(--border))]">
                      {(['comments', 'activity', 'time'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            'pb-2 text-sm font-medium transition-colors',
                            activeTab === tab
                              ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                          )}
                        >
                          {tab === 'comments' && `Comments (${task.comments?.length || 0})`}
                          {tab === 'activity' && 'Activity'}
                          {tab === 'time' && `Time (${task.timeEntries?.length || 0})`}
                        </button>
                      ))}
                    </div>

                    {/* Comments Tab */}
                    {activeTab === 'comments' && (
                      <div className="mt-4 space-y-4">
                        {task.comments?.map((c: CommentWithAuthor) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-white">
                              {getInitials(c.author?.name || 'U')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                  {c.author?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {formatRelativeTime(c.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[hsl(var(--foreground))]">
                                {c.content}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Comment input */}
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                            Y
                          </div>
                          <div className="flex-1 flex items-end gap-2">
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Write a comment..."
                              rows={2}
                              className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--primary))]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment();
                                }
                              }}
                            />
                            <button
                              onClick={handleAddComment}
                              disabled={!comment.trim() || isSendingComment}
                              className="rounded-lg p-2 text-white gradient-bg disabled:opacity-50"
                            >
                              {isSendingComment ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                       <div className="mt-4 space-y-4">
                         {task.activityLogs?.map((log) => (
                           <div key={log.id} className="relative flex gap-3 pb-4">
                             {/* Connector Line */}
                             <div className="absolute left-4 top-8 -bottom-4 w-px bg-border group-last:hidden" />
                             
                             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                               {log.user ? getInitials(log.user.name) : 'A'}
                             </div>
                             
                             <div className="flex-1">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm font-semibold text-foreground">
                                   {log.user?.name || 'System'}
                                 </span>
                                 <span className="text-xs text-muted-foreground">
                                   {formatRelativeTime(log.createdAt)}
                                 </span>
                               </div>
                               
                               <div className="mt-1 text-sm text-muted-foreground">
                                 {log.action === 'task.created' && 'created this task'}
                                 {log.action === 'task.updated' && (
                                   <div className="space-y-1">
                                     <p>updated the task</p>
                                     <div className="flex flex-wrap gap-2 mt-1">
                                       {log.newValue && Object.entries(log.newValue as any).map(([key, val]) => (
                                          <span key={key} className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px]">
                                            <span className="capitalize mr-1">{key}:</span>
                                            <span className="text-foreground font-medium">{String(val)}</span>
                                          </span>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                                 {log.action === 'comment.created' && 'added a comment'}
                               </div>
                             </div>
                           </div>
                         ))}
                         {(!task.activityLogs || task.activityLogs.length === 0) && (
                           <div className="py-8 text-center text-sm text-muted-foreground">
                             No activity recorded yet
                           </div>
                         )}
                       </div>
                    )}

                    {/* Time Tab */}
                    {activeTab === 'time' && (
                      <div className="mt-4 space-y-3">
                        {task.timeEntries?.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted)/0.3)] p-3">
                            <div>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                {entry.hours}h
                              </p>
                              {entry.description && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {entry.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {entry.user?.name}
                              </p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {formatDate(entry.loggedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(!task.timeEntries || task.timeEntries.length === 0) && (
                          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                            No time entries yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
