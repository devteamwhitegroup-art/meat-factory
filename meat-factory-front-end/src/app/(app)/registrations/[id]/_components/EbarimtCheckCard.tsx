"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { ImagePreviewLink } from "@/components/common/ImagePreviewLink";
import { SetRegistrationEbarimtCheckDoc } from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { cn } from "@/lib/utils";

type Check = { taken: boolean; image: string | null; note: string };

// Manual eBarimt record on the verify page while the PosAPI flow is parked
// (EBARIMT_POSAPI): the нярав enters the receipt on the herder's phone —
// optional, not every herder agrees — then ticks it here with a photo and a
// note. Every change saves at once, so nothing is lost when «Баталгаажуулах»
// is pressed next. Bordered like the verify card's other sections.
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
  onSaved: () => unknown;
}) {
  const [draftTaken, setDraftTaken] = useState(taken);
  const [draftImage, setDraftImage] = useState(imageFileId);
  const [draftNote, setDraftNote] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const [save] = useMutation(SetRegistrationEbarimtCheckDoc);

  async function persist(next: Check) {
    if (
      next.taken === taken &&
      next.image === imageFileId &&
      next.note.trim() === (note ?? "")
    )
      return;
    setBusy(true);
    const ok = await runMutation(
      async () =>
        (
          await save({
            variables: {
              registrationId,
              taken: next.taken,
              imageFileId: next.image,
              note: next.note.trim() || null,
            },
          })
        ).data?.setRegistrationEbarimtCheck,
      { success: "И-баримт хадгалагдлаа", onSuccess: onSaved },
    );
    // Failed: show what the server still has.
    if (!ok) {
      setDraftTaken(taken);
      setDraftImage(imageFileId);
      setDraftNote(note ?? "");
    }
    setBusy(false);
  }

  const current: Check = { taken: draftTaken, image: draftImage, note: draftNote };

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
    <section className="overflow-hidden rounded-md border bg-card">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2">
        <div>
          <div className="text-sm font-semibold">И-баримт (заавал биш)</div>
          <div className="text-xs text-muted-foreground">
            Малчин зөвшөөрвөл түүний утаснаас И-баримт шивээд, зургийг нь
            хавсаргана.
          </div>
        </div>
        <Badge
          className={
            taken
              ? "border-0 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
              : "border-0 bg-muted text-muted-foreground"
          }
        >
          {taken ? "Шивсэн" : "Шивээгүй"}
        </Badge>
      </div>

      <div className="space-y-4 p-4">
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
                disabled={busy}
                onChange={(e) => {
                  setDraftTaken(e.target.checked);
                  persist({ ...current, taken: e.target.checked });
                }}
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
                    onClick={() => {
                      setDraftImage(null);
                      persist({ ...current, image: null });
                    }}
                  >
                    Арилгах
                  </Button>
                </div>
              </div>
            ) : (
              <PhotoUpload
                value={draftImage}
                onChange={(fid) => {
                  setDraftImage(fid);
                  persist({ ...current, image: fid });
                }}
                type="verify"
                label="И-баримтын зураг (заавал биш)"
              />
            )}

            {/* Saved when the field is left. */}
            <Textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              onBlur={() => persist(current)}
              placeholder="Тэмдэглэл (заавал биш)"
              rows={2}
            />
            {busy ? (
              <p className="text-xs text-muted-foreground">Хадгалж байна…</p>
            ) : null}
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
      </div>
    </section>
  );
}
