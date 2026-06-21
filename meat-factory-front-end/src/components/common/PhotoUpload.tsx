'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useFileUpload, type UploadFolder } from '@/lib/hooks/useFileUpload';

export type { UploadFolder };

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
  const { upload, uploading } = useFileUpload(type);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    try {
      onChange(await upload(file));
      toast.success('Зураг ачааллаа');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Сүлжээний алдаа');
      onChange(null);
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
