import "dotenv/config";

export default {
  PORT: process.env.PORT || 8080,
  POSTGRES_DB_NAME: process.env.POSTGRES_DB_NAME || "",
  POSTGRES_DB_USERNAME: process.env.POSTGRES_DB_USERNAME || "",
  POSTGRES_DB_HOST: process.env.POSTGRES_DB_HOST || "",
  POSTGRES_DB_PORT: process.env.POSTGRES_DB_PORT || 5432,
  POSTGRES_DB_PASSWORD: process.env.POSTGRES_DB_PASSWORD || "",

  ADMIN_JWT_TOKEN_SALT: process.env.ADMIN_JWT_TOKEN_SALT || "",
  PASSWORD_HASH_SALT: parseInt(process.env.PASSWORD_HASH_SALT || "0"),

  SPACE_BUCKET_NAME: process.env.SPACE_BUCKET_NAME || "",
  SPACE_ENDPOINT: process.env.SPACE_ENDPOINT || "",
  SPACE_REGION: process.env.SPACE_REGION || "",
  SPACE_ACCESS_KEY: process.env.SPACE_ACCESS_KEY || "",
  SPACE_SECRET_KEY: process.env.SPACE_SECRET_KEY || "",

  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "",

  DB_SYNC_ON_START:
    (process.env.POSTGRES_SYNC_ON_START || "false").toLowerCase() === "true",
  DB_SYNC_ALTER:
    (process.env.POSTGRES_SYNC_ALTER || "false").toLowerCase() === "true",

  // 80mm thermal receipt printing (src/controller/print + relay/relay.mjs).
  // Shared secret the LAN relay sends as X-Print-Relay-Token; claim/ack are
  // refused unless it matches (and unless this is set at all).
  PRINT_RELAY_TOKEN: process.env.PRINT_RELAY_TOKEN || "",
  // Big centred title line on every receipt. Keep ASCII until ESCPOS_CODEPAGE
  // is tuned for Mongolian, then set your Cyrillic company name here.
  RECEIPT_HEADER: process.env.RECEIPT_HEADER || "White Group",
  // Factory contact phone(s) printed under the title, e.g. "9911-2233,
  // 8800-1122". Empty = line omitted.
  RECEIPT_PHONE: process.env.RECEIPT_PHONE || "",
  // `ESC t n` code-page slot. 6 = CP866 (Cyrillic). If Mongolian Ө/Ү print
  // wrong, run enqueueCodepageSampler and set the slot that renders them.
  ESCPOS_CODEPAGE: Number(process.env.ESCPOS_CODEPAGE ?? 6),

  // eBarimt PosAPI 3.0 (src/controller/livestock/ebarimt.controller.ts).
  // Base URL of the PosAPI service, e.g. http://192.168.1.20:7080 - must be
  // reachable from this server. Empty = feature disabled (mutation errors).
  EBARIMT_POSAPI_URL: process.env.EBARIMT_POSAPI_URL || "",
  // The factory company's TIN (11 digits): issuer AND buyer of every receipt.
  EBARIMT_MERCHANT_TIN: process.env.EBARIMT_MERCHANT_TIN || "",
  // Internal POS number registered in Operator-eBarimt.
  EBARIMT_POS_NO: process.env.EBARIMT_POS_NO || "",
  // Branch number (3 digits) and aimag/soum districtCode (4 digits, from
  // api.ebarimt.mn/api/info/check/getBranchInfo).
  EBARIMT_BRANCH_NO: process.env.EBARIMT_BRANCH_NO || "001",
  EBARIMT_DISTRICT_CODE: process.env.EBARIMT_DISTRICT_CODE || "",
  // VAT_FREE taxProductCode for meat bought from herders.
  EBARIMT_TAX_PRODUCT_CODE: process.env.EBARIMT_TAX_PRODUCT_CODE || "487",
};
