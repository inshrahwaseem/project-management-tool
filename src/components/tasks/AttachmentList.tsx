'use client';

import { Paperclip, FileIcon, X, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface AttachmentListProps {
  taskId: string;
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export function AttachmentList({ taskId, attachments, onRemove }: AttachmentListProps) {
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/attachments?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        onRemove(id);
        toast.success('Attachment deleted');
      }
    } catch {
      toast.error('Failed to delete attachment');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Paperclip className="h-3 w-3" />
        Attachments ({attachments.length})
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {attachments.map((file) => (
          <div
            key={file.id}
            className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30"
          >
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <div className="rounded bg-primary/5 p-2 text-primary">
                <FileIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={file.fileName}>
                  {file.fileName}
                </p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.fileSize)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="View file"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() => handleDelete(file.id)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Delete"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
