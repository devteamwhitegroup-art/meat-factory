import { TPagination } from "../global/global.type";

export enum PRINT_JOB_TYPE {
  SALES_RECEIPT = "SALES_RECEIPT",
  SHIPMENT_SLIP = "SHIPMENT_SLIP",
  SETTLEMENT_RECEIPT = "SETTLEMENT_RECEIPT",
  // Pre-settlement weighed/price slip — refId is the Registration id.
  WEIGH_SLIP = "WEIGH_SLIP",
  // Standalone test slip (no source record) — Cyrillic + Mongolian + Latin.
  PRINTER_TEST = "PRINTER_TEST",
}

export enum PRINT_JOB_STATUS {
  PENDING = "PENDING", // waiting for the relay to claim it
  CLAIMED = "CLAIMED", // relay took it, print in progress
  PRINTED = "PRINTED", // relay confirmed the printer accepted the bytes
  FAILED = "FAILED", // gave up after 3 attempts
}

export type TPrintJob = {
  id: string;
  // Which printer this job is for — a Settings.printers[].id.
  printerKey: string;
  // That printer's IP, snapshotted at enqueue. The relay connects here, so
  // one relay serves every printer on its LAN with no per-printer config.
  printerIp: string | null;
  type: PRINT_JOB_TYPE;
  // Source record id (SalesTransaction / Shipment / Settlement). Null for
  // CODEPAGE_SAMPLER, which carries no source row.
  refId: string | null;
  status: PRINT_JOB_STATUS;
  // Rendered ESC/POS bytes, base64. The relay decodes and streams these
  // straight to the printer's port 9100 — the backend never touches the
  // printer directly (it's on a private LAN the cloud can't reach).
  payloadBase64: string;
  attempts: number;
  error: string | null;
  claimedAt: Date | null;
  printedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TGetPrintJobs = {
  status?: PRINT_JOB_STATUS;
  printerKey?: string;
} & TPagination;
