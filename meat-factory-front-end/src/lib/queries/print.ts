import { graphql } from "@/lib/gql/gql";

// Renders the receipt to a PNG data URL so the print dialog can show exactly
// what will print before the job is queued.
export const PreviewReceiptDoc = graphql(/* GraphQL */ `
  query PreviewReceipt($type: PRINT_JOB_TYPE!, $id: ID!) {
    previewReceipt(type: $type, id: $id) {
      success
      message
      image
    }
  }
`);

// Renders a receipt for a record (sale / shipment / settlement) and queues it
// for the printer the worker picked (printerKey = Settings printer id).
export const EnqueuePrintDoc = graphql(/* GraphQL */ `
  mutation EnqueuePrint(
    $type: PRINT_JOB_TYPE!
    $id: ID!
    $printerKey: String!
  ) {
    enqueuePrint(type: $type, id: $id, printerKey: $printerKey) {
      success
      message
      printJob {
        id
        status
      }
    }
  }
`);

// Queues a short test slip (no source record) — end-to-end check that also
// shows Cyrillic + Mongolian Ө Ү + Latin render correctly.
export const EnqueuePrinterTestDoc = graphql(/* GraphQL */ `
  mutation EnqueuePrinterTest($printerKey: String!) {
    enqueuePrinterTest(printerKey: $printerKey) {
      success
      message
      printJob {
        id
        status
      }
    }
  }
`);
