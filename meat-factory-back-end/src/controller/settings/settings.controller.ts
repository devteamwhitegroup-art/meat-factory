import { SettingsModel } from "../../models/settings/settings.model";
import { TSettings, TUpdateSettings } from "../../types/settings/settings.type";

export class SettingsController {
  // Returns the singleton row, creating it on first access with zeroes so the
  // FE can always read a record even before the admin configures anything.
  static async get(): Promise<SettingsModel> {
    const existing = await SettingsModel.findOne();
    if (existing) return existing;
    return await SettingsModel.create({
      meatCapacityKg: 0,
      meatAlertThresholdKg: 0,
      cargoCapacityKg: 0,
      lastAlertedAt: null,
      lastAlertedStockKg: 0,
    });
  }

  static async update(doc: TUpdateSettings): Promise<SettingsModel> {
    const row = await this.get();
    if (doc.meatCapacityKg !== undefined) {
      const n = Number(doc.meatCapacityKg);
      if (!Number.isFinite(n) || n < 0)
        throw new Error("meatCapacityKg cannot be negative");
      row.meatCapacityKg = n;
    }
    if (doc.meatAlertThresholdKg !== undefined) {
      const n = Number(doc.meatAlertThresholdKg);
      if (!Number.isFinite(n) || n < 0)
        throw new Error("meatAlertThresholdKg cannot be negative");
      row.meatAlertThresholdKg = n;
    }
    if (doc.cargoCapacityKg !== undefined) {
      const n = Number(doc.cargoCapacityKg);
      if (!Number.isFinite(n) || n < 0)
        throw new Error("cargoCapacityKg cannot be negative");
      row.cargoCapacityKg = n;
    }
    await row.save();
    return row;
  }

  // Stamp the alert-state fields after a Telegram message goes out. Used by
  // the inventory ingestion hook to debounce re-alerts.
  static async stampAlert(stockKg: number): Promise<void> {
    const row = await this.get();
    row.lastAlertedAt = new Date();
    row.lastAlertedStockKg = stockKg;
    await row.save();
  }

  // Plain DTO for downstream consumers.
  static toDTO(row: SettingsModel): TSettings {
    return {
      id: row.id,
      meatCapacityKg: Number(row.meatCapacityKg),
      meatAlertThresholdKg: Number(row.meatAlertThresholdKg),
      cargoCapacityKg: Number(row.cargoCapacityKg),
      lastAlertedAt: row.lastAlertedAt,
      lastAlertedStockKg: Number(row.lastAlertedStockKg),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
