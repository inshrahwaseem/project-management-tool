/**
 * Root Layout — App shell with providers, fonts, and SEO meta.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import "@uploadthing/react/styles.css";
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'ProFlow — Project Management',
    template: '%s | ProFlow',
  },
  description:
    'Enterprise-grade project management tool with real-time collaboration, Kanban boards, and team productivity insights.',
  keywords: ['project management', 'kanban', 'task tracking', 'team collaboration'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  var fontSize = localStorage.getItem('fontSize') || 'medium';
                  var sidebar = localStorage.getItem('sidebarPref') || 'default';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.setAttribute('data-font-size', fontSize);
                  document.documentElement.setAttribute('data-sidebar', sidebar);
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
