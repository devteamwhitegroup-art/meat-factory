"use client";

import { useMemo } from "react";
import { formatMNT } from "@/lib/format/money";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";

// Cosmetic preview of the бой (slaughter) cost the back-end will store on
// create: Σ(headCount × Animal.pricePerAnimal). Live-animal (FACTORY_1)
// intake only. The authoritative value is whatever the server computes on
// createRegistration — this is just a live hint for the guard.
export function SlaughterCostPreview({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const { animals } = useAnimalCatalog();

  const rows = useMemo(() => {
    const priceByType: Record<string, number> = {};
    for (const a of animals) {
      if (a.name) priceByType[a.name] = Number(a.pricePerAnimal ?? 0);
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

  const total = rows.reduce((s, r) => s + r.subtotal, 0);

  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm">
      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
        Бой зардал (урьдчилсан)
      </div>
      <div className="space-y-0.5">
        {rows.map((r) => (
          <div key={r.animalType} className="flex justify-between">
            <span className="text-muted-foreground">
              {r.animalType} {r.count} × {formatMNT(r.price)}
            </span>
            <span className="tabular-nums">{formatMNT(r.subtotal)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between border-t pt-1.5 font-medium">
        <span>Нийт бой зардал</span>
        <span className="tabular-nums">{formatMNT(total)}</span>
      </div>
    </div>
  );
}
