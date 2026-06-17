// Singleton config row — the meat-factory has one set of global thresholds.
// Stored in the DB so admin can edit via UI without env redeploys; secrets
// (Telegram bot token / chat id) live in .env instead — see TelegramService.
export type TSettings = {
  id: string;
  // Maximum cold storage capacity (kg). Used as the denominator on the
  // inventory analytics gauge.
  meatCapacityKg: number;
  // Trigger the Telegram alert when total meat stock crosses this value
  // (after an inbound movement).
  meatAlertThresholdKg: number;
  // Typical truck/cargo capacity (kg). Inventory page suggests how many
  // cargos to clear and the "Шинэ ачилт" shortcut prefills a shipment of
  // this size.
  cargoCapacityKg: number;
  // Set by the alert hook each time a notification fires — used to debounce
  // re-alerts (we only re-fire after a 24h cool-down OR after stock dropped
  // below threshold and re-crossed).
  lastAlertedAt: Date | null;
  // The stock kg at the moment of the last alert — lets us tell whether the
  // current ingest is the FIRST crossing in this cycle.
  lastAlertedStockKg: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TUpdateSettings = {
  meatCapacityKg?: number;
  meatAlertThresholdKg?: number;
  cargoCapacityKg?: number;
};
