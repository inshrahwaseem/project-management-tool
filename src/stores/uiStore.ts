/**
 * UI Store — Global UI state management.
 * Controls modals, search visibility, and sidebar state.
 */

import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  isCreateProjectOpen: boolean;
  isCreateTaskOpen: boolean;
  isShortcutsOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setCreateProjectOpen: (open: boolean) => void;
  setCreateTaskOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isSearchOpen: false,
  isCreateProjectOpen: false,
  isCreateTaskOpen: false,
  isShortcutsOpen: false,

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),

  setCreateProjectOpen: (isCreateProjectOpen) => set({ isCreateProjectOpen }),

  setCreateTaskOpen: (isCreateTaskOpen) => set({ isCreateTaskOpen }),

  setShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
}));
