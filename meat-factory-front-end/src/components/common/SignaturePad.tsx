'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { UploadFolder } from '@/components/common/PhotoUpload';

type Props = {
  value: string | null;
  onChange: (fileId: string | null) => void;
  type?: UploadFolder;
  label?: string;
  big?: boolean;
  hideLabel?: boolean;
};

export function SignaturePad({
  value,
  onChange,
  type = 'register',
  label = 'Гарын үсэг',
  big = false,
  hideLabel = false,
}: Props) {
  const WIDTH = big ? 760 : 480;
  const HEIGHT = big ? 340 : 180;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111111';
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    dirty.current = true;
    if (saved) {
      setSaved(false);
      onChange(null);
    }
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
    setSaved(false);
    onChange(null);
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!dirty.current) {
      toast.error('Эхлээд зурна уу');
      return;
    }
    setUploading(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (!blob) throw new Error('Зураг үүсгэж чадсангүй');
      const file = new File([blob], `signature-${Date.now()}.png`, {
        type: 'image/png',
      });
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
        toast.error(data.message ?? 'Хадгалах амжилтгүй');
        onChange(null);
        setSaved(false);
      } else {
        onChange(data.id);
        setSaved(true);
        toast.success('Хадгаллаа');
      }
    } catch (e) {
      toast.error((e as Error).message);
      onChange(null);
      setSaved(false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {hideLabel ? null : <div className="text-sm font-medium">{label}</div>}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className={`w-full touch-none rounded-lg border bg-white ${big ? '' : 'max-w-md'}`}
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={save}
          disabled={uploading}
        >
          {uploading
            ? 'Хадгалж байна…'
            : value && saved
              ? 'Дахин хадгалах'
              : 'Хадгалах'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={uploading}
        >
          Цэвэрлэх
        </Button>
        {value && saved ? (
          <span className="text-xs text-muted-foreground">Хадгалсан ✓</span>
        ) : null}
      </div>
    </div>
  );
}
