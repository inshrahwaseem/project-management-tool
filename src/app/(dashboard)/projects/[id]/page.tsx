/**
 * Project Detail — Redirects to board view by default.
 */

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/projects/${id}/board`);
}
