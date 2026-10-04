import config from "../../../config";
import { errorMessage, wrapList, wrapOne } from "../../../utils";
import { TBaseContext } from "../../../types/global/global.type";
import { PrintController } from "../../../controller/print/print.controller";
import { PRINT_JOB_TYPE, TGetPrintJobs } from "../../../types/print/print.type";

// claimNextPrintJob / ackPrintJob are called by the LAN relay process, not a
// logged-in user — so they're guarded by a shared secret header instead of the
// @auth directive. See index.ts (X-Print-Relay-Token) and relay/relay.mjs.
const assertRelay = (ctx: TBaseContext): void => {
  if (!config.PRINT_RELAY_TOKEN)
    throw new Error("PRINT_RELAY_TOKEN is not configured");
  if (ctx.relayToken !== config.PRINT_RELAY_TOKEN)
    throw new Error("Invalid print relay token");
};

export default {
  Query: {
    printJobs: wrapList("printJobs", (doc: TGetPrintJobs) =>
      PrintController.list(doc),
    ),
    previewReceipt: wrapOne(
      "image",
      ({ type, id }: { type: PRINT_JOB_TYPE; id: string }) =>
        PrintController.preview(type, id),
    ),
  },
  Mutation: {
    enqueuePrint: wrapOne(
      "printJob",
      ({
        type,
        id,
        printerKey,
      }: {
        type: PRINT_JOB_TYPE;
        id: string;
        printerKey: string;
      }) => PrintController.enqueue(type, id, printerKey),
      "Хэвлэхээр дараалалд орууллаа",
    ),
    enqueuePrinterTest: wrapOne(
      "printJob",
      ({ printerKey }: { printerKey: string }) =>
        PrintController.enqueuePrinterTest(printerKey),
      "Тест хэвлэлт дараалалд орлоо",
    ),
    claimNextPrintJob: async (
      _: unknown,
      args: { printerKeys?: string[] | null },
      ctx: TBaseContext,
    ) => {
      try {
        assertRelay(ctx);
        const printJob = await PrintController.claimNext(args.printerKeys);
        return {
          success: true,
          message: printJob ? "claimed" : "empty",
          printJob,
        };
      } catch (error) {
        return { success: false, message: errorMessage(error), printJob: null };
      }
    },
    ackPrintJob: async (
      _: unknown,
      args: { id: string; ok: boolean; error?: string | null },
      ctx: TBaseContext,
    ) => {
      try {
        assertRelay(ctx);
        const printJob = await PrintController.ack(
          args.id,
          args.ok,
          args.error ?? null,
        );
        return { success: true, message: "ack", printJob };
      } catch (error) {
        return { success: false, message: errorMessage(error), printJob: null };
      }
    },
  },
};
