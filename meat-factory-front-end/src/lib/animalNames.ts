import "server-only";

import { getClient } from "@/lib/apollo/server";
import { AnimalListDoc } from "@/lib/queries/animal";
import { compact } from "@/lib/compact";

// Server-side animalType → admin-editable display name map (RSC mirror of
// useAnimalCatalog's `animalName`). Labels are non-critical, so a fetch
// failure degrades to an empty map and call sites fall back to the raw type.
export async function getAnimalNames(): Promise<Map<string, string>> {
  try {
    const { data } = await getClient().query({ query: AnimalListDoc });
    return new Map(
      compact(data?.animals?.animals).flatMap((a) =>
        a.animalType && a.name ? [[a.animalType as string, a.name]] : [],
      ),
    );
  } catch {
    return new Map();
  }
}
