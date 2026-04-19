/**
 * Project Validators — Zod schemas for project CRUD
 */

import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  template: z.enum(['AGILE', 'MARKETING', 'BUG_TRACKING']).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectFilterSchema = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
