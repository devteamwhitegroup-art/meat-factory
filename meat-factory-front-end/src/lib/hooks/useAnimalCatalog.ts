'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { AnimalListDoc } from '@/lib/queries/animal';
import { compact } from '@/lib/compact';

// Stable display order matching the BE enum, used when DB rows arrive in a
// different order. Anything outside this list is appended at the end.
const ORDER = ['COW', 'SHEEP', 'HORSE', 'GOAT', 'CAMEL'];

function rank(t: string): number {
  const i = ORDER.indexOf(t);
  return i === -1 ? ORDER.length : i;
}

// Single source of truth for "which animal types does this app know about?".
// Drives tabs, grids, and dropdowns. The Animals catalog is seeded by the
// back-end on boot so this query always returns the full set.
export function useAnimalCatalog() {
  const { data, loading, error, refetch } = useQuery(AnimalListDoc, {
    fetchPolicy: 'cache-first',
  });

  const animals = useMemo(
    () => compact(data?.animals?.animals),
    [data],
  );

  const animalTypes: string[] = useMemo(() => {
    const out: string[] = [];
    for (const a of animals) {
      if (a.animalType) out.push(a.animalType as string);
    }
    out.sort((x, y) => rank(x) - rank(y));
    return out;
  }, [animals]);

  return { animals, animalTypes, loading, error, refetch };
}
