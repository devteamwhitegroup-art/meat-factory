import { Op, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { ByproductLogModel } from "../../models/livestock/byproduct-log.model";
import { VerificationModel } from "../../models/livestock/verification.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AnimalController } from "./animal.controller";
import { ByproductConstantController } from "./byproduct-constant.controller";
import { RegistrationController } from "./registration.controller";
import {
  ANIMAL_TYPE,
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import { TByproductItemInput } from "../../types/livestock/byproduct-log.type";
import { TDateRange } from "../../types/dashboard/dashboard.type";
import { TContext } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";

// Byproduct (Дайвар) logs — sub-domain of the registration aggregate. Shared
// status/role guards and registration lookups live on RegistrationController.
export class ByproductLogController {
  // Suggested byproducts for a registration = active constants × animal counts.
  static async derivedByproducts(registrationId: string) {
    await RegistrationController.findIdCheck(registrationId);
    const lines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId },
      include: [{ model: AnimalModel, as: "animal" }],
    });
    const counts: Record<string, number> = {};
    for (const l of lines) {
      const t = l.animal?.animalType;
      if (t) counts[t] = l.count;
    }
    return await ByproductConstantController.deriveForCounts(counts);
  }

  // Replace this registration's byproduct rows with the confirmed list
  // (derived from constants, quantities adjustable by the storekeeper).
  static async setRegistrationByproducts(
    registrationId: string,
    items: TByproductItemInput[],
    context: TContext,
  ): Promise<ByproductLogModel[]> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(registrationId);
    RegistrationController.assertStatus(reg, [REGISTRATION_STATUS.WEIGHED]);

    const clean = (items ?? []).filter(
      (i) => i.name && i.name.trim() && Number(i.quantity) > 0,
    );

    // Resolve every distinct animalType that appears in the input to an
    // animalId in one bulk lookup.
    const distinctTypes = Array.from(
      new Set(
        clean.map((i) => i.animalType).filter((t): t is ANIMAL_TYPE => !!t),
      ),
    );
    const typeToId = await AnimalController.mapTypesToIds(distinctTypes);

    await sequelize.transaction(async (t) => {
      await ByproductLogModel.destroy({
        where: { registrationId },
        transaction: t,
      });
      if (clean.length > 0) {
        await ByproductLogModel.bulkCreate(
          clean.map((i) => {
            const quantity = Math.floor(Number(i.quantity));
            const weightKg =
              i.weightKg != null && i.weightKg !== undefined
                ? Number(Number(i.weightKg).toFixed(2))
                : null;
            return {
              registrationId,
              name: i.name.trim(),
              animalId: i.animalType ? (typeToId[i.animalType] ?? null) : null,
              canCoverSlaughterCost: !!i.canCoverSlaughterCost,
              count: quantity,
              averageWeightKg:
                weightKg != null && quantity > 0
                  ? Number((weightKg / quantity).toFixed(2))
                  : null,
              totalWeightKg: weightKg,
              loggedById: context.id,
              photoFileId: null,
            };
          }),
          { transaction: t },
        );
      }
    });

    return await ByproductLogModel.findAll({
      where: { registrationId },
      include: [{ model: AnimalModel, as: "animal" }],
      // animal_type ordering means joining Animals; sort by name only here.
      order: [["name", "ASC"]],
    });
  }

  // Aggregated byproduct output for handoff to the downstream factory
  // (quantity + weight by name; no price in this system).
  static async byproductHandoff(dateRange?: TDateRange) {
    const where: WhereOptions = {};
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      const r: Record<symbol, Date> = {};
      if (dateRange.startDate) r[Op.gte] = new Date(dateRange.startDate);
      if (dateRange.endDate) r[Op.lte] = new Date(dateRange.endDate);
      Object.assign(where, { createdAt: r });
    }
    const rows = await ByproductLogModel.findAll({
      where,
      include: [{ model: AnimalModel, as: "animal" }],
    });

    // Ownership rule per row:
    //   canCoverSlaughterCost = false  → factory storage always.
    //   canCoverSlaughterCost = true   → factory only if the registration's
    //                                    verification.slaughterCoveredByByproduct
    //                                    is true (else herder keeps it).
    const regIds = Array.from(new Set(rows.map((r) => r.registrationId)));
    const verifications =
      regIds.length > 0
        ? await VerificationModel.findAll({
            where: { registrationId: { [Op.in]: regIds } },
          })
        : [];
    const coveredByReg: Record<string, boolean> = {};
    for (const v of verifications)
      coveredByReg[v.registrationId] = !!v.slaughterCoveredByByproduct;

    const factoryRows = rows.filter((r) => {
      const cc = !!r.canCoverSlaughterCost;
      if (!cc) return true;
      return coveredByReg[r.registrationId] === true;
    });

    const map: Record<
      string,
      {
        animalType: string | null;
        name: string;
        totalQuantity: number;
        totalWeightKg: number;
      }
    > = {};
    for (const b of factoryRows) {
      const at = b.animal?.animalType ?? null;
      const name = b.name ?? "OTHER";
      const key = `${at ?? ""}|${name}`;
      if (!map[key])
        map[key] = {
          animalType: at,
          name,
          totalQuantity: 0,
          totalWeightKg: 0,
        };
      map[key].totalQuantity += Number(b.count ?? 0);
      map[key].totalWeightKg += Number(b.totalWeightKg ?? 0);
    }
    return Object.values(map)
      .map((x) => ({
        ...x,
        totalWeightKg: Number(x.totalWeightKg.toFixed(2)),
      }))
      .sort(
        (a, b) =>
          (a.animalType ?? "").localeCompare(b.animalType ?? "") ||
          a.name.localeCompare(b.name),
      );
  }
}
