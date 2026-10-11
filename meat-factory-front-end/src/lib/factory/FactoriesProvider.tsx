"use client";

import { createContext, useContext, useMemo } from "react";
import {
  byproductFactories,
  factoryKind,
  factoryName,
  intakeFactories,
  isByproductSite,
  isPreButchered,
  type FactoryInfo,
} from "./factories";

const Ctx = createContext<readonly FactoryInfo[]>([]);

// The factory catalogue, fetched once per request in the (app) layout and
// handed to every client component — so labels and kind rules never need a
// hard-coded factory list.
export function FactoriesProvider({
  factories,
  children,
}: {
  factories: readonly FactoryInfo[];
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={factories}>{children}</Ctx.Provider>;
}

export function useFactories() {
  const list = useContext(Ctx);
  return useMemo(
    () => ({
      list,
      active: list.filter((f) => f.isActive),
      intake: intakeFactories(list),
      byproduct: byproductFactories(list),
      nameOf: (code: string | null | undefined) => factoryName(list, code),
      kindOf: (code: string | null | undefined) => factoryKind(list, code),
      isPreButchered: (code: string | null | undefined) =>
        isPreButchered(list, code),
      isByproductSite: (code: string | null | undefined) =>
        isByproductSite(list, code),
    }),
    [list],
  );
}
