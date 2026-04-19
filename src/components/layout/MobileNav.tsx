'use client';

/**
 * MobileNav — Bottom navigation bar for mobile viewports.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  Settings,
} from 'lucide-react';

const mobileNavItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Alerts', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings/profile', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] px-2 py-2 backdrop-blur-md lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
              isActive
                ? 'text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))]'
            )}
          >
            <item.icon className={cn('h-5 w-5', isActive && 'text-[hsl(var(--primary))]')} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
