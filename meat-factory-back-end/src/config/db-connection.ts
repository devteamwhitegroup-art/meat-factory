import { Sequelize, Options } from "sequelize";
import { setupModel } from "../models";
import config from ".";

const {
  POSTGRES_DB_USERNAME,
  POSTGRES_DB_HOST,
  POSTGRES_DB_PORT,
  POSTGRES_DB_PASSWORD,
  POSTGRES_DB_NAME,
  DB_SYNC_ON_START,
  DB_SYNC_ALTER,
} = config;

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

const options: Options = {
  username: POSTGRES_DB_USERNAME,
  password: POSTGRES_DB_PASSWORD,
  database: POSTGRES_DB_NAME,
  port: Number(POSTGRES_DB_PORT),
  dialect: "postgres",
  host: POSTGRES_DB_HOST,
  timezone: "+08:00",
  logging: false,
};

const sequelize = new Sequelize(options);

setupModel(sequelize);
export default sequelize;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDatabase = async (): Promise<void> => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      await sequelize.authenticate();
      if (DB_SYNC_ON_START) {
        // Single sync() resolves FK creation order internally — robust for
        // the many cross-referencing meat-factory tables. For destructive
        // schema changes on a dev DB, recreate the volume
        // (`docker compose down -v`) rather than relying on alter.
        await sequelize.sync({
          logging: false,
          force: false,
          alter: DB_SYNC_ALTER,
        });

        // Human-readable sequential registration number (Бүртгэлийн дугаар),
        // e.g. 8821. Idempotent; consumed via nextval() inside the
        // registration create transaction. Best-effort: must not crash boot.
        try {
          await sequelize.query(
            "CREATE SEQUENCE IF NOT EXISTS registration_number_seq START WITH 8821",
          );
        } catch (seqErr) {
          console.error(
            "⚠️ registration_number_seq create skipped:",
            seqErr instanceof Error ? seqErr.message : "unknown error",
          );
        }
      }

      console.log("✅ Database successfully connected");
      return;
    } catch (error) {
      retries++;
      console.error(
        `❌ Database connection attempt ${retries}/${MAX_RETRIES} failed:`,
        error instanceof Error ? error.message : "Unknown error",
      );

      if (retries === MAX_RETRIES) {
        throw new Error(
          `Failed to connect to database after ${MAX_RETRIES} attempts`,
        );
      }

      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await sleep(RETRY_DELAY);
    }
  }
};
