"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalNumberAdder } from "@/components/registration/MedicalNumberAdder";
import { MedicalStatusActions } from "@/components/registration/MedicalStatusActions";
import {
  AddMedicalNumberDoc,
  RemoveMedicalNumberDoc,
} from "@/lib/queries/medical-number";
import {
  MEDICAL_NUMBER_STATUS_COLOR,
  MEDICAL_NUMBER_STATUS_MN,
} from "@/lib/format/enum";
import { runMutation } from "@/lib/runMutation";

type Num = { id: string; number: string; status: string };

// The registration's medical certificate numbers. Intake staff add / remove
// unchecked ones (canEdit); the vet rules on each (canCheck). The settlement's
// held portion is released only when every number is APPROVED.
export function MedicalNumbersCard({
  registrationId,
  numbers,
  closed,
  canEdit,
  canCheck,
}: {
  registrationId: string;
  numbers: Num[];
  // CANCELLED / SETTLED — no new numbers.
  closed: boolean;
  canEdit: boolean;
  canCheck: boolean;
}) {
  const router = useRouter();
  const [add, { loading: adding }] = useMutation(AddMedicalNumberDoc);
  const [remove, { loading: removing }] = useMutation(RemoveMedicalNumberDoc);
  // Overall from the numbers themselves (not the denormalized flag, which
  // pre-refactor rows left `true` with no numbers): none → no badge; any
  // rejected → Татгалзсан; all approved → Баталгаажсан.
  const overall =
    numbers.length === 0
      ? null
      : numbers.some((n) => n.status === "REJECTED")
        ? "REJECTED"
        : numbers.every((n) => n.status === "APPROVED")
          ? "APPROVED"
          : "PENDING";

  async function onAdd(list: string[]) {
    for (const number of list) {
      await runMutation(
        async () =>
          (await add({ variables: { registrationId, number } })).data
            ?.addMedicalNumber,
        { success: `${number} нэмэгдлээ` },
      );
    }
    router.refresh();
  }

  async function onRemove(id: string) {
    await runMutation(
      async () =>
        (await remove({ variables: { id } })).data?.removeMedicalNumber,
      { success: "Устгалаа", onSuccess: () => router.refresh() },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Мал эмнэлгийн дугаар</CardTitle>
        {overall ? (
          <Badge className={MEDICAL_NUMBER_STATUS_COLOR[overall]}>
            {MEDICAL_NUMBER_STATUS_MN[overall]}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {numbers.length === 0 ? (
          <div className="text-sm text-muted-foreground">Дугаар оруулаагүй</div>
        ) : (
          <div className="divide-y rounded-md border">
            {numbers.map((n) => (
              <div
                key={n.id}
                className="flex flex-wrap items-center gap-3 px-3 py-2"
              >
                <span className="font-mono text-base tabular-nums">
                  {n.number}
                </span>
                <Badge className={MEDICAL_NUMBER_STATUS_COLOR[n.status]}>
                  {MEDICAL_NUMBER_STATUS_MN[n.status] ?? n.status}
                </Badge>
                <div className="ml-auto flex items-center gap-1">
                  {canCheck ? (
                    <MedicalStatusActions id={n.id} status={n.status} />
                  ) : null}
                  {canEdit && n.status === "PENDING" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${n.number} устгах`}
                      disabled={removing}
                      onClick={() => onRemove(n.id)}
                    >
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
        {canEdit && !closed ? (
          <MedicalNumberAdder onAdd={onAdd} disabled={adding} />
        ) : null}
      </CardContent>
    </Card>
  );
}
