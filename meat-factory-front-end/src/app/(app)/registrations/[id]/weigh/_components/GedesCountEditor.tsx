"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Bundle = {
  wrapperId: string;
  wrapperName: string;
  animalType: string;
  count: number;
};

// FACTORY_2 receiving: count the гэдэс delivered with the pre-butchered meat
// (bundle level only — never элэг/бөөр). Defaults come from the BE (head
// count until first saved); "finish weighing" saves pending edits first.
export function GedesCountEditor({
  bundles,
  values,
  editable,
  busy,
  onChange,
  onSave,
}: {
  bundles: Bundle[];
  values: Record<string, string>;
  editable: boolean;
  busy: boolean;
  onChange: (wrapperId: string, value: string) => void;
  onSave: () => void;
}) {
  if (bundles.length === 0) return null;
  const dirty = Object.keys(values).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Гэдэс</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((b) => (
            <div key={b.wrapperId} className="space-y-1.5">
              <Label className="text-xs">
                {b.wrapperName} ({b.animalType})
              </Label>
              <Input
                inputMode="numeric"
                value={values[b.wrapperId] ?? String(b.count)}
                onChange={(e) =>
                  onChange(b.wrapperId, e.target.value.replace(/\D/g, ""))
                }
                className="h-11 text-right tabular-nums"
                disabled={!editable || busy}
              />
            </div>
          ))}
        </div>
        {editable ? (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={busy || !dirty}>
              Гэдэс хадгалах
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Жин бүртгэл дууссан тул гэдэсний тоог өөрчлөх боломжгүй.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
