'use client';

/**
 * Appearance Settings — VS Code-style theme picker with font/sidebar preferences.
 */

import { motion } from 'framer-motion';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Palette, Type, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppearancePage() {
  const { fontSize, setFontSize, sidebarPref, setSidebarPref } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Appearance</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Customize the look and feel of your workspace
        </p>
      </div>

      {/* Theme Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-[hsl(var(--primary))]" />
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Theme</h2>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Choose a theme that suits your style. Changes are applied instantly.
        </p>
        <ThemeSwitcher />
      </section>

      {/* Font Size Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-[hsl(var(--primary))]" />
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Font Size</h2>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Adjust the text size for better readability
        </p>
        <div className="flex gap-3">
          {[
            { id: 'small', label: 'Small', size: '14px' },
            { id: 'medium', label: 'Medium', size: '16px' },
            { id: 'large', label: 'Large', size: '18px' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFontSize(option.id)}
              className={cn(
                'flex-1 rounded-xl border p-4 text-center transition-all',
                fontSize === option.id
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-sm'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.3)]'
              )}
            >
              <span
                className="block font-semibold text-[hsl(var(--foreground))]"
                style={{ fontSize: option.size }}
              >
                Aa
              </span>
              <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Sidebar Width Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <PanelLeft className="h-5 w-5 text-[hsl(var(--primary))]" />
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Sidebar</h2>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Control the sidebar width preference
        </p>
        <div className="flex gap-3">
          {[
            { id: 'compact', label: 'Compact', desc: 'Icons only', width: '72px' },
            { id: 'default', label: 'Default', desc: 'Icons + labels', width: '260px' },
            { id: 'wide', label: 'Wide', desc: 'Expanded view', width: '320px' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSidebarPref(option.id)}
              className={cn(
                'flex-1 rounded-xl border p-4 text-center transition-all',
                sidebarPref === option.id
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-sm'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.3)]'
              )}
            >
              <div className="mx-auto mb-2 flex h-8 items-end gap-0.5">
                <div
                  className="rounded-sm bg-[hsl(var(--primary)/0.3)]"
                  style={{
                    width: option.id === 'compact' ? '8px' : option.id === 'wide' ? '24px' : '16px',
                    height: '32px',
                  }}
                />
                <div className="h-8 flex-1 rounded-sm bg-[hsl(var(--muted))]" />
              </div>
              <span className="block text-sm font-semibold text-[hsl(var(--foreground))]">
                {option.label}
              </span>
              <span className="block text-xs text-[hsl(var(--muted-foreground))]">
                {option.desc}
              </span>
            </button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
