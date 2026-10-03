import {
  PRINT_JOB_STATUS,
  PRINT_JOB_TYPE,
} from "../../../types/print/print.type";
import { PaginationSchema } from "../global/global.type";

export default `#graphql
    enum PRINT_JOB_TYPE {
        ${Object.values(PRINT_JOB_TYPE).join("\n ")}
    }

    enum PRINT_JOB_STATUS {
        ${Object.values(PRINT_JOB_STATUS).join("\n ")}
    }

    type PrintJob {
        id: ID
        # Settings.printers[].id this job is routed to.
        printerKey: String
        # That printer's IP at enqueue time — where the relay sends the bytes.
        printerIp: String
        type: PRINT_JOB_TYPE
        refId: ID
        status: PRINT_JOB_STATUS
        # base64 ESC/POS bytes — consumed by the LAN relay, not the UI.
        payloadBase64: String
        attempts: Int
        error: String
        claimedAt: Date
        printedAt: Date
        createdAt: Date
        updatedAt: Date
    }

    type PrintJobResponse {
        success: Boolean
        message: String
        printJob: PrintJob
    }

    type PrintJobsResponse {
        success: Boolean
        message: String
        printJobs: [PrintJob]
        count: Int
    }

    type PrintPreviewResponse {
        success: Boolean
        message: String
        # The receipt rendered to a PNG data URL for an on-screen preview
        # before confirming the print (same raster that goes to the printer).
        image: String
    }

    extend type Query {
        printJobs(
            status: PRINT_JOB_STATUS
            printerKey: String
            ${PaginationSchema}
        ): PrintJobsResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        previewReceipt(type: PRINT_JOB_TYPE!, id: ID!): PrintPreviewResponse @authLogin
    }

    extend type Mutation {
        # Staff-facing: render a receipt for a record and queue it for a printer.
        # printerKey = a Settings.printers[].id (the printer the worker picked).
        enqueuePrint(type: PRINT_JOB_TYPE!, id: ID!, printerKey: String!): PrintJobResponse @authLogin

        # Queue a short test slip (no record needed) — Cyrillic + Mongolian + Latin.
        enqueuePrinterTest(printerKey: String!): PrintJobResponse @authLogin

        # Relay-only (guarded by the X-Print-Relay-Token header, not a JWT).
        # Returns the oldest job for any printer; the job carries printerIp.
        claimNextPrintJob: PrintJobResponse
        ackPrintJob(id: ID!, ok: Boolean!, error: String): PrintJobResponse
    }
`;
