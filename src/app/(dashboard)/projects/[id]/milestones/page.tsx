'use client';

/**
 * Milestones Page — Track key project checkpoints with progress indicators.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Flag,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  Target,
  TrendingUp,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function MilestonesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/milestones`);
      const data = await res.json();
      if (data.success) setMilestones(data.data);
    } catch {
      toast.error('Failed to load milestones');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const toggleStatus = async (milestone: Milestone) => {
    const newStatus = milestone.status === 'OPEN' ? 'COMPLETED' : 'OPEN';
    // Optimistic update
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestone.id ? { ...m, status: newStatus } : m))
    );
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId: milestone.id, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error('Failed to update milestone');
        fetchMilestones();
      } else {
        toast.success(newStatus === 'COMPLETED' ? 'Milestone completed! 🎉' : 'Milestone reopened');
      }
    } catch {
      toast.error('Failed to update');
      fetchMilestones();
    }
  };

  const completedCount = milestones.filter((m) => m.status === 'COMPLETED').length;
  const totalCount = milestones.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-sm">
            <Flag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Milestones</h2>
            <p className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} completed
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white gradient-bg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Milestone
        </button>
      </motion.div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Overall Progress
            </span>
            <span className="font-bold text-foreground">{progressPct}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && milestones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No milestones yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create milestones to track key project checkpoints
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white gradient-bg"
          >
            <Plus className="h-4 w-4" />
            Create Milestone
          </button>
        </div>
      )}

      {/* Milestones Timeline */}
      {!isLoading && milestones.length > 0 && (
        <motion.div variants={itemVariants} className="relative space-y-0">
          {/* Vertical timeline line */}
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border" />

          {milestones.map((milestone, index) => {
            const isCompleted = milestone.status === 'COMPLETED';
            const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && !isCompleted;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex gap-4 pb-6"
              >
                {/* Timeline dot */}
                <button
                  onClick={() => toggleStatus(milestone)}
                  className={cn(
                    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : isOverdue
                      ? 'border-red-500 bg-card text-red-500 hover:bg-red-500/10'
                      : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
                  )}
                  title={isCompleted ? 'Mark as open' : 'Mark as completed'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                {/* Content card */}
                <div
                  className={cn(
                    'flex-1 rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md',
                    isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : isOverdue
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-border hover:border-primary/20'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3
                        className={cn(
                          'font-semibold',
                          isCompleted ? 'text-emerald-600 line-through' : 'text-foreground'
                        )}
                      >
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : isOverdue
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Open'}
                    </span>
                  </div>

                  {milestone.dueDate && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due {formatDate(milestone.dueDate)}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateMilestoneModal
            projectId={projectId}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              fetchMilestones();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Create Milestone Modal ──────────────────────────────────────────────────

function CreateMilestoneModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Milestone title is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          dueDate: form.dueDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Milestone created!');
        onCreated();
      } else {
        toast.error(data.message || 'Failed to create milestone');
      }
    } catch {
      toast.error('Failed to create milestone');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">New Milestone</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="E.g., MVP Launch, Beta Release"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does this milestone represent?"
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white gradient-bg hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
