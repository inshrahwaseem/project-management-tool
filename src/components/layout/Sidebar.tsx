'use client';

/**
 * Sidebar — Collapsible navigation with icons, active route highlighting.
 * Supports compact/default/wide modes.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  Settings,
  ChevronLeft,
  LogOut,
  Palette,
  Zap,
  CalendarDays,
  BarChart3,
  Users,
  Shield,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { getInitials } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: CalendarDays,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
];

const bottomNavItems = [
  {
    label: 'Settings',
    href: '/settings/profile',
    icon: Settings,
  },
  {
    label: 'Security',
    href: '/settings/security',
    icon: Shield,
  },
  {
    label: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarPref } = useTheme();
  const [collapsed, setCollapsed] = useState(sidebarPref === 'compact');

  const isCompact = collapsed || sidebarPref === 'compact';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300',
        'border-sidebar-border bg-sidebar-bg/95 backdrop-blur-xl shadow-sm',
        isCompact ? 'w-[72px]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Desktop Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-bg text-muted-foreground shadow-sm transition-all hover:bg-sidebar-hover hover:text-foreground',
          collapsed && 'rotate-180'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {!isCompact && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-text text-lg font-bold">ProFlow</span>
          </Link>
        )}
        {isCompact && (
          <Link href="/dashboard" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
            <Zap className="h-4 w-4 text-white" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-active text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground',
                isCompact && 'justify-center px-2'
              )}
              title={isCompact ? item.label : undefined}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
              {!isCompact && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border px-3 py-4">
        {bottomNavItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-active text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground',
                isCompact && 'justify-center px-2'
              )}
              title={isCompact ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCompact && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User profile */}
        <div className={cn(
          'mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5',
          isCompact && 'justify-center px-2'
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || ''}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              getInitials(session?.user?.name || 'U')
            )}
          </div>
          {!isCompact && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {session?.user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.email || ''}
              </p>
            </div>
          )}
          {!isCompact && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-hover hover:text-destructive"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
