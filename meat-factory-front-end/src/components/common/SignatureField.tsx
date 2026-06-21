'use client';

import { useState } from 'react';
import { PencilIcon, CheckIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SignaturePad } from '@/components/common/SignaturePad';
import type { UploadFolder } from '@/components/common/PhotoUpload';

type Props = {
  value: string | null;
  onChange: (fileId: string | null) => void;
  label: string;
  type?: UploadFolder;
};

export function SignatureField({
  value,
  onChange,
  label,
  type = 'register',
}: Props) {
  const [open, setOpen] = useState(false);
  const done = !!value;

  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-base transition-colors ${
          done
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-input bg-muted/30 text-muted-foreground hover:bg-muted/60'
        }`}
      >
        {done ? (
          <>
            <CheckIcon className="size-7" />
            Зурсан — дахин зурах
          </>
        ) : (
          <>
            <PencilIcon className="size-7" />
            Зурах
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <SignaturePad
            value={value}
            onChange={(id) => {
              onChange(id);
              // Close once a file id is saved (ignore the null clears).
              if (id) setOpen(false);
            }}
            label={label}
            type={type}
            big
            hideLabel
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
