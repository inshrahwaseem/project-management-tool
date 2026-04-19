'use client';

/**
 * Projects List Page — Grid/List view with search, filters, and quick create.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  FolderKanban,
  Calendar,
  Users,
  MoreHorizontal,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { cn, formatDate, getInitials, calcCompletionPercent } from '@/lib/utils';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '@/lib/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ProjectsPage() {
  const {
    projects,
    setProjects,
    viewMode,
    setViewMode,
    isLoading,
    setLoading,
    removeProject,
  } = useProjectStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/v1/projects?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProjects(data.data);
      }
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, setProjects, setLoading]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    // Optimistic update
    removeProject(id);
    try {
      const res = await fetch(`/api/v1/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        toast.error('Failed to delete project');
        fetchProjects(); // Rollback
      } else {
        toast.success('Project deleted');
      }
    } catch {
      toast.error('Failed to delete project');
      fetchProjects();
    }
  };

  // Filtered projects
  const filteredProjects = projects;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Projects</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all gradient-bg hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2 pl-9 pr-4 text-sm text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))]"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
              showFilters
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex flex-wrap gap-2"
        >
          {['', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === status
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.8)]'
              )}
            >
              {status ? PROJECT_STATUS_LABELS[status] : 'All'}
            </button>
          ))}
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className={cn('grid gap-4', viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : '')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
            <FolderKanban className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">No projects yet</h3>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Create your first project to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white gradient-bg"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      )}

      {/* Project Grid */}
      {!isLoading && filteredProjects.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={cn(
            'grid gap-4',
            viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : ''
          )}
        >
          {filteredProjects.map((project) => {
            const taskCount = project._count?.tasks || 0;
            const memberCount = project._count?.members || 0;
            const doneCount = 0; // Will be computed from real data
            const completion = calcCompletionPercent(doneCount, taskCount);

            return (
              <motion.div key={project.id} variants={itemVariants}>
                <Link href={`/projects/${project.id}/board`}>
                  <div className="group relative overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-all duration-300 hover:border-[hsl(var(--primary)/0.3)] hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.05)]">
                    {/* Priority accent line */}
                    <div
                      className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
                      style={{ backgroundColor: TASK_PRIORITY_COLORS[project.priority] || '#6366f1' }}
                    />

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>

                      {/* Menu */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[hsl(var(--muted))]"
                      >
                        <MoreHorizontal className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      </button>
                    </div>

                    {/* Status badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{
                          color: PROJECT_STATUS_COLORS[project.status],
                          backgroundColor: `${PROJECT_STATUS_COLORS[project.status]}15`,
                        }}
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                        <span>{completion}% complete</span>
                        <span>{taskCount} tasks</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] transition-all duration-500"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between">
                      {/* Member avatars */}
                      <div className="flex -space-x-2">
                        {project.members?.slice(0, 3).map((member) => (
                          <div
                            key={member.id}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[hsl(var(--card))] bg-[hsl(var(--primary))] text-[10px] font-bold text-white"
                            title={member.user.name}
                          >
                            {member.user.image ? (
                              <img src={member.user.image} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              getInitials(member.user.name)
                            )}
                          </div>
                        ))}
                        {memberCount > 3 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[hsl(var(--card))] bg-[hsl(var(--muted))] text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                            +{memberCount - 3}
                          </div>
                        )}
                      </div>

                      {/* Due date */}
                      {project.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}

// ─── Create Project Modal ────────────────────────────────────────────────────

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    dueDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrors({ title: 'Project title is required' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Project created!');
        onCreated();
      } else {
        toast.error(data.message || 'Failed to create project');
      }
    } catch {
      toast.error('Failed to create project');
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
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Create Project</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Set up a new project for your team
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.g., Website Redesign"
              className={cn(
                'w-full rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)]',
                errors.title ? 'border-[hsl(var(--destructive))]' : 'border-[hsl(var(--border))] focus:border-[hsl(var(--primary))]'
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project goals..."
              rows={3}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
              Template (Jira-inspired)
            </label>
            <select
              value={(formData as any).template || ''}
              onChange={(e) => setFormData({ ...formData, template: e.target.value } as any)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
            >
              <option value="">Blank Project</option>
              <option value="AGILE">Agile / Scrum Software Development</option>
              <option value="BUG_TRACKING">Bug & Issue Tracking</option>
              <option value="MARKETING">Marketing Campaign</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white gradient-bg hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
