'use client';

/**
 * Notifications Page — Grouped notifications with mark-as-read.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/v1/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group by time
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = {
    today: notifications.filter((n) => {
      const d = new Date(n.createdAt);
      return d.toDateString() === today.toDateString();
    }),
    yesterday: notifications.filter((n) => {
      const d = new Date(n.createdAt);
      return d.toDateString() === yesterday.toDateString();
    }),
    older: notifications.filter((n) => {
      const d = new Date(n.createdAt);
      return d < yesterday && d.toDateString() !== yesterday.toDateString();
    }),
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl p-4 transition-colors',
        notification.read
          ? 'bg-transparent'
          : 'bg-[hsl(var(--primary)/0.05)] border border-[hsl(var(--primary)/0.1)]'
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          notification.read
            ? 'bg-[hsl(var(--muted))]'
            : 'bg-[hsl(var(--primary)/0.15)]'
        )}
      >
        <Bell
          className={cn(
            'h-4 w-4',
            notification.read
              ? 'text-[hsl(var(--muted-foreground))]'
              : 'text-[hsl(var(--primary))]'
          )}
        />
      </div>

      <div className="flex-1">
        <p className={cn(
          'text-sm',
          notification.read
            ? 'text-[hsl(var(--muted-foreground))]'
            : 'font-medium text-[hsl(var(--foreground))]'
        )}>
          {notification.message}
        </p>
        <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {notification.link && (
        <Link
          href={notification.link}
          className="shrink-0 rounded-md p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Notifications</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.1)]"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
            <Bell className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">No notifications</h3>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            You&apos;re all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.today.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))]">Today</h3>
              <div className="space-y-1">
                {groups.today.map((n) => <NotificationItem key={n.id} notification={n} />)}
              </div>
            </div>
          )}

          {groups.yesterday.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))]">Yesterday</h3>
              <div className="space-y-1">
                {groups.yesterday.map((n) => <NotificationItem key={n.id} notification={n} />)}
              </div>
            </div>
          )}

          {groups.older.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))]">This Week</h3>
              <div className="space-y-1">
                {groups.older.map((n) => <NotificationItem key={n.id} notification={n} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
