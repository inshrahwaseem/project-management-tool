'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/lib/constants';

interface ReportsData {
  statusData: { name: string; value: number }[];
  priorityData: { name: string; value: number }[];
  workloadData: { name: string; tasks: number }[];
  burndownData: { date: string; completed: number }[];
}

const statusColors: Record<string, string> = {
  TODO: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#f59e0b',
  DONE: '#10b981',
};

const priorityColors: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/v1/dashboard/reports');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Failed to load reports', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-sm">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advanced Reports</h1>
          <p className="text-sm text-muted-foreground">Insights into team velocity and project health.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Velocity/Burndown Chart (last 7 days completed) */}
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Velocity (Completed Last 7 Days)
            </h2>
            <div className="h-[300px] w-full">
              {data?.burndownData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.burndownData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </div>
          </motion.div>

          {/* Workload Bar Chart */}
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              Team Workload (Active Tasks)
            </h2>
            <div className="h-[300px] w-full">
              {data?.workloadData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.workloadData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </div>
          </motion.div>

          {/* Status Distribution Pie Chart */}
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Task Status Distribution
            </h2>
            <div className="h-[300px] w-full">
              {data?.statusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusColors[entry.name] || 'hsl(var(--primary))'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </div>
          </motion.div>

          {/* Priority Distribution Pie Chart */}
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Task Priority Distribution
            </h2>
            <div className="h-[300px] w-full">
              {data?.priorityData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={priorityColors[entry.name] || 'hsl(var(--primary))'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
