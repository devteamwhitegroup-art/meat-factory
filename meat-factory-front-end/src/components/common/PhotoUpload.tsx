'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export type UploadFolder =
  | 'register'
  | 'herd'
  | 'scale'
  | 'byproduct'
  | 'verify'
  | 'settlement'
  | 'shipment'
  | 'staff'
  | 'other';

type Props = {
  value: string | null;
  onChange: (fileId: string | null) => void;
  type?: UploadFolder;
  label?: string;
  // When set, tablet/phone browsers open the camera directly instead of the
  // file picker. 'environment' = back camera, 'user' = front. Desktop ignores.
  capture?: 'environment' | 'user';
};

export function PhotoUpload({
  value,
  onChange,
  type = 'other',
  label = 'Зураг оруулах',
  capture,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await fetch('/api/file-upload', {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as {
        success: boolean;
        message?: string;
        id?: string;
      };
      if (!data.success || !data.id) {
        toast.error(data.message ?? 'Зураг ачаалах амжилтгүй');
        onChange(null);
      } else {
        onChange(data.id);
        toast.success('Зураг ачааллаа');
      }
    } catch {
      toast.error('Сүлжээний алдаа');
      onChange(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-3">
        <Input
          type="file"
          accept="image/jpeg,image/png,image/gif,video/mp4"
          {...(capture ? { capture } : {})}
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="max-w-sm"
        />
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="preview"
            className="h-16 w-16 rounded-md border object-cover"
          />
        ) : null}
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
              setPreviewUrl(null);
            }}
          >
            Арилгах
          </Button>
        ) : null}
      </div>
      {uploading ? (
        <div className="text-xs text-muted-foreground">Ачаалж байна…</div>
      ) : null}
    </div>
  );
}
