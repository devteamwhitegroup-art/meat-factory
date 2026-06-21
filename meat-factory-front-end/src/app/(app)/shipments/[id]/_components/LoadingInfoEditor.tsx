'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdateShipmentLoadingInfoDoc } from '@/lib/queries/shipment';
import { runMutation } from '@/lib/runMutation';

// ─── Loading info editor (driver, serial, vehicle plate) ────────────
//
// One card that captures everything the storekeeper notes from the truck:
// vehicle plate, driver name + phone, paper serial number. All four flush
// in a single mutation so the storekeeper can fill them on a tablet quickly.
export function LoadingInfoEditor({
  shipmentId,
  vehiclePlate,
  driverName,
  driverPhone,
  serialNumber,
  onChanged,
}: {
  shipmentId: string;
  vehiclePlate: string | null;
  driverName: string | null;
  driverPhone: string | null;
  serialNumber: string | null;
  onChanged: () => void;
}) {
  const [plate, setPlate] = useState(vehiclePlate ?? '');
  const [name, setName] = useState(driverName ?? '');
  const [phone, setPhone] = useState(driverPhone ?? '');
  const [serial, setSerial] = useState(serialNumber ?? '');
  const [save, { loading }] = useMutation(UpdateShipmentLoadingInfoDoc);

  const dirty =
    (plate.trim() || null) !== (vehiclePlate ?? null) ||
    (name.trim() || null) !== (driverName ?? null) ||
    (phone.trim() || null) !== (driverPhone ?? null) ||
    (serial.trim() || null) !== (serialNumber ?? null);

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
              serialNumber: serial.trim() || null,
            },
          })
        ).data?.updateShipmentLoadingInfo,
      { success: 'Хадгалагдлаа', onSuccess: onChanged },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ачилтын мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Машины дугаар</Label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="ж: Лиаз 134467"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Серийн дугаар</Label>
            <Input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="ж: 0024781"
              className="h-11"
            />
          </div>
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
        </div>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={loading || !dirty}>
            {loading ? '...' : 'Хадгалах'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
