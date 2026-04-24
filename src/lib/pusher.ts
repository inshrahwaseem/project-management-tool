/**
 * Client-side Pusher — Safe to import in React client components.
 * Uses pusher-js (browser-compatible) only.
 */

import PusherClient from 'pusher-js';

// Client-side Pusher instance for subscribing to channels in React components
// We ensure this is only initialized once and only on the client side
export const getPusherClient = () => {
  if (typeof window === 'undefined') return null;

  // Singleton pattern to avoid multiple connections
  if (!(window as any).__pusherClient) {
    (window as any).__pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      }
    );
  }

  return (window as any).__pusherClient;
};
