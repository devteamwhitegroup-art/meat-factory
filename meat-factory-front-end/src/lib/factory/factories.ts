import type { Factory_Kind as FactoryKind } from "@/lib/gql/graphql";

export type { FactoryKind };

// One admin-managed site, as the `factories` query returns it. Display names
// and kinds live in the DB — nothing here is hard-coded per factory.
export type FactoryInfo = {
  code: string;
  name: string;
  kind: FactoryKind;
  isActive: boolean;
};

export const FACTORY_KIND_MN: Record<string, string> = {
  LIVE_SLAUGHTER: "Амьд мал (нядалгаатай)",
  PRE_BUTCHERED: "Задалсан мах хүлээн авах",
  BYPRODUCT: "Дайвар боловсруулах",
};

export const FACTORY_KIND_HINT: Record<string, string> = {
  LIVE_SLAUGHTER: "Амьд мал — бой зардалтай, адуунд тамга, баталгаажуулалт",
  PRE_BUTCHERED: "Урьдчилан төхөөрсөн мах — тамга, бой зардал, баталгаажуулалтгүй",
  BYPRODUCT: "Гэдэс хүлээн авч задална — мал хүлээн авахгүй",
};

export function factoryName(
  list: readonly FactoryInfo[],
  code: string | null | undefined,
): string {
  if (!code) return "—";
  return list.find((f) => f.code === code)?.name ?? code;
}

export function factoryKind(
  list: readonly FactoryInfo[],
  code: string | null | undefined,
): FactoryKind | null {
  return list.find((f) => f.code === code)?.kind ?? null;
}

export const isPreButchered = (
  list: readonly FactoryInfo[],
  code: string | null | undefined,
): boolean => factoryKind(list, code) === "PRE_BUTCHERED";

export const isByproductSite = (
  list: readonly FactoryInfo[],
  code: string | null | undefined,
): boolean => factoryKind(list, code) === "BYPRODUCT";

// Sites that take livestock / meat intake (registration form picker).
export const intakeFactories = (list: readonly FactoryInfo[]): FactoryInfo[] =>
  list.filter((f) => f.isActive && f.kind !== "BYPRODUCT");

export const byproductFactories = (
  list: readonly FactoryInfo[],
): FactoryInfo[] => list.filter((f) => f.isActive && f.kind === "BYPRODUCT");
