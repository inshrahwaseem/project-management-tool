'use client';

/**
 * Team Workload — Visual capacity planning view showing task distribution per member.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkloadEntry {
  user: { id: string; name: string; email: string; image: string | null };
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  total: number;
  overdue: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const avatarColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}

function getCapacityLabel(total: number) {
  if (total >= 10) return { label: 'Overloaded', color: 'text-red-500 bg-red-500/10' };
  if (total >= 6) return { label: 'High', color: 'text-amber-500 bg-amber-500/10' };
  if (total >= 3) return { label: 'Moderate', color: 'text-blue-500 bg-blue-500/10' };
  return { label: 'Light', color: 'text-emerald-500 bg-emerald-500/10' };
}

export default function TeamWorkloadPage() {
  const [data, setData] = useState<WorkloadEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkload() {
      try {
        const res = await fetch('/api/v1/team/workload');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error('Failed to load workload', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWorkload();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Workload</h1>
            <p className="text-sm text-muted-foreground">Capacity planning across all your projects</p>
          </div>
        </div>
        <div>
          <a
            href="/team"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            Team Directory
          </a>
        </div>
      </motion.div>

      {/* Stats Summary */}
      {!isLoading && data.length > 0 && (
        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{data.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Active Tasks</p>
            <p className="mt-1 text-3xl font-bold text-blue-500">{data.reduce((s, d) => s + d.total - d.done, 0)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Overdue</p>
            <p className="mt-1 text-3xl font-bold text-red-500">{data.reduce((s, d) => s + d.overdue, 0)}</p>
          </div>
        </motion.div>
      )}

      {/* Workload Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No team members found.</p>
          <p className="text-xs text-muted-foreground mt-1">Join or create projects to see your team here.</p>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {data.map((entry) => {
            const capacity = getCapacityLabel(entry.total - entry.done);
            const completionPct = entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0;

            return (
              <div
                key={entry.user.id}
                className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: getColor(entry.user.name) }}
                  >
                    {entry.user.image ? (
                      <img src={entry.user.image} alt={entry.user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      entry.user.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{entry.user.name}</h3>
                      <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase', capacity.color)}>
                        {capacity.label}
                      </span>
                      {entry.overdue > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                          <AlertTriangle className="h-3 w-3" />
                          {entry.overdue} overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                  </div>

                  {/* Completion */}
                  <div className="text-right hidden sm:block">
                    <p className="text-lg font-bold text-foreground">{completionPct}%</p>
                    <p className="text-[10px] text-muted-foreground">completed</p>
                  </div>
                </div>

                {/* Task Bars */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 flex gap-1 h-3 rounded-full overflow-hidden bg-muted/50">
                    {entry.done > 0 && (
                      <div className="bg-emerald-500 transition-all" style={{ width: `${(entry.done / Math.max(entry.total, 1)) * 100}%` }} title={`Done: ${entry.done}`} />
                    )}
                    {entry.inReview > 0 && (
                      <div className="bg-purple-500 transition-all" style={{ width: `${(entry.inReview / Math.max(entry.total, 1)) * 100}%` }} title={`In Review: ${entry.inReview}`} />
                    )}
                    {entry.inProgress > 0 && (
                      <div className="bg-blue-500 transition-all" style={{ width: `${(entry.inProgress / Math.max(entry.total, 1)) * 100}%` }} title={`In Progress: ${entry.inProgress}`} />
                    )}
                    {entry.todo > 0 && (
                      <div className="bg-gray-400 transition-all" style={{ width: `${(entry.todo / Math.max(entry.total, 1)) * 100}%` }} title={`To Do: ${entry.todo}`} />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{entry.total} tasks</span>
                </div>

                {/* Legend */}
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Done {entry.done}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Review {entry.inReview}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Progress {entry.inProgress}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400" /> To Do {entry.todo}</span>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
