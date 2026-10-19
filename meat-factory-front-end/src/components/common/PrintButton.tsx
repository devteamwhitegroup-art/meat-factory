"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/common/ListState";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EnqueuePrintDoc, PreviewReceiptDoc } from "@/lib/queries/print";
import { SettingsDoc } from "@/lib/queries/settings";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { useFactories } from "@/lib/factory/FactoriesProvider";

// Staff's factory (client cookie set at login); absent for admin.
function readFactory(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)mf_factory=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Admin's device remembers the last printer it picked.
const LAST_PRINTER_KEY = "mf_last_printer";
function readLastPrinter(): string | null {
  try {
    return localStorage.getItem(LAST_PRINTER_KEY);
  } catch {
    return null;
  }
}

type PrintJobType =
  | "SALES_RECEIPT"
  | "SHIPMENT_SLIP"
  | "SETTLEMENT_RECEIPT"
  | "WEIGH_SLIP";

// Opens a dialog showing an image of the exact receipt, then queues it for
// the thermal printer on confirm. No browser print dialog.
export function PrintButton({
  type,
  id,
  label = "Хэвлэх",
}: {
  type: PrintJobType;
  id: string;
  label?: string;
}) {
  const { nameOf } = useFactories();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [factory, setFactory] = useState<string | null>(null);
  const [enqueue] = useMutation(EnqueuePrintDoc);
  const { data: settingsData } = useQuery(SettingsDoc, {
    skip: !open,
    fetchPolicy: "cache-and-network",
  });
  // Staff: only their factory's printer. Admin: every factory's.
  const printers = compact(settingsData?.settings?.settings?.printers).filter(
    (p) => !factory || p.factory === factory,
  );
  // Picked (or remembered) printer if it still exists, else the first one.
  const printerId =
    printers.find((p) => p.id === picked)?.id ?? printers[0]?.id ?? null;
  const { data, loading, error } = useQuery(PreviewReceiptDoc, {
    variables: { type, id },
    skip: !open,
    fetchPolicy: "network-only",
  });

  const preview = data?.previewReceipt;
  const image = preview?.image ?? null;
  const previewErr =
    error?.message ??
    (preview && !preview.success ? (preview.message ?? "Алдаа") : null);

  async function confirm() {
    if (!printerId) return;
    setBusy(true);
    const ok = await runMutation(
      async () =>
        (await enqueue({ variables: { type, id, printerKey: printerId } })).data
          ?.enqueuePrint,
      { success: "Хэвлэхээр илгээлээ" },
    );
    setBusy(false);
    if (ok) {
      try {
        localStorage.setItem(LAST_PRINTER_KEY, printerId);
      } catch {}
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setPicked(readLastPrinter());
          setFactory(readFactory());
          setOpen(true);
        }}
        className="gap-2"
      >
        <PrinterIcon className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Хэвлэхээ шалгах</DialogTitle>
          </DialogHeader>

          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : previewErr ? (
            <ErrorNotice message={previewErr} />
          ) : image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt="Хэвлэх урьдчилан харах"
              className="max-h-[60vh] w-full self-center overflow-auto rounded-md border bg-white object-contain p-2"
            />
          ) : null}

          {settingsData && printers.length === 0 ? (
            <p className="text-sm text-destructive">
              {factory
                ? `${nameOf(factory)}-д принтер тохируулаагүй байна — админд хандана уу.`
                : "Принтер тохируулаагүй байна — Тохиргоо хэсэгт нэмнэ үү."}
            </p>
          ) : printers.length > 1 ? (
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Принтер"
            >
              {printers.map((p) => (
                <Button
                  key={p.id}
                  role="radio"
                  aria-checked={p.id === printerId}
                  variant={p.id === printerId ? "default" : "outline"}
                  onClick={() => setPicked(p.id ?? null)}
                  className="h-11 flex-1 gap-2"
                >
                  <PrinterIcon className="size-4" />
                  {nameOf(p.factory)}
                </Button>
              ))}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Цуцлах
            </Button>
            <Button
              onClick={confirm}
              disabled={busy || !image || !printerId}
              className="gap-2"
            >
              <PrinterIcon className="size-4" />
              {busy ? "..." : "Хэвлэх"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
