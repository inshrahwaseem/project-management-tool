/**
 * Common Validators — Shared Zod schemas
 */

import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  type: z.enum(['all', 'project', 'task', 'comment']).default('all'),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
