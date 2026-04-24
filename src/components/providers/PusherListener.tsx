'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusher';
import { toast } from 'sonner'; // Assuming sonner is used for toasts, standard in modern Next.js apps

export function PusherListener() {
  const { data: session } = useSession();

  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    // We subscribe to a channel unique to the user
    const channel = pusher.subscribe(`user-${userId}`);

    // Listen for 'notification' events
    channel.bind('notification', (data: { title: string; message: string; type?: string }) => {
      // Trigger a real-time toast notification
      if (data.type === 'SUCCESS') {
        toast.success(data.title, { description: data.message });
      } else if (data.type === 'ERROR') {
        toast.error(data.title, { description: data.message });
      } else {
        toast(data.title, { description: data.message });
      }
    });

    return () => {
      pusher.unsubscribe(`user-${userId}`);
    };
  }, [session?.user]);

  return null; // This component doesn't render anything, it just listens
}
