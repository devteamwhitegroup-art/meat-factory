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

  // Telegram bot used for storage-threshold alerts. Both must be set for the
  // alert to fire; otherwise the helper logs and skips.
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",

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
};
