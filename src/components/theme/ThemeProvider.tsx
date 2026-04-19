'use client';

/**
 * ThemeProvider — Manages theme, font-size, and sidebar preferences.
 * Reads from user DB preference, applies to DOM, no flicker on load.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { THEMES } from '@/lib/constants';

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  sidebarPref: string;
  setSidebarPref: (pref: string) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  defaultFontSize?: string;
  defaultSidebarPref?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  defaultFontSize = 'medium',
  defaultSidebarPref = 'default',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState(defaultTheme);
  const [fontSize, setFontSizeState] = useState(defaultFontSize);
  const [sidebarPref, setSidebarPrefState] = useState(defaultSidebarPref);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Apply sidebar pref
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-sidebar', sidebarPref);
    localStorage.setItem('sidebarPref', sidebarPref);
  }, [sidebarPref]);

  // On mount, read from localStorage (avoids flicker)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');
    const savedSidebar = localStorage.getItem('sidebarPref');

    if (savedTheme) setThemeState(savedTheme);
    if (savedFontSize) setFontSizeState(savedFontSize);
    if (savedSidebar) setSidebarPrefState(savedSidebar);
  }, []);

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme);
    // Persist to DB via API (fire and forget)
    fetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themePreference: newTheme }),
    }).catch(() => {
      // Silent fail — localStorage is the primary store
    });
  }, []);

  const setFontSize = useCallback((size: string) => {
    setFontSizeState(size);
    fetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fontSizePref: size }),
    }).catch(() => {});
  }, []);

  const setSidebarPref = useCallback((pref: string) => {
    setSidebarPrefState(pref);
    fetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidebarPref: pref }),
    }).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        sidebarPref,
        setSidebarPref,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
