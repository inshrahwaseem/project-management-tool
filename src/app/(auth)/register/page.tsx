'use client';

/**
 * Register Page — Split-screen layout with form validation.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, getProviders } from 'next-auth/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { registerSchema } from '@/lib/validators/auth.schema';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ organizations: 0, users: 0, tasks: 0 });
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    fetch('/api/public/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(() => {});
    // Check if Google provider is configured
    getProviders().then((providers) => {
      if (providers?.google) setHasGoogle(true);
    }).catch(() => {});
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const providers = await getProviders();
      if (!providers?.google) {
        toast.error('Google login is not currently configured.');
        setIsGoogleLoading(false);
        return;
      }
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      toast.error('Failed to initiate Google sign in.');
      setIsGoogleLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(
            Object.fromEntries(
              Object.entries(data.errors).map(([k, v]) => [
                k,
                (v as string[])[0],
              ])
            )
          );
        } else {
          toast.error(data.message || 'Registration failed');
        }
        return;
      }

      toast.success('Account created! Signing you in...');

      // Auto sign in
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicators
  const passwordChecks = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'One number', met: /\d/.test(formData.password) },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left — Form */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2 lg:px-16"
      >
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="gradient-text text-xl font-bold">ProFlow</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">
              Create account
            </h2>
            <p className="mt-2 text-[hsl(var(--muted-foreground))]">
              Get started with your free workspace
            </p>
          </div>

          {/* Google OAuth — only shown when configured */}
          {hasGoogle && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted shadow-sm disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[hsl(var(--border))]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="John Doe"
                className={`w-full rounded-xl border bg-[hsl(var(--card))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] ${errors.name ? 'border-[hsl(var(--destructive))]' : 'border-[hsl(var(--border))]'}`}
                disabled={isLoading}
              />
              {errors.name && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-xl border bg-[hsl(var(--card))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] ${errors.email ? 'border-[hsl(var(--destructive))]' : 'border-[hsl(var(--border))]'}`}
                disabled={isLoading}
              />
              {errors.email && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Create a strong password"
                  className={`w-full rounded-xl border bg-[hsl(var(--card))] px-4 py-3 pr-11 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] ${errors.password ? 'border-[hsl(var(--destructive))]' : 'border-[hsl(var(--border))]'}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.password}</p>}

              {/* Password strength */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5 text-xs">
                      <CheckCircle
                        className={`h-3 w-3 ${check.met ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                      />
                      <span className={check.met ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--muted-foreground))]'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Repeat your password"
                className={`w-full rounded-xl border bg-[hsl(var(--card))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] ${errors.confirmPassword ? 'border-[hsl(var(--destructive))]' : 'border-[hsl(var(--border))]'}`}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 gradient-bg hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[hsl(var(--primary))] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Right — Illustration Panel */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden w-1/2 flex-col items-center justify-center p-12 lg:flex"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--gradient-end)), hsl(var(--gradient-start)))',
        }}
      >
        <div className="max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Start managing like a pro
          </h2>
          <p className="text-lg text-white/80">
            Join other teams using ProFlow to deliver projects on time with clarity and confidence.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.users > 0 ? stats.users : '0'}</div>
              <div className="text-sm text-white/60">Registered Users</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.organizations > 0 ? stats.organizations : '0'}</div>
              <div className="text-sm text-white/60">Active Teams</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.tasks > 0 ? stats.tasks : '0'}</div>
              <div className="text-sm text-white/60">Tasks Created</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
