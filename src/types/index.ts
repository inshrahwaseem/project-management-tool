// ─── Type Definitions for Project Management Tool ────────────────────────────
// All types are derived from the Prisma schema. No `any` types allowed.

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_MENTION = 'COMMENT_MENTION',
  DUE_DATE_REMINDER = 'DUE_DATE_REMINDER',
  MEMBER_INVITED = 'MEMBER_INVITED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

// ─── Base Entity ─────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User extends BaseEntity {
  name: string;
  email: string;
  emailVerified?: Date | string | null;
  image?: string | null;
  role: UserRole;
  themePreference: string;
  fontSizePref: string;
  sidebarPref: string;
}

export interface UserWithRelations extends User {
  ownedProjects?: Project[];
  projectMembers?: ProjectMember[];
}

// ─── Organization ────────────────────────────────────────────────────────────

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  ownerId: string;
  owner?: User;
  projects?: Project[];
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project extends BaseEntity {
  title: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  orgId: string;
  ownerId: string;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  workflowConfig?: Record<string, unknown> | null;
}

export interface ProjectWithRelations extends Project {
  owner?: User;
  organization?: Organization;
  tasks?: Task[];
  members?: ProjectMemberWithUser[];
  tags?: Tag[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface ProjectStats {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  inReviewCount: number;
  doneCount: number;
  completionPercentage: number;
  overdueCount: number;
  totalHoursEstimated: number;
  totalHoursActual: number;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export interface Task extends BaseEntity {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string | null;
  reporterId: string;
  dueDate?: Date | string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  position: number;
  customFields?: Record<string, unknown> | null;
}

export interface TaskWithRelations extends Task {
  project?: Project;
  assignee?: User | null;
  reporter?: User;
  comments?: CommentWithAuthor[];
  attachments?: Attachment[];
  tags?: TaskTagWithTag[];
  timeEntries?: TimeEntry[];
  activityLogs?: ActivityLog[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface Comment extends BaseEntity {
  content: string;
  taskId: string;
  authorId: string;
}

export interface CommentWithAuthor extends Comment {
  author: User;
}

// ─── Attachment ──────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  taskId: string;
  uploadedBy: string;
  createdAt: Date | string;
  uploader?: User;
}

// ─── ActivityLog ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, unknown> | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date | string;
  user?: User;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  userId: string;
  read: boolean;
  link?: string | null;
  createdAt: Date | string;
}

// ─── ProjectMember ───────────────────────────────────────────────────────────

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date | string;
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: User;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface TaskTag {
  id: string;
  taskId: string;
  tagId: string;
}

export interface TaskTagWithTag extends TaskTag {
  tag: Tag;
}

// ─── TimeEntry ───────────────────────────────────────────────────────────────

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description?: string | null;
  loggedAt: Date | string;
  user?: User;
}

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  cursor?: string | null;
  hasMore: boolean;
  pageSize: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  orgId?: string;
}

// ─── UI Types ────────────────────────────────────────────────────────────────

export interface ThemeConfig {
  id: string;
  name: string;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
  };
}

export type ViewMode = 'grid' | 'list';
export type BoardView = 'board' | 'list' | 'timeline';

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskWithRelations[];
}

// ─── Search Types ────────────────────────────────────────────────────────────

export interface SearchResult {
  type: 'project' | 'task' | 'comment';
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

// ─── Export Types ────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'pdf';
