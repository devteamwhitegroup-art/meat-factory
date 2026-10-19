"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import type { ResultOf } from "@graphql-typed-document-node/core";

import { Button, buttonVariants } from "@/components/ui/button";
import { BackButton } from "@/components/common/BackButton";
import { StatusBadge } from "@/components/registration/StatusBadge";
import {
  FinishWeighingDoc,
  RegistrationDetailDoc,
  SetRegistrationByproductsDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { WeighSlip } from "../_components/WeighSlip";
import {
  ByproductIntakeEditor,
  intakeInputs,
  type IntakeEdits,
} from "../weigh/_components/ByproductIntakeEditor";

type Reg = NonNullable<
  NonNullable<
    ResultOf<typeof RegistrationDetailDoc>["registration"]
  >["registration"]
>;

// Хойд үйлдвэр verification. The meat was weighed on the intake form, so
// this step checks the weighings, records the byproduct items and confirms —
// which finishes weighing on the server (meat + byproducts into stock), after
// which Тооцоо opens. Weight fixes before that: Хэмжүүр / Засах.
export function PreButcheredVerify({
  reg,
  canConfirm,
  onDone,
}: {
  reg: Reg;
  // нярав / admin (finishing weighing).
  canConfirm: boolean;
  // Reloads the registration (after a byproduct save / confirm).
  onDone: () => unknown;
}) {
  const router = useRouter();
  const id = reg.id!;
  const [intake, setIntake] = useState<IntakeEdits>({});
  const [busy, setBusy] = useState(false);
  const [saveBundles] = useMutation(SetRegistrationByproductsDoc);
  const [finish] = useMutation(FinishWeighingDoc);
  const open = reg.status === "REGISTERED";
  const entries = compact(reg.weighingEntries);
  const bundles = compact(reg.byproductBundles);

  // Pending byproduct edits (untouched rows keep the saved / default value).
  async function saveIntake(): Promise<boolean> {
    return runMutation(
      async () =>
        (
          await saveBundles({
            variables: {
              registrationId: id,
              bundles: intakeInputs(bundles, intake),
            },
          })
        ).data?.setRegistrationByproducts,
      {
        success: "Дайвар хадгалагдлаа",
        // Reload so the saved counts show (clearing the edits alone would
        // fall back to the stale values).
        onSuccess: async () => {
          await onDone();
          setIntake({});
        },
      },
    );
  }

  async function confirm() {
    setBusy(true);
    if (Object.keys(intake).length > 0 && !(await saveIntake())) {
      setBusy(false);
      return;
    }
    await runMutation(
      async () =>
        (await finish({ variables: { registrationId: id } })).data
          ?.finishWeighing,
      {
        success: "Баталгаажлаа — нөөцөд орлоо",
        onSuccess: () => {
          onDone();
          router.push(`/registrations/${id}`);
        },
      },
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BackButton href={`/registrations/${id}`} />
          <div>
            <div className="text-sm text-muted-foreground">Бүртгэлийн код</div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold">
                {reg.registrationCode ?? "—"}
              </h1>
              <StatusBadge status={reg.status} />
            </div>
          </div>
        </div>
        {!open && reg.status !== "CANCELLED" ? (
          <Link
            href={`/registrations/${id}/settlement`}
            className={buttonVariants()}
          >
            Тооцоо →
          </Link>
        ) : null}
      </div>

      {entries.length > 0 ? (
        <WeighSlip reg={reg} />
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Жин бүртгэгдээгүй байна —{" "}
          <Link
            href={`/registrations/${id}/weigh`}
            className="text-primary underline"
          >
            Хэмжүүр
          </Link>{" "}
          хуудаснаас оруулна уу.
        </div>
      )}

      <ByproductIntakeEditor
        bundles={bundles}
        edits={intake}
        editable={open && canConfirm}
        busy={busy}
        onChange={setIntake}
        onSave={async () => {
          setBusy(true);
          await saveIntake();
          setBusy(false);
        }}
      />

      {open ? (
        canConfirm ? (
          <Button
            onClick={confirm}
            disabled={busy || entries.length === 0}
            className="h-12 w-full text-base"
          >
            {busy ? "..." : "Баталгаажуулах"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Нярав баталгаажуулна.</p>
        )
      ) : (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          Баталгаажсан — мах, дайвар нөөцөд орсон.
        </div>
      )}
    </div>
  );
}
