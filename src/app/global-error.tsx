'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 p-4 text-center">
          <AlertCircle className="h-16 w-16 text-rose-500 mb-6" />
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Something went fundamentally wrong</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            A critical error occurred at the root level of the application. 
            {error.digest && <span className="block mt-2 text-xs text-slate-500">Error ID: {error.digest}</span>}
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => reset()} 
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Try again
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Return to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
