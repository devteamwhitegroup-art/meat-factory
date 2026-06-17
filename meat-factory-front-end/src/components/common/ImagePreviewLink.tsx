'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Click "Харах" → opens the image in a modal instead of a new tab. Used on
// the registration detail page (intake photo, weighing photos, byproduct
// photos). The dialog is lazy: the <img> only mounts once the user opens it,
// so closed rows don't fetch the image.
export function ImagePreviewLink({
  url,
  alt,
  label = 'Харах',
  title = 'Зураг',
}: {
  url: string;
  alt?: string;
  label?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </button>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={alt ?? title}
            className="mx-auto max-h-[70vh] w-auto rounded-md object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
