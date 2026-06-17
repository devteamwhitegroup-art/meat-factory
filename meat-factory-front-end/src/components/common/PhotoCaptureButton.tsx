'use client';

import { useRef, useState } from 'react';
import { CameraIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { UploadFolder } from '@/components/common/PhotoUpload';

type Props = {
  value: string | null;
  onChange: (fileId: string | null) => void;
  type?: UploadFolder;
  label?: string;
};

// Big single-purpose button. Tap → opens the back camera on tablets/phones;
// on desktop falls back to the file picker. Uploads one image and stores its
// fileId via onChange. Re-tapping replaces the photo.
export function PhotoCaptureButton({
  value,
  onChange,
  type = 'register',
  label = 'Зураг дарах',
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await fetch('/api/file-upload', { method: 'POST', body: fd });
      const data = (await res.json()) as {
        success: boolean;
        message?: string;
        id?: string;
      };
      if (!data.success || !data.id) {
        throw new Error(data.message ?? 'Хадгалах амжилтгүй');
      }
      onChange(data.id);
      toast.success('Зураг даруулсан');
    } catch (e) {
      onChange(null);
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const done = !!value;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        type="button"
        size="lg"
        variant={done ? 'outline' : 'default'}
        className="h-14 w-full gap-2 text-base"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {done ? <CheckIcon /> : <CameraIcon />}
        {uploading
          ? 'Хадгалж байна…'
          : done
            ? 'Дахин дарах'
            : label}
      </Button>
    </>
  );
}
