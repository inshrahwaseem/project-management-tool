'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Paperclip } from 'lucide-react';

interface FileUploadProps {
  taskId: string;
  onUploadSuccess: (attachment: any) => void;
}

export function FileUpload({ taskId, onUploadSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const file = acceptedFiles[0];

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Math.random()}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (error) throw error;

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // 3. Save metadata to our API
      const res = await fetch(`/api/v1/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onUploadSuccess(json.data);
        toast.success('File uploaded successfully');
      } else {
        throw new Error(json.message);
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload file. Ensure Supabase credentials are set.');
    } finally {
      setIsUploading(false);
    }
  }, [taskId, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2 text-center text-sm text-muted-foreground">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium text-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Click or drag file to upload
              </p>
              <p className="text-xs">Max file size: 5MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
