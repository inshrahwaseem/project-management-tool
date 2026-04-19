'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn, isOverdue } from '@/lib/utils';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/lib/constants';
import { useTaskStore } from '@/stores/taskStore';
import { TaskDetail } from '@/components/tasks/TaskDetail';

interface CalendarTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  project: { title: string };
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openDetail } = useTaskStore();

  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/v1/tasks/mine?limit=100');
        const data = await res.json();
        if (data.success) {
          // Filter out tasks without a due date
          setTasks(data.data.filter((t: any) => t.dueDate));
        }
      } catch (error) {
        console.error('Failed to fetch calendar tasks', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'MMMM yyyy';
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, day);
    });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-sm">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">Plan your month</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Today
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={prevMonth}
              className="rounded-md p-1.5 transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-32 text-center text-sm font-semibold">
              {format(currentDate, dateFormat)}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-md p-1.5 transition-colors hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid flex-1 grid-cols-7 grid-rows-5 bg-border gap-[1px]">
          {isLoading ? (
            <div className="col-span-7 flex items-center justify-center bg-card">
              <span className="text-muted-foreground">Loading tasks...</span>
            </div>
          ) : (
            days.map((day, i) => {
              const dayTasks = getTasksForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'bg-card p-2 hover:bg-muted/30 transition-colors flex flex-col',
                    !isCurrentMonth && 'bg-muted/10 opacity-50'
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                        isToday
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-foreground hover:bg-muted font-medium'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => openDetail(task as any)}
                        className={cn(
                          "cursor-pointer truncate rounded border-l-2 bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted z-10",
                          isOverdue(task.dueDate) && task.status !== 'DONE' && "border-destructive bg-destructive/10"
                        )}
                        style={{ borderLeftColor: TASK_STATUS_COLORS[task.status] || '#ccc' }}
                        title={`${task.title} - ${task.project.title}`}
                      >
                        <span className="font-medium text-foreground">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <TaskDetail />
    </div>
  );
}
