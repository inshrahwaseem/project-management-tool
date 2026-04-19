'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application Error caught by Boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center backdrop-blur-sm">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
      </div>
      <h2 className="mb-3 text-2xl font-bold tracking-tight text-white">Oops! Something went wrong</h2>
      <p className="mb-8 max-w-sm text-sm text-slate-400">
        We encountered an unexpected issue while loading this view. Our engineering team has been notified.
        {error.digest && <span className="block mt-2 text-xs text-slate-600">Error ID: {error.digest}</span>}
      </p>
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <button 
          onClick={() => reset()} 
          className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 min-w-[140px]"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </button>
        <button 
          onClick={() => router.push('/dashboard')} 
          className="flex items-center justify-center rounded-md border border-slate-800 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 min-w-[140px]"
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </button>
      </div>
    </div>
  );
}
