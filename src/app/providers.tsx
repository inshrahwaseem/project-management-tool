'use client';

/**
 * Providers — Wraps the app with SessionProvider, ThemeProvider, and Toaster.
 */

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className:
              'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]',
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
