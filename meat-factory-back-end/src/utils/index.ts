import fs from 'node:fs';
import path from 'node:path';
import { Op } from 'sequelize';
import type {
  FindAndCountOptions,
  FindOptions,
  Model,
  ModelStatic,
  WhereOptions
} from 'sequelize';
import type { TContext, TPaginationGeneric } from '../types/global/global.type';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const pagination = (
  doc: PaginationParams
): { offset: number; limit: number } => {
  const page = doc.page ?? 1;
  const limit = doc.limit ?? 10;

  const data = {
    offset: (page - 1) * limit,
    limit
  };
  return data;
};

// ---- Sequelize helpers ----------------------------------------------------
// `findByPk` + "throw if missing", shared by every controller's `findIdCheck`
// (a public, cross-controller FK-existence guard) and the `getById` reads that
// pass an `include`. Keeps the not-found message per call site.
export async function findOrThrow<M extends Model>(
  model: ModelStatic<M>,
  id: string,
  notFound: string,
  options?: Omit<FindOptions, 'where'>
): Promise<M> {
  const row = await model.findByPk(id, options);
  if (!row) throw new Error(notFound);
  return row;
}

// `pagination(doc)` + `findAndCountAll`. The caller still builds its own
// `where`/`order`/`include`; this only owns the offset/limit plumbing and the
// `{ rows, count }` shape. `group` is excluded so `count` stays a number.
export async function listPaginated<M extends Model>(
  model: ModelStatic<M>,
  doc: PaginationParams,
  options: Omit<FindAndCountOptions, 'offset' | 'limit' | 'group'> = {}
): Promise<TPaginationGeneric<M>> {
  const { offset, limit } = pagination(doc);
  return model.findAndCountAll({ ...options, offset, limit });
}

// Narrow an `unknown` caught value (TS `useUnknownInCatchVariables`) to a
// human-readable message. Use in every resolver/controller catch block.
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

// ---- Human-readable daily codes (REG-YYYYMMDD-N, SHIP-YYYYMMDD-N) ----------
// Date stamp (YYYYMMDD) in Mongolia time (UTC+8), independent of server tz so
// the "day" boundary for the per-day counter is always local midnight.
export const dateStampUTC8 = (d: Date = new Date()): string => {
  const utc8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc8.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

// Next per-day counter for a coded column: max numeric suffix among existing
// rows whose code starts with `prefix`, + 1. The date lives in the prefix so
// the count is implicitly scoped to that day (no tz boundary math). Racy under
// concurrency — callers retry on the column's UNIQUE collision.
export async function nextDailyCounter<M extends Model>(
  model: ModelStatic<M>,
  column: string,
  prefix: string
): Promise<number> {
  const where = { [column]: { [Op.like]: `${prefix}%` } } as WhereOptions;
  const rows = (await model.findAll({
    where,
    attributes: [column],
    raw: true
  })) as unknown as Array<Record<string, unknown>>;
  let max = 0;
  for (const r of rows) {
    const n = Number(String(r[column] ?? '').slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

// ---- Resolver envelope helpers -------------------------------------------
// Every resolver field returns a `{ success, message, <data> }` envelope and
// funnels caught errors through errorMessage(). These HOFs remove that
// try/catch boilerplate: the handler receives (args, context) and returns just
// the payload; the wrapper builds the envelope and handles the failure path.
type ResolverHandler<A, D> = (args: A, context: TContext) => Promise<D>;

// Single-entity payload, e.g. `{ success, message, customer }`. Error → key:null.
export const wrapOne =
  <A, D>(key: string, handler: ResolverHandler<A, D>, message = 'Success') =>
  async (_: unknown, args: A, context: TContext) => {
    try {
      return { success: true, message, [key]: await handler(args, context) };
    } catch (error) {
      return { success: false, message: errorMessage(error), [key]: null };
    }
  };

// Paginated list; handler returns `{ rows, count }`. Error → key:[], count:0.
export const wrapList =
  <A, D>(
    key: string,
    handler: ResolverHandler<A, TPaginationGeneric<D>>,
    message = 'Success'
  ) =>
  async (_: unknown, args: A, context: TContext) => {
    try {
      const { rows, count } = await handler(args, context);
      return { success: true, message, [key]: rows, count };
    } catch (error) {
      return { success: false, message: errorMessage(error), [key]: [], count: 0 };
    }
  };

// Non-paginated array payload, e.g. `{ success, message, items }`. Error → key:[].
export const wrapItems =
  <A, D>(key: string, handler: ResolverHandler<A, D[]>, message = 'Success') =>
  async (_: unknown, args: A, context: TContext) => {
    try {
      return { success: true, message, [key]: await handler(args, context) };
    } catch (error) {
      return { success: false, message: errorMessage(error), [key]: [] };
    }
  };

// No payload (delete/void). Returns just `{ success, message }`.
export const wrapVoid =
  <A>(message: string, handler: ResolverHandler<A, unknown>) =>
  async (_: unknown, args: A, context: TContext) => {
    try {
      await handler(args, context);
      return { success: true, message };
    } catch (error) {
      return { success: false, message: errorMessage(error) };
    }
  };

export const getAppRootDir = () => {
  let currentDir = __dirname;
  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    currentDir = path.join(currentDir, '..');
  }
  return currentDir;
};
