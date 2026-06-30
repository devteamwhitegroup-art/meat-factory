"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { AnimalListDoc } from "@/lib/queries/animal";
import { compact } from "@/lib/compact";

// Single source of truth for the animal catalogue (admin-managed Animals table,
// keyed by `name`). `name` is also the value stored as `animalType` on every
// other record, so pickers send the name as `animalType` and labels render it
// directly — no enum→Cyrillic map.
export function useAnimalCatalog() {
  const { data, loading, error, refetch } = useQuery(AnimalListDoc, {
    fetchPolicy: "cache-first",
  });

  const animals = useMemo(() => compact(data?.animals?.animals), [data]);

  // Selectable animal names (active only), in catalogue order.
  const animalTypes: string[] = useMemo(
    () => animals.flatMap((a) => (a.isActive && a.name ? [a.name] : [])),
    [animals],
  );

  return { animals, animalTypes, loading, error, refetch };
}
