"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import {
  AddShipmentPhotoDoc,
  RemoveShipmentPhotoDoc,
} from "@/lib/queries/shipment";
import { runMutation } from "@/lib/runMutation";

// ─── Shipment photo gallery (multi-image attachments) ────────────────
//
// Storekeeper attaches the truck-side / cargo-doors / driver licence / paper
// serial photos here. Each upload posts to /api/file-upload then attaches
// the returned file id via addShipmentPhoto. Photos are ordered by sequenceNo.
export type ShipmentPhotoRow = {
  id: string;
  sequenceNo: number;
  createdAt: string | null;
  fileId: string | null;
  url: string | null;
};

export function ShipmentPhotoGallery({
  shipmentId,
  photos,
  onChanged,
}: {
  shipmentId: string;
  photos: ShipmentPhotoRow[];
  onChanged: () => void;
}) {
  const [uploadValue, setUploadValue] = useState<string | null>(null);
  const [attach] = useMutation(AddShipmentPhotoDoc);
  const [remove] = useMutation(RemoveShipmentPhotoDoc);

  const ordered = useMemo(
    () => [...photos].sort((a, b) => a.sequenceNo - b.sequenceNo),
    [photos],
  );

  async function onUploaded(fileId: string | null) {
    if (!fileId) return;
    await runMutation(
      async () =>
        (await attach({ variables: { shipmentId, fileId } })).data
          ?.addShipmentPhoto,
      {
        onSuccess: () => {
          setUploadValue(null);
          onChanged();
        },
      },
    );
  }

  async function onRemove(id: string) {
    if (!confirm("Энэ зургийг устгах уу?")) return;
    await runMutation(
      async () =>
        (await remove({ variables: { id } })).data?.removeShipmentPhoto,
      { onSuccess: onChanged },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Ачилтын зургууд</CardTitle>
        <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
          {ordered.length} зураг
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <PhotoUpload
          value={uploadValue}
          onChange={(fid) => {
            setUploadValue(fid);
            if (fid) onUploaded(fid);
          }}
          type="shipment"
          label="Шинэ зураг нэмэх"
          capture="environment"
        />

        {ordered.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Зураг алга. Дээрх товчоор машины, серийн дугаар, жолоочийн зургаа
            нэмнэ үү.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-md border bg-muted/20"
              >
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt={`Зураг #${p.sequenceNo}`}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center text-xs text-muted-foreground">
                    Файл алга
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-2 py-1 text-xs text-white">
                  <span className="tabular-nums">#{p.sequenceNo}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    className="rounded px-1.5 py-0.5 hover:bg-white/15"
                  >
                    Устгах
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
