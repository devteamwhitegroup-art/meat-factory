import "server-only";

import { cache } from "react";
import { getClient } from "@/lib/apollo/server";
import { FactoriesDoc } from "@/lib/queries/factory";
import { compact } from "@/lib/compact";
import type { FactoryInfo } from "./factories";

// Factory catalogue for server components, deduped per request. Inactive
// sites are included so historic records still render their names.
export const getFactories = cache(async (): Promise<FactoryInfo[]> => {
  const { data } = await getClient().query({
    query: FactoriesDoc,
    variables: { includeInactive: true },
  });
  return compact(data?.factories?.factories).map((f) => ({
    code: f.code,
    name: f.name,
    kind: f.kind,
    isActive: f.isActive,
  }));
});
