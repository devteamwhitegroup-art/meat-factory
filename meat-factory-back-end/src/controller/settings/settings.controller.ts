import { SettingsModel } from "../../models/settings/settings.model";
import { TUpdateSettings } from "../../types/settings/settings.type";

export class SettingsController {
  // Returns the singleton row, creating it on first access with zeroes so the
  // FE can always read a record even before the admin configures anything.
  static async get(): Promise<SettingsModel> {
    const existing = await SettingsModel.findOne();
    if (existing) return existing;
    return await SettingsModel.create({
      meatCapacityKg: 0,
      exportAlertThresholdKg: 0,
      domesticAlertThresholdKg: 0,
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
    if (doc.exportAlertThresholdKg !== undefined) {
      const n = Number(doc.exportAlertThresholdKg);
      if (!Number.isFinite(n) || n < 0)
        throw new Error("exportAlertThresholdKg cannot be negative");
      row.exportAlertThresholdKg = n;
    }
    if (doc.domesticAlertThresholdKg !== undefined) {
      const n = Number(doc.domesticAlertThresholdKg);
      if (!Number.isFinite(n) || n < 0)
        throw new Error("domesticAlertThresholdKg cannot be negative");
      row.domesticAlertThresholdKg = n;
    }
    await row.save();
    return row;
  }
}
