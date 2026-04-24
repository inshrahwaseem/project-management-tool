'use client';

/**
 * Profile Settings — Edit name, view email, account info.
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Mail, Shield, Loader2, Save } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { UploadButton } from '@/lib/uploadthing';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        await update({ name });
        toast.success('Profile updated');
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Profile Settings</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Manage your account information
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-2xl font-bold text-white shrink-0">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            getInitials(session?.user?.name || 'U')
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[hsl(var(--foreground))]">
            {session?.user?.name || 'User'}
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
            {session?.user?.email}
          </p>
          <div className="flex items-center gap-2">
            <UploadButton
              endpoint="taskAttachment"
              onClientUploadComplete={(res) => {
                toast.success('Upload complete! URL: ' + res[0].url);
                console.log('Files: ', res);
              }}
              onUploadError={(error: Error) => {
                toast.error(`ERROR! ${error.message}`);
              }}
              className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:h-8 ut-button:text-xs ut-button:px-4 ut-allowed-content:hidden"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
            <User className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[hsl(var(--primary))]"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
            <Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Email
          </label>
          <input
            type="email"
            value={session?.user?.email || ''}
            disabled
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))]"
          />
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
            <Shield className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Role
          </label>
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))]">
            User
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white gradient-bg hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
