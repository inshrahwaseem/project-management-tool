'use client';

/**
 * GlobalSearch — Command palette style search modal (Ctrl+K / ⌘K).
 * Searches across projects, tasks, and comments.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  ArrowRight,
  Loader2,
  Command,
} from 'lucide-react';
import { cn, debounce } from '@/lib/utils';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  const searchFn = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&limit=15`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchFn(query);
  }, [query, searchFn]);

  // Navigate results with keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].link);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
          >
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search projects, tasks, comments..."
                className="flex-1 bg-transparent text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              />
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" />}
              <kbd className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs font-mono text-[hsl(var(--muted-foreground))]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && query.length >= 2 && !isLoading && (
                <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No results found for &quot;{query}&quot;
                </div>
              )}

              {results.length === 0 && query.length < 2 && (
                <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  <Command className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  Type to search across your workspace
                </div>
              )}

              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    router.push(result.link);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    index === selectedIndex
                      ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                  )}
                >
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {getIcon(result.type)}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[hsl(var(--muted-foreground))]">
                    {result.type}
                  </span>
                  <ArrowRight className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
