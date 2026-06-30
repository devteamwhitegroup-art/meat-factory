"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Edit one weighing entry's weight + negotiated ₮/kg. Fully controlled by the
// parent (which owns validation + the save mutation); this is just the modal.
export function WeighEntryDialog({
  open,
  seq,
  weight,
  price,
  onWeightChange,
  onPriceChange,
  onSave,
  onClose,
  busy,
}: {
  open: boolean;
  seq: number | undefined;
  weight: string;
  price: string;
  onWeightChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Жин засах — #{seq}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Жин (кг)</label>
            <Input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => onWeightChange(e.target.value)}
              className="h-12 text-lg"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">
              Үнэ / кг (₮)
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Болих
          </Button>
          <Button type="button" onClick={onSave} disabled={busy}>
            Хадгалах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
