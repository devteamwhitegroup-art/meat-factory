"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApproveMedicalNumberDoc } from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";

// Set + approve the medical number in one step (the BE's approveMedicalNumber
// takes the number and marks it approved). Role-gated by the caller.
export function MedicalNumberEditor({
  registrationId,
  medicalNumber,
  approved,
}: {
  registrationId: string;
  medicalNumber: string | null;
  approved: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(medicalNumber ?? "");
  const [approve, { loading }] = useMutation(ApproveMedicalNumberDoc);

  async function onApprove() {
    await runMutation(
      async () =>
        (
          await approve({
            variables: { registrationId, medicalNumber: value.trim() || null },
          })
        ).data?.approveMedicalNumber,
      {
        success: "Эмнэлгийн дугаар батлагдлаа",
        onSuccess: () => router.refresh(),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Эмнэлгийн дугаар</CardTitle>
        <Badge
          className={
            approved
              ? "border-0 bg-emerald-100 text-emerald-800"
              : "border-0 bg-amber-100 text-amber-800"
          }
        >
          {approved ? "Батлагдсан" : "Батлагдаагүй"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Дугаар</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Эмнэлгийн дугаар"
            className="h-11 max-w-xs"
          />
        </div>
        <Button onClick={onApprove} disabled={loading}>
          {loading ? "..." : approved ? "Дугаар шинэчлэх / батлах" : "Батлах"}
        </Button>
      </CardContent>
    </Card>
  );
}
