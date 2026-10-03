import { Op, Transaction } from "sequelize";
import sequelize from "../../config/db-connection";
import { PrintJobModel } from "../../models/print/print-job.model";
import { SettingsController } from "../settings/settings.controller";
import { TPrinter } from "../../types/settings/settings.type";
import {
  PRINT_JOB_STATUS,
  PRINT_JOB_TYPE,
  TGetPrintJobs,
} from "../../types/print/print.type";
import { TPaginationGeneric } from "../../types/global/global.type";
import { findOrThrow, listPaginated } from "../../utils";
import {
  renderPrinterTest,
  renderReceipt,
  renderReceiptPreview,
} from "./receipt-render";

const MAX_ATTEMPTS = 3;

export class PrintController {
  // Render a receipt to a PNG data URL for the on-screen preview (same code
  // path as enqueue, so the preview can't drift from what prints).
  static preview(type: PRINT_JOB_TYPE, refId: string): Promise<string> {
    if (!refId) throw new Error("id is required");
    return renderReceiptPreview(type, refId);
  }

  // The staff-picked printer from Settings (admin-managed name + IP).
  private static async printerFor(printerKey: string): Promise<TPrinter> {
    const { printers } = await SettingsController.get();
    const printer = printers.find((p) => p.id === printerKey);
    if (!printer)
      throw new Error("Printer not found — pick one configured in Settings");
    return printer;
  }

  // Called by staff (enqueuePrint mutation). Renders the receipt now so a
  // later record edit can't change what was printed, then queues the bytes.
  static async enqueue(
    type: PRINT_JOB_TYPE,
    refId: string,
    printerKey: string,
  ): Promise<PrintJobModel> {
    if (!refId) throw new Error("id is required");
    const printer = await this.printerFor(printerKey);
    const payload = await renderReceipt(type, refId);
    return PrintJobModel.create({
      printerKey: printer.id,
      printerIp: printer.ip,
      type,
      refId,
      status: PRINT_JOB_STATUS.PENDING,
      payloadBase64: payload.toString("base64"),
      attempts: 0,
    });
  }

  // Short test slip (no source record) — Cyrillic + Mongolian Ө Ү + Latin,
  // rendered as an image like every other receipt.
  static async enqueuePrinterTest(printerKey: string): Promise<PrintJobModel> {
    const printer = await this.printerFor(printerKey);
    return PrintJobModel.create({
      printerKey: printer.id,
      printerIp: printer.ip,
      type: PRINT_JOB_TYPE.PRINTER_TEST,
      refId: null,
      status: PRINT_JOB_STATUS.PENDING,
      payloadBase64: renderPrinterTest().bytes.toString("base64"),
      attempts: 0,
    });
  }

  // Relay: atomically take the oldest PENDING job for any printer (or requeue
  // one left CLAIMED by a relay that died mid-print, > 2 min ago). The job
  // carries printerIp, so the relay knows where to send it.
  static claimNext(): Promise<PrintJobModel | null> {
    return sequelize.transaction(async (t) => {
      const staleBefore = new Date(Date.now() - 120_000);
      const job = await PrintJobModel.findOne({
        where: {
          printerIp: { [Op.ne]: null },
          [Op.or]: [
            { status: PRINT_JOB_STATUS.PENDING },
            {
              status: PRINT_JOB_STATUS.CLAIMED,
              claimedAt: { [Op.lt]: staleBefore },
            },
          ],
        },
        order: [["createdAt", "ASC"]],
        lock: Transaction.LOCK.UPDATE,
        skipLocked: true,
        transaction: t,
      });
      if (!job) return null;

      job.status = PRINT_JOB_STATUS.CLAIMED;
      job.claimedAt = new Date();
      job.attempts += 1;
      await job.save({ transaction: t });
      return job;
    });
  }

  // Relay reports the outcome. Failure requeues until MAX_ATTEMPTS, then FAILED
  // (operator hits print again — that makes a fresh job).
  static async ack(
    id: string,
    ok: boolean,
    error?: string | null,
  ): Promise<PrintJobModel> {
    const job = await findOrThrow(PrintJobModel, id, "Print job not found");
    if (ok) {
      job.status = PRINT_JOB_STATUS.PRINTED;
      job.printedAt = new Date();
      job.error = null;
    } else {
      job.status =
        job.attempts >= MAX_ATTEMPTS
          ? PRINT_JOB_STATUS.FAILED
          : PRINT_JOB_STATUS.PENDING;
      job.error = error ?? "print failed";
    }
    return job.save();
  }

  static list(doc: TGetPrintJobs): Promise<TPaginationGeneric<PrintJobModel>> {
    const where: Record<string, unknown> = {};
    if (doc.status) where.status = doc.status;
    if (doc.printerKey?.trim()) where.printerKey = doc.printerKey.trim();
    return listPaginated(PrintJobModel, doc, {
      where,
      order: [["createdAt", "DESC"]],
    });
  }
}
