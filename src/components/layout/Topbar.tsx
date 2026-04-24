'use client';

/**
 * Topbar — Page breadcrumbs, global search trigger, notification bell, theme toggle.
 */

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Palette,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme, themes } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Generate breadcrumb from pathname
  const breadcrumbs = pathname
    ?.split('/')
    .filter(Boolean)
    .map((segment, index, arr) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      isLast: index === arr.length - 1,
    }));

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      {/* Left: Menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {breadcrumbs?.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-muted-foreground">/</span>
              )}
              <span
                className={cn(
                  crumb.isLast
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Search + Notifications + Theme */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          id="global-search-trigger"
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-muted"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
            );
          }}
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-xs font-mono md:inline border border-border/50">
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <NotificationDropdown />

        {/* Theme Controls */}
        <div className="flex items-center gap-1">
          {/* Quick Toggle (Sun/Moon) */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Advanced Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              title="More themes"
            >
              <Palette className="h-5 w-5" />
            </button>
            
            {isThemeOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsThemeOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl glass-card z-50">
                  <div className="mb-1.5 border-b border-border px-2 pb-1.5 pt-1 text-xs font-semibold text-muted-foreground">
                    Select Theme
                  </div>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setIsThemeOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        theme === t.id 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span>{t.name}</span>
                      <div className="flex gap-0.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.colors.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
