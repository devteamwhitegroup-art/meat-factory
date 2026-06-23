"use client";

import { useMemo } from "react";
import { ANIMAL_MN } from "@/lib/format/enum";
import { formatMNT } from "@/lib/format/money";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";

// Cosmetic preview of the бой (slaughter) cost the back-end will store on
// create: Σ(headCount × Animal.pricePerAnimal). Pre-butchered intakes carry
// no slaughter cost, so it shows 0. The authoritative value is whatever the
// server computes on createRegistration — this is just a live hint for the guard.
export function SlaughterCostPreview({
  counts,
  isPreButchered,
}: {
  counts: Record<string, number>;
  isPreButchered: boolean;
}) {
  const { animals } = useAnimalCatalog();

  const rows = useMemo(() => {
    const priceByType: Record<string, number> = {};
    for (const a of animals) {
      if (a.animalType)
        priceByType[a.animalType] = Number(a.pricePerAnimal ?? 0);
    }
    return Object.entries(counts)
      .filter(([, c]) => Number(c) > 0)
      .map(([animalType, c]) => {
        const count = Number(c);
        const price = priceByType[animalType] ?? 0;
        return { animalType, count, price, subtotal: count * price };
      });
  }, [counts, animals]);

  if (rows.length === 0) return null;

  const total = isPreButchered ? 0 : rows.reduce((s, r) => s + r.subtotal, 0);

  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm">
      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
        Бой зардал (урьдчилсан)
      </div>
      {isPreButchered ? (
        <p className="text-xs text-muted-foreground">
          Урьдчилан төхөөрсөн тул бой зардал 0.
        </p>
      ) : (
        <div className="space-y-0.5">
          {rows.map((r) => (
            <div key={r.animalType} className="flex justify-between">
              <span className="text-muted-foreground">
                {ANIMAL_MN[r.animalType] ?? r.animalType} {r.count} ×{" "}
                {formatMNT(r.price)}
              </span>
              <span className="tabular-nums">{formatMNT(r.subtotal)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-1.5 flex justify-between border-t pt-1.5 font-medium">
        <span>Нийт бой зардал</span>
        <span className="tabular-nums">{formatMNT(total)}</span>
      </div>
    </div>
  );
}
