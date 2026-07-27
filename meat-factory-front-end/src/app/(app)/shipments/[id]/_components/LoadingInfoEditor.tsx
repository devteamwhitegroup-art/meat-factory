"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateShipmentLoadingInfoDoc } from "@/lib/queries/shipment";
import { runMutation } from "@/lib/runMutation";

// ─── Loading info editor (driver, vehicle plate, seal number) ───────
//
// One card that captures what the storekeeper notes from the truck: vehicle
// plate, the factory's own physical seal/lock number (unrelated to the
// system-assigned shipment code/serial — the factory already has its own
// numbering, we just record it, not generate one), and — export only —
// driver name + phone (unneeded for domestic hauls). All flush in a single
// mutation so the storekeeper can fill them on a tablet quickly.
export function LoadingInfoEditor({
  shipmentId,
  editable,
  showDriverFields,
  vehiclePlate,
  driverName,
  driverPhone,
  sealNumber,
  onChanged,
}: {
  shipmentId: string;
  editable: boolean;
  showDriverFields: boolean;
  vehiclePlate: string | null;
  driverName: string | null;
  driverPhone: string | null;
  sealNumber: string | null;
  onChanged: () => void;
}) {
  const [plate, setPlate] = useState(vehiclePlate ?? "");
  const [name, setName] = useState(driverName ?? "");
  const [phone, setPhone] = useState(driverPhone ?? "");
  const [seal, setSeal] = useState(sealNumber ?? "");
  const [save, { loading }] = useMutation(UpdateShipmentLoadingInfoDoc);

  const dirty =
    (plate.trim() || null) !== (vehiclePlate ?? null) ||
    (name.trim() || null) !== (driverName ?? null) ||
    (phone.trim() || null) !== (driverPhone ?? null) ||
    (seal.trim() || null) !== (sealNumber ?? null);

  async function onSave() {
    await runMutation(
      async () =>
        (
          await save({
            variables: {
              id: shipmentId,
              vehiclePlate: plate.trim() || null,
              driverName: name.trim() || null,
              driverPhone: phone.trim() || null,
              sealNumber: seal.trim() || null,
            },
          })
        ).data?.updateShipmentLoadingInfo,
      { success: "Хадгалагдлаа", onSuccess: onChanged },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ачилтын мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {editable ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Машины дугаар</Label>
                <Input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="ж: УНО0223"
                  className="h-11"
                />
              </div>
              {showDriverFields ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Жолоочийн нэр</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Овог нэр"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Жолоочийн утас</Label>
                    <Input
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ж: 9911 2233"
                      className="h-11"
                    />
                  </div>
                </>
              ) : null}
              <div className="space-y-1.5">
                <Label className="text-xs">Лацны дугаар</Label>
                <Input
                  value={seal}
                  onChange={(e) => setSeal(e.target.value)}
                  placeholder="Үйлдвэрийн лацны дугаар"
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onSave} disabled={loading || !dirty}>
                {loading ? "..." : "Хадгалах"}
              </Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Машины дугаар</div>
              <div>{vehiclePlate ?? "—"}</div>
            </div>
            {showDriverFields ? (
              <>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Жолоочийн нэр
                  </div>
                  <div>{driverName ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Жолоочийн утас
                  </div>
                  <div>{driverPhone ?? "—"}</div>
                </div>
              </>
            ) : null}
            <div>
              <div className="text-xs text-muted-foreground">Лацны дугаар</div>
              <div>{sealNumber ?? "—"}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
