"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import {
  AddSettlementPaymentProofDoc,
  RemoveSettlementPaymentProofDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { fmtDateTime } from "@/lib/format/date";

// ─── Settlement payment proofs (money-flow statements) ───────────────
//
// Bank-receipt images for each payout (initial partial payment + released
// held). Mirrors ShipmentPhotoGallery: upload → addSettlementPaymentProof →
// refetch. An optional note labels which payment each image covers. Ordered
// by sequenceNo. The add control is gated behind a payout existing.
export type PaymentProofRow = {
  id: string;
  sequenceNo: number;
  note: string | null;
  createdAt: string | null;
  url: string | null;
  createdBy: string | null;
};

export function PaymentProofGallery({
  registrationId,
  proofs,
  canAdd,
  onChanged,
}: {
  registrationId: string;
  proofs: PaymentProofRow[];
  canAdd: boolean;
  onChanged: () => void;
}) {
  const [uploadValue, setUploadValue] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [add] = useMutation(AddSettlementPaymentProofDoc);
  const [remove] = useMutation(RemoveSettlementPaymentProofDoc);

  const ordered = useMemo(
    () => [...proofs].sort((a, b) => a.sequenceNo - b.sequenceNo),
    [proofs],
  );

  async function onUploaded(fileId: string | null) {
    if (!fileId) return;
    await runMutation(
      async () =>
        (
          await add({
            variables: {
              registrationId,
              fileId,
              note: note.trim() || null,
            },
          })
        ).data?.addSettlementPaymentProof,
      {
        success: "Баримт нэмэгдлээ",
        onSuccess: () => {
          setUploadValue(null);
          setNote("");
          onChanged();
        },
      },
    );
  }

  async function onRemove(id: string) {
    if (!confirm("Энэ баримтыг устгах уу?")) return;
    await runMutation(
      async () =>
        (await remove({ variables: { id } })).data
          ?.removeSettlementPaymentProof,
      { onSuccess: onChanged },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Гүйлгээний баримт</CardTitle>
        <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
          {ordered.length} баримт
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {canAdd ? (
          <div className="space-y-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Тэмдэглэл — аль төлбөрийг хамаарах (заавал биш)"
              className="h-10"
            />
            <PhotoUpload
              value={uploadValue}
              onChange={(fid) => {
                setUploadValue(fid);
                if (fid) onUploaded(fid);
              }}
              type="settlement"
              label="Шинэ баримт нэмэх"
              capture="environment"
            />
          </div>
        ) : null}

        {ordered.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Баримт алга. Банкны гүйлгээний зургийг нэмнэ үү.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-md border bg-muted/20"
              >
                <div className="relative">
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.url}
                      alt={`Баримт #${p.sequenceNo}`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-xs text-muted-foreground">
                      Файл алга
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-2 py-1 text-xs text-white">
                    <span className="tabular-nums">#{p.sequenceNo}</span>
                    {canAdd ? (
                      <button
                        type="button"
                        onClick={() => onRemove(p.id)}
                        className="rounded px-1.5 py-0.5 hover:bg-white/15"
                      >
                        Устгах
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-0.5 px-2 py-1.5 text-xs">
                  {p.note ? <div className="font-medium">{p.note}</div> : null}
                  <div className="text-muted-foreground">
                    {p.createdBy ?? "—"}
                    {p.createdAt ? ` · ${fmtDateTime(p.createdAt)}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
