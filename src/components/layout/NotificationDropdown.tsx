'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Clock, UserPlus, AlertCircle, MessageSquare } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.read).length);
      }
    } catch {
      // Background poll failure is silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await fetch(`/api/v1/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      });
    } catch {
      toast.error('Failed to update notification');
      fetchNotifications();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED': return <AlertCircle className="text-primary h-4 w-4" />;
      case 'COMMENT_ADDED': return <MessageSquare className="text-indigo-500 h-4 w-4" />;
      case 'MEMBER_INVITED': return <UserPlus className="text-emerald-500 h-4 w-4" />;
      default: return <Clock className="text-slate-500 h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card p-0 shadow-xl glass-card z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
              <span className="font-semibold text-sm">Notifications</span>
              <button 
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all read
              </button>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No new notifications</div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif.id);
                        if (notif.link) {
                          window.location.href = notif.link;
                        }
                      }}
                      className={cn(
                        "flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                        !notif.read ? "bg-primary/5" : ""
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        !notif.read ? "bg-primary/20" : "bg-muted"
                      )}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          "text-sm leading-snug",
                          !notif.read ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(notif.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
