/**
 * Constants — No magic strings. All enum values, messages, and config in one place.
 */

// ─── Task Status Labels ─────────────────────────────────────────────────────

export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
} as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#f59e0b',
  DONE: '#10b981',
};

// ─── Task Priority ──────────────────────────────────────────────────────────

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

// ─── Project Status ─────────────────────────────────────────────────────────

export const PROJECT_STATUS = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: '#8b5cf6',
  ACTIVE: '#10b981',
  ON_HOLD: '#f59e0b',
  COMPLETED: '#06b6d4',
  ARCHIVED: '#6b7280',
};

// ─── Member Roles ───────────────────────────────────────────────────────────

export const MEMBER_ROLE = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;

export const MEMBER_ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

// ─── Kanban Columns ─────────────────────────────────────────────────────────

export const KANBAN_COLUMNS = [
  { id: 'TODO', title: 'To Do', color: '#6b7280' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
  { id: 'IN_REVIEW', title: 'In Review', color: '#f59e0b' },
  { id: 'DONE', title: 'Done', color: '#10b981' },
] as const;

// ─── API Messages ───────────────────────────────────────────────────────────

export const API_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Logged in successfully',
  REGISTER_SUCCESS: 'Account created successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  ACCOUNT_LOCKED: 'Account temporarily locked. Try again later.',
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',

  // CRUD
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',

  // Server
  INTERNAL_ERROR: 'An unexpected error occurred',
  RATE_LIMITED: 'Too many requests. Please try again later.',
} as const;

// ─── Pagination ─────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── File Upload ────────────────────────────────────────────────────────────

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Themes ─────────────────────────────────────────────────────────────────

export const THEMES = [
  {
    id: 'light',
    name: 'Light',
    label: 'Clean & Bright',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    label: 'Deep Dark',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#0f0f14',
      foreground: '#f8fafc',
      muted: '#1e1e2e',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    label: 'Ocean Depths',
    colors: {
      primary: '#60a5fa',
      secondary: '#818cf8',
      accent: '#34d399',
      background: '#0c1222',
      foreground: '#e2e8f0',
      muted: '#162032',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    label: 'Warm Sepia',
    colors: {
      primary: '#b58900',
      secondary: '#cb4b16',
      accent: '#2aa198',
      background: '#002b36',
      foreground: '#fdf6e3',
      muted: '#073642',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    label: 'Arctic Blues',
    colors: {
      primary: '#88c0d0',
      secondary: '#81a1c1',
      accent: '#a3be8c',
      background: '#2e3440',
      foreground: '#eceff4',
      muted: '#3b4252',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    label: 'Purple Night',
    colors: {
      primary: '#bd93f9',
      secondary: '#ff79c6',
      accent: '#50fa7b',
      background: '#282a36',
      foreground: '#f8f8f2',
      muted: '#44475a',
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    label: 'Neon City',
    colors: {
      primary: '#7aa2f7',
      secondary: '#bb9af7',
      accent: '#9ece6a',
      background: '#1a1b26',
      foreground: '#c0caf5',
      muted: '#24283b',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    label: 'Accessibility',
    colors: {
      primary: '#ffff00',
      secondary: '#00ffff',
      accent: '#ff6600',
      background: '#000000',
      foreground: '#ffffff',
      muted: '#1a1a1a',
    },
  },
] as const;

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

export const KEYBOARD_SHORTCUTS = [
  { key: 'c', description: 'Create new task', scope: 'global' },
  { key: 'mod+k', description: 'Global search', scope: 'global' },
  { key: 'f', description: 'Toggle filters', scope: 'board' },
  { key: '?', description: 'Show keyboard shortcuts', scope: 'global' },
  { key: 'Escape', description: 'Close modal/panel', scope: 'global' },
  { key: '1', description: 'Switch to Board view', scope: 'project' },
  { key: '2', description: 'Switch to List view', scope: 'project' },
  { key: '3', description: 'Switch to Timeline view', scope: 'project' },
] as const;
