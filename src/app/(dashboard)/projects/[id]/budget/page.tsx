'use client';

/**
 * Budget & Expenses Page — Track project spending with categorized expenses.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DollarSign,
  Plus,
  TrendingUp,
  PieChart,
  Loader2,
  X,
  Trash2,
  Receipt,
  Calendar,
  Tag,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  receiptUrl: string | null;
  createdAt: string;
}

interface BudgetData {
  expenses: Expense[];
  totalSpent: number;
  byCategory: Record<string, number>;
}

const CATEGORIES = ['Design', 'Development', 'Marketing', 'Tools', 'Infrastructure', 'Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Design: '#8b5cf6',
  Development: '#3b82f6',
  Marketing: '#f59e0b',
  Tools: '#06b6d4',
  Infrastructure: '#10b981',
  Other: '#6b7280',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function BudgetPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/budget`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Delete this expense?')) return;
    // Optimistic
    setData((prev) =>
      prev
        ? {
            ...prev,
            expenses: prev.expenses.filter((e) => e.id !== expenseId),
            totalSpent: prev.totalSpent - (prev.expenses.find((e) => e.id === expenseId)?.amount || 0),
          }
        : null
    );
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/budget?expenseId=${expenseId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Expense deleted');
        fetchBudget(); // refresh totals
      } else {
        toast.error('Failed to delete');
        fetchBudget();
      }
    } catch {
      toast.error('Failed to delete');
      fetchBudget();
    }
  };

  const maxCategoryAmount = data
    ? Math.max(...Object.values(data.byCategory), 1)
    : 1;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-sm">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Budget & Expenses</h2>
            <p className="text-sm text-muted-foreground">Track project spending</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white gradient-bg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* Summary Cards */}
          <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Total Spent
              </div>
              <p className="mt-1 text-3xl font-bold text-foreground">
                ${data.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="h-4 w-4" />
                Total Expenses
              </div>
              <p className="mt-1 text-3xl font-bold text-blue-500">{data.expenses.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4" />
                Categories Used
              </div>
              <p className="mt-1 text-3xl font-bold text-purple-500">
                {Object.keys(data.byCategory).length}
              </p>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          {Object.keys(data.byCategory).length > 0 && (
            <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                Spending by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(data.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
                          />
                          {category}
                        </span>
                        <span className="font-medium text-foreground">
                          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Expense List */}
          {data.expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No expenses recorded</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start tracking your project spending</p>
            </div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground mb-2">Recent Expenses</h3>
              {data.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/20"
                >
                  {/* Category dot */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[expense.category] || '#6b7280'}15`,
                    }}
                  >
                    <Tag
                      className="h-4 w-4"
                      style={{ color: CATEGORY_COLORS[expense.category] || '#6b7280' }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{expense.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {expense.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(expense.date)}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{expense.currency}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateExpenseModal
            projectId={projectId}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              fetchBudget();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Create Expense Modal ────────────────────────────────────────────────────

function CreateExpenseModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Other',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Expense title is required');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Expense added!');
        onCreated();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Add Expense</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="E.g., AWS Hosting, Figma License"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PKR">PKR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white gradient-bg hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Expense'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
