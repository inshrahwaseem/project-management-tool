'use client';

/**
 * ThemeSwitcher — VS Code-style theme picker with preview dots.
 */

import { useTheme } from '@/components/theme/ThemeProvider';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {themes.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            id={`theme-${t.id}`}
            onClick={() => setTheme(t.id)}
            className={cn(
              'group relative flex flex-col items-start gap-2 rounded-xl border p-4 transition-all duration-200',
              'hover:border-[hsl(var(--primary))] hover:shadow-lg',
              isActive
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-md'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
            )}
          >
            {/* Active badge */}
            {isActive && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                <Check className="h-3 w-3" />
              </span>
            )}

            {/* Color palette preview dots */}
            <div className="flex items-center gap-1.5">
              <span
                className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: t.colors.background }}
              />
              <span
                className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: t.colors.primary }}
              />
              <span
                className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: t.colors.secondary }}
              />
              <span
                className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: t.colors.accent }}
              />
            </div>

            {/* Theme name & label */}
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {t.name}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {t.label}
              </span>
            </div>

            {/* Icon */}
            <Palette className="absolute right-3 bottom-3 h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        );
      })}
    </div>
  );
}
