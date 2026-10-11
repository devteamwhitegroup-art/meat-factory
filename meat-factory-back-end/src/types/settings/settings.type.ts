
// Singleton config row — the meat-factory has one set of global thresholds.
// Stored in the DB so admin can edit via UI without env redeploys; secrets
// (Telegram bot token / chat id) live in .env instead — see TelegramService.
// A factory's LAN thermal printer (one per factory) the print relay can
// reach. `id` is what jobs carry as printerKey; `ip` is where the relay
// streams the bytes (port 9100). Staff print to their own factory's.
export type TPrinter = {
  id: string;
  factory: string;
  ip: string;
};

export type TSettings = {
  id: string;
  // Maximum cold storage capacity (kg). Used as the denominator on the
  // inventory analytics gauge.
  meatCapacityKg: number;
  // Trigger when kg reserved (cargo on non-delivered shipments) for the
  // EXPORT / DOMESTIC channel crosses this value — a backlog alert, since
  // meat is one shared pool that only splits by channel once loaded onto a
  // shipment. 0 disables.
  exportAlertThresholdKg: number;
  domesticAlertThresholdKg: number;
  // Admin-managed, one per factory.
  printers: TPrinter[];
  createdAt: Date;
  updatedAt: Date;
};

export type TUpdateSettings = {
  meatCapacityKg?: number;
  exportAlertThresholdKg?: number;
  domesticAlertThresholdKg?: number;
  // Replaces the whole list. Entries without an id are new printers.
  printers?: { id?: string | null; factory: string; ip: string }[];
};
