'use client';

/**
 * Security Settings — 2FA Setup with QR Code.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch('/api/auth/two-factor');
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(data.data.enabled);
        if (!data.data.enabled && data.data.qrCode) {
          setQrCode(data.data.qrCode);
          setSecret(data.data.secret);
        }
      }
    } catch {
      toast.error('Failed to load 2FA status');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetup() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/two-factor');
      const data = await res.json();
      if (data.success && !data.data.enabled) {
        setQrCode(data.data.qrCode);
        setSecret(data.data.secret);
      }
    } catch {
      toast.error('Failed to start 2FA setup');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify() {
    if (verifyCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/two-factor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('2FA enabled successfully!');
        setIs2FAEnabled(true);
        setQrCode(null);
        setSecret(null);
      } else {
        toast.error(data.message || 'Invalid code. Try again.');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
      setVerifyCode('');
    }
  }

  async function handleDisable() {
    try {
      const res = await fetch('/api/auth/two-factor', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('2FA disabled');
        setIs2FAEnabled(false);
      }
    } catch {
      toast.error('Failed to disable');
    }
  }

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-sm">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security</h1>
          <p className="text-sm text-muted-foreground">Manage two-factor authentication</p>
        </div>
      </div>

      {/* 2FA Status */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {is2FAEnabled ? (
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            ) : (
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold text-foreground">Two-Factor Authentication</h3>
              <p className="text-xs text-muted-foreground">
                {is2FAEnabled ? 'Your account is protected with 2FA.' : 'Add an extra layer of security.'}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-bold',
              is2FAEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
            )}
          >
            {is2FAEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* QR Code Setup */}
        {!is2FAEnabled && qrCode && (
          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-3">
                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            </div>

            {/* Manual Secret */}
            {secret && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <code className="flex-1 text-xs font-mono text-foreground break-all">{secret}</code>
                <button onClick={copySecret} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}

            {/* Verify Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Enter 6-digit code from app:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-center text-lg font-mono tracking-[0.3em] outline-none focus:border-primary"
                />
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || verifyCode.length !== 6}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enable/Disable Buttons */}
        {!is2FAEnabled && !qrCode && (
          <button
            onClick={handleSetup}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Set Up 2FA
          </button>
        )}

        {is2FAEnabled && (
          <button
            onClick={handleDisable}
            className="w-full rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Disable 2FA
          </button>
        )}
      </div>
    </motion.div>
  );
}
