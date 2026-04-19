/**
 * API Response Helpers
 * Ensures all endpoints return a consistent JSON shape:
 * { success: boolean, data?: T, message: string, pagination?: PaginationMeta }
 */

import { NextResponse } from 'next/server';
import type { PaginationMeta } from '@/types';

interface SuccessResponseOptions<T> {
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
  status?: number;
}

interface ErrorResponseOptions {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Return a success JSON response with consistent shape.
 */
export function successResponse<T>(options: SuccessResponseOptions<T>) {
  const { data, message = 'Success', pagination, status = 200 } = options;

  return NextResponse.json(
    {
      success: true,
      data,
      message,
      ...(pagination && { pagination }),
    },
    { status }
  );
}

/**
 * Return an error JSON response with consistent shape.
 */
export function errorResponse(options: ErrorResponseOptions) {
  const { message, status = 500, errors } = options;

  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors && { errors }),
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const apiErrors = {
  unauthorized: () =>
    errorResponse({ message: 'Unauthorized', status: 401 }),

  forbidden: (message = 'Forbidden') =>
    errorResponse({ message, status: 403 }),

  notFound: (resource = 'Resource') =>
    errorResponse({ message: `${resource} not found`, status: 404 }),

  validationError: (errors: Record<string, string[]>) =>
    errorResponse({ message: 'Validation failed', status: 400, errors }),

  conflict: (message = 'Resource already exists') =>
    errorResponse({ message, status: 409 }),

  rateLimited: () =>
    errorResponse({ message: 'Too many requests. Please try again later.', status: 429 }),

  internal: (message = 'An unexpected error occurred') =>
    errorResponse({ message, status: 500 }),
};
