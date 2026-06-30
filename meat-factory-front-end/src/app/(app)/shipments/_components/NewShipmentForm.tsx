"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreateShipmentDoc,
  NextShipmentSerialDoc,
} from "@/lib/queries/shipment";
import { unwrap } from "@/lib/unwrap";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { SHIPMENT_CATEGORY_MN, DOMESTIC_MARKET_MN } from "@/lib/format/enum";
import { CustomerCombobox } from "./CustomerCombobox";

// A shipment is the physical stock-out event. Its category (export/domestic)
// is fixed by the page you came from. Domestic shipments additionally require
// a market (LOCAL/ULAANBAATAR). Customer is required (searchable picker, with
// inline create); weight is derived from the manifest on the detail screen.
type Market = "LOCAL" | "ULAANBAATAR";

export function NewShipmentForm({
  category,
}: {
  category: "EXPORT" | "DOMESTIC";
}) {
  const router = useRouter();
  const isDomestic = category === "DOMESTIC";

  const [createShipment] = useMutation(CreateShipmentDoc);
  // Advisory only — the server assigns the real serial at create time.
  const { data: nextSerial } = useQuery(NextShipmentSerialDoc, {
    fetchPolicy: "cache-and-network",
  });
  const upcomingSerial = nextSerial?.nextShipmentSerial?.serialNumber ?? null;

  const [domesticMarket, setDomesticMarket] = useState<Market>("ULAANBAATAR");
  const [customerId, setCustomerId] = useState<string>("");
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setTriedSubmit(true);
    if (!customerId) {
      toast.error("Харилцагч сонгоно уу");
      return;
    }
    setBusy(true);
    try {
      const r = await createShipment({
        variables: {
          category,
          domesticMarket: isDomestic ? domesticMarket : null,
          customerId,
          vehiclePlate: vehiclePlate.trim() || null,
          driverName: driverName.trim() || null,
          driverPhone: driverPhone.trim() || null,
          notes: notes.trim() || null,
          photoFileId: photoFileId ?? null,
        },
      });
      const sh = unwrap(r.data?.createShipment).shipment;
      if (!sh?.id) throw new Error("Хариу буцаасангүй");
      toast.success(`Ачилт ${sh.shipmentCode} үүсгэгдлээ`);
      router.push(`/shipments/${sh.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Төрөл:</span>
          <Badge className="border-0 bg-primary/10 text-primary">
            {SHIPMENT_CATEGORY_MN[category]}
          </Badge>
          {upcomingSerial != null ? (
            <span className="text-xs text-muted-foreground">
              · Дараагийн серийн дугаар:{" "}
              <span className="font-medium tabular-nums text-foreground">
                {upcomingSerial}
              </span>
            </span>
          ) : null}
        </div>

        {isDomestic ? (
          <div className="space-y-1.5">
            <Label>Зах зээл</Label>
            <Tabs
              value={domesticMarket}
              onValueChange={(v) => {
                setDomesticMarket(v as Market);
                // The customer kind is market-scoped, so a previously picked
                // customer no longer fits — clear it.
                setCustomerId("");
              }}
            >
              <TabsList>
                <TabsTrigger value="ULAANBAATAR">
                  {DOMESTIC_MARKET_MN.ULAANBAATAR}
                </TabsTrigger>
                <TabsTrigger value="LOCAL">
                  {DOMESTIC_MARKET_MN.LOCAL}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label>Харилцагч *</Label>
          <CustomerCombobox
            value={customerId}
            onChange={setCustomerId}
            invalid={triedSubmit && !customerId}
            kind={
              isDomestic
                ? domesticMarket === "ULAANBAATAR"
                  ? "ULAANBAATAR_BROKER"
                  : "LOCAL_BROKER"
                : "FACTORY"
            }
          />
          {triedSubmit && !customerId ? (
            <p className="text-xs text-destructive">Харилцагч сонгоно уу</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Жин нь ачааны жагсаалтаас автоматаар бодогдоно.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Машины дугаар</Label>
            <Input
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              placeholder="ж: УНО0223"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Жолоочийн нэр</Label>
            <Input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Овог нэр"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Жолоочийн утас</Label>
            <Input
              inputMode="tel"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="ж: 9911 2233"
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Тэмдэглэл</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="max-w-md">
          <PhotoUpload
            value={photoFileId}
            onChange={setPhotoFileId}
            type="shipment"
            label="Ачилтын зураг (заавал биш)"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={busy || !customerId}>
            {busy ? "..." : "Үүсгэх"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
