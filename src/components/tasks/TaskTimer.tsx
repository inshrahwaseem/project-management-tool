'use client';

/**
 * TaskTimer — Live start/stop timer for time tracking on tasks.
 */

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskTimerProps {
  taskId: string;
  taskTitle: string;
}

export function TaskTimer({ taskId, taskTitle }: TaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = () => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  };

  const stopTimer = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const hours = parseFloat((elapsed / 3600).toFixed(2));
    if (hours < 0.01) {
      toast.info('Timer too short to log.');
      setElapsed(0);
      return;
    }

    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours, description: `Timer: ${taskTitle}` }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Logged ${hours}h to "${taskTitle}"`);
      } else {
        toast.error('Failed to log time.');
      }
    } catch {
      toast.error('Failed to log time.');
    }

    setElapsed(0);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRunning ? stopTimer : startTimer}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
          isRunning
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        )}
      >
        {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        {isRunning ? 'Stop' : 'Start Timer'}
      </button>
      {(isRunning || elapsed > 0) && (
        <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(elapsed)}
        </span>
      )}
    </div>
  );
}
