"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HerderPicker } from "@/components/registration/HerderPicker";
import { AnimalCountGrid } from "@/components/registration/AnimalCountGrid";
import {
  RequestRegistrationChangeDoc,
  UpdateRegistrationDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { useDraft } from "@/lib/hooks/useDraft";
import { PLATE_HINT, PLATE_RE, STAMPED_ANIMAL } from "../../new/intake-form";

type Initial = {
  herderId: string;
  herderLabel: string;
  vehicleNumber: string;
  stamp: string;
  counts: Record<string, number>;
};

// Intake fields fixable later: herder, plate, stamp, counts. `direct` = save
// now; otherwise the same values go to admin with a reason.
export function EditForm({
  id,
  direct,
  pre,
  quickHerder,
  initial,
}: {
  id: string;
  direct: boolean;
  pre: boolean;
  quickHerder: boolean;
  initial: Initial;
}) {
  const router = useRouter();
  const [herderId, setHerderId] = useState<string | null>(initial.herderId);
  const [vehicleNumber, setVehicleNumber] = useState(initial.vehicleNumber);
  const [stamp, setStamp] = useState(initial.stamp);
  const [counts, setCounts] = useState(initial.counts);
  const [reason, setReason] = useState("");
  const [herderLabel, setHerderLabel] = useState(initial.herderLabel);
  const [pickerKey, setPickerKey] = useState(0);
  const clearDraft = useDraft(
    `reg-edit:${id}`,
    { herderId, herderLabel, vehicleNumber, stamp, counts, reason },
    (d) => {
      setHerderId(d.herderId);
      setHerderLabel(d.herderLabel);
      setVehicleNumber(d.vehicleNumber);
      setStamp(d.stamp);
      setCounts(d.counts);
      setReason(d.reason);
      setPickerKey((k) => k + 1); // remount → shows the restored herder
    },
  );
  const [update, { loading: saving }] = useMutation(UpdateRegistrationDoc);
  const [request, { loading: sending }] = useMutation(
    RequestRegistrationChangeDoc,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const animalLines = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([animalType, count]) => ({
        animalType,
        count: pre ? 0 : count, // Хойд үйлдвэр: type only
      }));
    if (!herderId) return toast.error("Малчин сонгоно уу");
    if (!PLATE_RE.test(vehicleNumber.trim())) return toast.error(PLATE_HINT);
    if (animalLines.length === 0)
      return toast.error("Дор хаяж нэг малын төрөл оруулна уу");
    if (!pre && (counts[STAMPED_ANIMAL] ?? 0) > 0 && !stamp.trim())
      return toast.error("Адуунд таних тэмдэг шаардлагатай");
    if (!direct && !reason.trim())
      return toast.error("Засварын шалтгаан бичнэ үү");

    const intake = {
      herderId,
      vehicleNumber: vehicleNumber.trim(),
      stamp: pre ? null : stamp.trim() || null,
      animalLines,
    };
    const done = () => {
      clearDraft();
      router.push(`/registrations/${id}`);
      router.refresh();
    };
    if (direct)
      await runMutation(
        async () =>
          (await update({ variables: { id, ...intake } })).data
            ?.updateRegistration,
        { success: "Бүртгэл засагдлаа", onSuccess: done },
      );
    else
      await runMutation(
        async () =>
          (
            await request({
              variables: { registrationId: id, reason: reason.trim(), intake },
            })
          ).data?.requestRegistrationChange,
        { success: "Хүсэлт админд илгээгдлээ", onSuccess: done },
      );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1.5">
            <Label className="text-base">Машины дугаар</Label>
            <Input
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="8901 ДОУ"
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Малчин</Label>
            <HerderPicker
              key={pickerKey}
              value={herderId}
              onChange={setHerderId}
              onSelect={(h) =>
                setHerderLabel(h?.name || h?.registrationNo || "")
              }
              quick={quickHerder}
              initialLabel={herderLabel}
            />
          </div>
          {pre ? null : (
            <div className="space-y-1.5">
              <Label className="text-base">Таних тэмдэг</Label>
              <Input
                value={stamp}
                onChange={(e) => setStamp(e.target.value)}
                placeholder="Малын тамганы тайлбар"
                className="h-12 text-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="text-lg font-semibold">
            {pre ? "Махны төрөл" : "Малын тоо"}
          </div>
          <AnimalCountGrid
            value={counts}
            onChange={setCounts}
            countless={pre}
          />
        </CardContent>
      </Card>

      {direct ? null : (
        <div className="space-y-1.5">
          <Label className="text-base">Засварын шалтгаан</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Засах болсон шалтгаан"
          />
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-lg"
        disabled={saving || sending}
      >
        {direct ? "Хадгалах" : "Хүсэлт илгээх"}
      </Button>
    </form>
  );
}
