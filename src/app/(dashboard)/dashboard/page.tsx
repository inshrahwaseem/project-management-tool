'use client';

/**
 * Dashboard Home Page — Real-time overview with stats, activity feed, and task widgets.
 * All data is fetched from the database — zero hardcoded values.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Plus,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DashboardChart } from '@/components/dashboard/DashboardChart';

// Types for API responses
interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  tasksDueToday: number;
  highPriorityDueToday: number;
  completedThisWeek: number;
  overdueTasks: number;
  tasksCreatedThisWeek: number;
  sprintProgress: number;
}

interface ActivityEntry {
  id: string;
  user: string;
  userImage: string | null;
  userId: string;
  action: string;
  target: string;
  detail: string;
  icon: string;
  time: string;
}

interface MyTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; title: string } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Avatar color palette for users without images
const avatarColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#ef4444'];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, activityRes, tasksRes] = await Promise.all([
          fetch('/api/v1/dashboard/stats'),
          fetch('/api/v1/dashboard/activity'),
          fetch('/api/v1/tasks/mine?limit=5'),
        ]);

        const [statsData, activityData, tasksData] = await Promise.all([
          statsRes.json(),
          activityRes.json(),
          tasksRes.json(),
        ]);

        if (statsData.success) setStats(statsData.data);
        if (activityData.success) setActivities(activityData.data);
        if (tasksData.success) setMyTasks(tasksData.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const firstName = session?.user?.name?.split(' ')[0] || 'User';

  // Build stat cards from real data
  const statCards = stats
    ? [
        {
          label: 'Total Projects',
          value: stats.totalProjects.toString(),
          change: `${stats.activeProjects} active`,
          icon: FolderKanban,
          bgColor: 'bg-indigo-500/10',
          textColor: 'text-indigo-500',
        },
        {
          label: 'Tasks Due Today',
          value: stats.tasksDueToday.toString(),
          change: stats.highPriorityDueToday > 0 ? `${stats.highPriorityDueToday} high priority` : 'All clear',
          icon: Clock,
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-500',
        },
        {
          label: 'Completed This Week',
          value: stats.completedThisWeek.toString(),
          change: `of ${stats.tasksCreatedThisWeek} created`,
          icon: CheckSquare,
          bgColor: 'bg-emerald-500/10',
          textColor: 'text-emerald-500',
        },
        {
          label: 'Overdue Tasks',
          value: stats.overdueTasks.toString(),
          change: stats.overdueTasks > 0 ? 'Needs attention' : 'On track!',
          icon: AlertTriangle,
          bgColor: 'bg-rose-500/10',
          textColor: 'text-rose-500',
        },
      ]
    : [];

  // Format due date for display
  function formatDueDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    if (date < today) return 'Overdue';
    if (date < tomorrow) return 'Today';
    const nextDay = new Date(tomorrow.getTime() + 86400000);
    if (date < nextDay) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 gradient-bg">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-2 max-w-xl text-white/80">
              {stats ? (
                <>
                  You have <span className="font-semibold text-white">{stats.tasksDueToday} task{stats.tasksDueToday !== 1 ? 's' : ''}</span> due today and{' '}
                  <span className="font-semibold text-white">{stats.activeProjects} project{stats.activeProjects !== 1 ? 's' : ''}</span> in progress.
                  {stats.overdueTasks > 0
                    ? ` ${stats.overdueTasks} overdue — let's catch up!`
                    : " Let's keep going!"}
                </>
              ) : (
                'Loading your workspace...'
              )}
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/projects"
                className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                View Projects
              </Link>
              <Link
                href="/tasks"
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                My Tasks
              </Link>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 right-20 h-24 w-24 rounded-full bg-white/5" />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 skeleton rounded-xl" />
            ))
          : statCards.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className={`mt-1 text-xs ${stat.textColor}`}>{stat.change}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight className="h-12 w-12 text-primary/10" />
                </div>
              </div>
            ))}
      </motion.div>

      {/* Analytics Chart */}
      <motion.div variants={itemVariants}>
        <DashboardChart />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Activity Feed */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 skeleton rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 skeleton rounded w-3/4" />
                    <div className="h-3 skeleton rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">Actions will appear here as you work</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: getAvatarColor(activity.user) }}
                  >
                    {activity.userImage ? (
                      <img
                        src={activity.userImage}
                        alt={activity.user}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      activity.user?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="text-foreground">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>{' '}
                      {activity.target && <span className="font-medium">{activity.target}</span>}{' '}
                      {activity.detail && (
                        <span className="text-muted-foreground">{activity.detail}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* My Tasks Widget */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-5 lg:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CheckSquare className="h-5 w-5 text-primary" />
              My Tasks
            </h2>
            <Link
              href="/tasks"
              className="text-xs font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-xl" />
              ))}
            </div>
          ) : myTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No tasks assigned to you</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks will appear here when assigned</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map((task) => {
                const dueLabel = formatDueDate(task.dueDate);
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.priority === 'URGENT'
                            ? 'bg-red-500'
                            : task.priority === 'HIGH'
                              ? 'bg-orange-500'
                              : task.priority === 'MEDIUM'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.project?.title || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          task.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/10 text-blue-500'
                            : task.status === 'DONE'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : task.status === 'IN_REVIEW'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-gray-500/10 text-gray-500'
                        }`}
                      >
                        {task.status === 'IN_PROGRESS' ? 'In Progress' : task.status === 'IN_REVIEW' ? 'In Review' : task.status === 'DONE' ? 'Done' : 'To Do'}
                      </span>
                      {dueLabel && (
                        <span className={cn('text-xs', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                          {dueLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Team Performance — Real Data */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-border bg-card p-5"
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          Team Performance
        </h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-lg" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Sprint Progress</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-foreground">{stats.sprintProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${stats.sprintProgress}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Tasks Completed vs Created</p>
              <div className="mt-2 flex items-end gap-4">
                <div>
                  <span className="text-2xl font-bold text-emerald-500">{stats.completedThisWeek}</span>
                  <span className="ml-1 text-xs text-muted-foreground">completed</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">{stats.tasksCreatedThisWeek}</span>
                  <span className="ml-1 text-xs text-muted-foreground">created</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Projects Overview</p>
              <div className="mt-2 flex items-end gap-4">
                <div>
                  <span className="text-2xl font-bold text-foreground">{stats.totalProjects}</span>
                  <span className="ml-1 text-xs text-muted-foreground">total</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-indigo-500">{stats.activeProjects}</span>
                  <span className="ml-1 text-xs text-muted-foreground">active</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
