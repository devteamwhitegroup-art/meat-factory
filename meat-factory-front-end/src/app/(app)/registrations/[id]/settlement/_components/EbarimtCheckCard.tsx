"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { ImagePreviewLink } from "@/components/common/ImagePreviewLink";
import { SetSettlementEbarimtCheckDoc } from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { cn } from "@/lib/utils";

// Manual eBarimt record while the PosAPI flow is parked (EBARIMT_POSAPI): the
// accountant ticks whether the herder's receipt was taken, adds a photo of it
// and a note, then saves. Everyone else sees it read-only.
export function EbarimtCheckCard({
  registrationId,
  taken,
  imageFileId,
  imageUrl,
  note,
  canEdit,
  onSaved,
}: {
  registrationId: string;
  taken: boolean;
  imageFileId: string | null;
  imageUrl: string | null;
  note: string | null;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [draftTaken, setDraftTaken] = useState(taken);
  const [draftImage, setDraftImage] = useState(imageFileId);
  const [draftNote, setDraftNote] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const [save] = useMutation(SetSettlementEbarimtCheckDoc);
  const dirty =
    draftTaken !== taken ||
    draftImage !== imageFileId ||
    draftNote.trim() !== (note ?? "");

  async function onSave() {
    setBusy(true);
    await runMutation(
      async () =>
        (
          await save({
            variables: {
              registrationId,
              taken: draftTaken,
              imageFileId: draftImage,
              note: draftNote.trim() || null,
            },
          })
        ).data?.setSettlementEbarimtCheck,
      { success: "И-баримт хадгалагдлаа", onSuccess: onSaved },
    );
    setBusy(false);
  }

  // The saved photo; a newly picked one previews inside PhotoUpload.
  const savedImage = imageUrl ? (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="И-баримт"
        className="size-20 rounded-lg border bg-white object-cover"
      />
      <ImagePreviewLink
        url={imageUrl}
        title="И-баримтын зураг"
        label="Томоор харах"
      />
    </div>
  ) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>И-баримт</CardTitle>
        <Badge
          className={
            taken
              ? "border-0 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
              : "border-0 bg-muted text-muted-foreground"
          }
        >
          {taken ? "Шивсэн" : "Шивээгүй"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit ? (
          <>
            {/* Whole row toggles, not just the box. */}
            <label
              className={cn(
                "flex cursor-pointer select-none items-center gap-3 rounded-xl border p-4 text-base font-semibold transition-colors",
                draftTaken
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/40",
              )}
            >
              <input
                type="checkbox"
                checked={draftTaken}
                onChange={(e) => setDraftTaken(e.target.checked)}
                className="size-6 cursor-pointer accent-primary"
              />
              <span className="flex-1">
                И-баримт
                <span className="block text-sm font-normal text-muted-foreground">
                  И-баримт шивсэн бол чагтална.
                </span>
              </span>
            </label>

            {draftImage && draftImage === imageFileId && savedImage ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">И-баримтын зураг</div>
                <div className="flex items-center gap-3">
                  {savedImage}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraftImage(null)}
                  >
                    Арилгах
                  </Button>
                </div>
              </div>
            ) : (
              <PhotoUpload
                value={draftImage}
                onChange={setDraftImage}
                type="settlement"
                label="И-баримтын зураг (заавал биш)"
              />
            )}

            <Textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Тэмдэглэл (заавал биш)"
              rows={2}
            />

            <Button onClick={onSave} disabled={busy || !dirty}>
              {busy ? "Хадгалж байна…" : "Хадгалах"}
            </Button>
          </>
        ) : (
          <div className="space-y-3 text-base">
            {savedImage}
            {note ? <p className="whitespace-pre-wrap">{note}</p> : null}
            {!savedImage && !note ? (
              <p className="text-muted-foreground">Зураг, тэмдэглэл алга.</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
