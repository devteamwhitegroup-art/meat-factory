// What a site does — every factory-dependent rule in the system branches on
// the KIND, never on a particular factory code, so adding a fourth site is a
// row in Factories, not a code change.
//   LIVE_SLAUGHTER — live animals: stamp, бой зардал, weigh, verify, settle.
//   PRE_BUTCHERED  — already-butchered meat: no stamp/бой/verify; meat + гэдэс
//                    stock at finishWeighing, settlement from WEIGHED.
//   BYPRODUCT      — receives counted гэдэс from the other kinds and
//                    disassembles it; never takes livestock.
export enum FACTORY_KIND {
  LIVE_SLAUGHTER = "LIVE_SLAUGHTER",
  PRE_BUTCHERED = "PRE_BUTCHERED",
  BYPRODUCT = "BYPRODUCT",
}

// `code` is the primary key and what every `factory` column stores
// (ASCII identifier, e.g. FACTORY_1). Display name is admin-editable.
export type TFactory = {
  code: string;
  name: string;
  kind: FACTORY_KIND;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateFactory = {
  code: string;
  name: string;
  kind: FACTORY_KIND;
};

export type TUpdateFactory = {
  code: string;
  name?: string | null;
  isActive?: boolean | null;
};

export const FACTORY_CODE_RE = /^[A-Z][A-Z0-9_]{1,31}$/;
