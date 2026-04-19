'use client';

/**
 * Dashboard Layout — Side navigation + topbar shell for authenticated pages.
 */

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { TaskDetail } from '@/components/tasks/TaskDetail';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 z-40 lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-[var(--sidebar-width)]">
        <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 overflow-auto p-4 pb-20 sm:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global search (Ctrl+K) */}
      <GlobalSearch />

      {/* Task detail slide-over */}
      <TaskDetail />
    </div>
  );
}
