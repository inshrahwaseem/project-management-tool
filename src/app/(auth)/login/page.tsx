'use client';

/**
 * Login Page — Split-screen layout with animated form.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema } from '@/lib/validators/auth.schema';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ organizations: 0, users: 0, tasks: 0 });


  useEffect(() => {
    fetch('/api/public/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(() => {});

  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        toast.error(response.error);
        setErrors({ email: 'Invalid email or password' });
      } else {
        toast.success('Welcome back!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Illustration Panel */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden w-1/2 flex-col justify-between p-12 lg:flex"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">ProFlow</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Manage projects
            <br />
            with confidence.
          </h1>
          <p className="max-w-md text-lg text-white/80">
            Real-time Kanban boards, team collaboration, and powerful
            insights — all in one beautiful workspace.
          </p>

          {/* Feature pills / Real-time stats */}
          <div className="flex flex-wrap gap-2">
            {[
              `${stats.users > 0 ? stats.users : 'Many'} Active Users`,
              `${stats.organizations > 0 ? stats.organizations : 'Global'} Teams`,
              `${stats.tasks > 0 ? stats.tasks : 'Real-time'} Tasks`,
            ].map(
              (feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                >
                  {feature}
                </span>
              )
            )}
          </div>
        </div>

        <p className="text-sm text-white/50">
          © {new Date().getFullYear()} ProFlow. Built for modern teams.
        </p>
      </motion.div>

      {/* Right — Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2 lg:px-16"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="gradient-text text-xl font-bold">ProFlow</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">
              Welcome back
            </h2>
            <p className="mt-2 text-[hsl(var(--muted-foreground))]">
              Sign in to your account to continue
            </p>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-xl border bg-[hsl(var(--card))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] ${
                  errors.email
                    ? 'border-[hsl(var(--destructive))]'
                    : 'border-[hsl(var(--border))]'
                }`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[hsl(var(--destructive))]">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[hsl(var(--foreground))]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[hsl(var(--primary))] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-[hsl(var(--card))] px-4 py-3 pr-11 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] ${
                    errors.password
                      ? 'border-[hsl(var(--destructive))]'
                      : 'border-[hsl(var(--border))]'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[hsl(var(--destructive))]">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 gradient-bg hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-[hsl(var(--primary))] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
