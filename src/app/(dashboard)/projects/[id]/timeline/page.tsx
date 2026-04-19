'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, differenceInDays } from 'date-fns';
import { Clock, Plus, Loader2 } from 'lucide-react';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/lib/constants';
import type { TaskWithRelations } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import { TaskDetail } from '@/components/tasks/TaskDetail';

export default function TimelinePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { openDetail } = useTaskStore();
  
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/tasks?limit=100`);
        const data = await res.json();
        if (data.success) {
          // Sort earliest start date first
          const sorted = (data.data.tasks as any[]).sort((a: any, b: any) => {
            const dateA = new Date(a.startDate || a.createdAt).getTime();
            const dateB = new Date(b.startDate || b.createdAt).getTime();
            return dateA - dateB;
          });
          setTasks(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (projectId) fetchTasks();
  }, [projectId]);

  // Generate timeline grid headers (next 30 days)
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  const timelineDays = Array.from({ length: 30 }).map((_, i) => addDays(startDate, i));

  // Helper to calculate left position and width of a task bar
  const getTaskStyle = (task: TaskWithRelations) => {
    const taskStart = new Date((task as any).startDate || task.createdAt);
    const taskEnd = task.dueDate ? new Date(task.dueDate) : addDays(taskStart, 3); // default 3 days length
    
    // Calculate difference from timeline start
    const startOffset = differenceInDays(taskStart, startDate);
    const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
    
    // Each day column is 48px wide
    const left = startOffset * 48;
    const width = duration * 48;
    
    return {
      left: `${left}px`,
      width: `${width}px`,
      display: startOffset + duration < 0 || startOffset > 30 ? 'none' : 'flex'
    };
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timeline</h1>
          <p className="text-sm text-muted-foreground">Visual Gantt chart of your project tasks</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto rounded-xl border border-border bg-card shadow-sm custom-scrollbar relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Clock className="mb-2 h-8 w-8 opacity-50" />
            <p>No tasks found on this timeline</p>
          </div>
        ) : (
          <div className="min-w-max pb-10">
            {/* Timeline Header (Days) */}
            <div className="flex border-b border-border bg-muted/30 sticky top-0 z-20">
              <div className="w-[300px] shrink-0 border-r border-border p-3 font-semibold text-sm sticky left-0 bg-card z-30">
                Task Name
              </div>
              <div className="flex">
                {timelineDays.map((day, i) => (
                  <div key={i} className="flex w-[48px] shrink-0 flex-col items-center justify-center border-r border-border/50 py-2">
                    <span className="text-[10px] text-muted-foreground uppercase">{format(day, 'E')}</span>
                    <span className={`text-sm font-medium mt-0.5 ${format(day, 'MM-dd') === format(today, 'MM-dd') ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Rows inside a relative container */}
            <div className="relative">
              {/* Background vertical grid lines */}
              <div className="absolute top-0 bottom-0 left-[300px] flex pointer-events-none opacity-20">
                {timelineDays.map((_, i) => (
                  <div key={i} className="w-[48px] shrink-0 border-r border-border h-full"></div>
                ))}
              </div>
              
              {/* Task Rows */}
              {tasks.map((task) => (
                <div key={task.id} className="flex border-b border-border/50 hover:bg-muted/10 group relative z-10 transition-colors">
                  {/* Task Info Column */}
                  <div className="w-[300px] shrink-0 flex items-center gap-3 border-r border-border p-3 sticky left-0 bg-card z-20 group-hover:bg-muted/10">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: TASK_STATUS_COLORS[task.status] || '#ccc' }} />
                    <span className="truncate text-sm font-medium cursor-pointer hover:underline" onClick={() => openDetail(task)}>
                      {task.title}
                    </span>
                  </div>
                  
                  {/* Gantt Bar Area */}
                  <div className="relative flex-1 min-h-[44px] py-1">
                    <div 
                      className="absolute top-1.5 bottom-1.5 rounded-md shadow-md border border-black/10 flex flex-col justify-center px-3 cursor-pointer transition-all hover:scale-[1.02] hover:z-20 overflow-hidden"
                      style={{ 
                        ...getTaskStyle(task),
                        backgroundColor: TASK_PRIORITY_COLORS[task.priority] || 'hsl(var(--primary))' 
                      }}
                      onClick={() => openDetail(task)}
                    >
                      {/* Progress Fill Overlay */}
                      <div 
                        className="absolute inset-0 bg-black/20 pointer-events-none"
                        style={{ width: `${task.status === 'DONE' ? 100 : task.status === 'IN_REVIEW' ? 75 : task.status === 'IN_PROGRESS' ? 40 : 0}%` }}
                      />
                      
                      <div className="relative z-10 flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-white truncate drop-shadow-md">
                          {task.title}
                        </span>
                        <span className="text-[8px] font-medium text-white/80 uppercase">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <TaskDetail />
    </div>
  );
}
