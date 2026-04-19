/**
 * Task Validators — Zod schemas for task CRUD
 */

import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(500, 'Title must be less than 500 characters')
    .trim(),
  description: z
    .string()
    .max(10000, 'Description must be less than 10000 characters')
    .optional()
    .nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).max(9999).optional().nullable(),
  tags: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
      position: z.number().int().min(0),
    })
  ),
});

export const taskFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be less than 5000 characters')
    .trim(),
});

export const createTimeEntrySchema = z.object({
  hours: z.number().min(0.1, 'Minimum 0.1 hours').max(24, 'Maximum 24 hours per entry'),
  description: z.string().max(500).optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
