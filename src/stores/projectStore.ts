/**
 * Project Store — Zustand state management for projects.
 * Optimistic updates with rollback on error.
 */

import { create } from 'zustand';
import type { ProjectWithRelations, ProjectStatus, ProjectPriority } from '@/types';

interface ProjectFilters {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  search?: string;
}

interface ProjectState {
  projects: ProjectWithRelations[];
  selectedProject: ProjectWithRelations | null;
  filters: ProjectFilters;
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';

  // Actions
  setProjects: (projects: ProjectWithRelations[]) => void;
  addProject: (project: ProjectWithRelations) => void;
  updateProject: (id: string, updates: Partial<ProjectWithRelations>) => void;
  removeProject: (id: string) => void;
  setSelectedProject: (project: ProjectWithRelations | null) => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  filters: {},
  isLoading: false,
  error: null,
  viewMode: 'grid',

  setProjects: (projects) => set({ projects }),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      selectedProject:
        state.selectedProject?.id === id
          ? { ...state.selectedProject, ...updates }
          : state.selectedProject,
    })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProject:
        state.selectedProject?.id === id ? null : state.selectedProject,
    })),

  setSelectedProject: (project) => set({ selectedProject: project }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: {} }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setViewMode: (viewMode) => set({ viewMode }),
}));
