import { HerderController } from '../../../controller/livestock/herder.controller';
import { HerderModel } from '../../../models/livestock/herder.model';
import { HerderAddressModel } from '../../../models/livestock/herder-address.model';
import {
  TCreateHerder,
  TListHerders,
  TUpdateHerder
} from '../../../types/livestock/herder.type';
import { wrapList, wrapOne, wrapVoid } from '../../../utils';

// Lazy-load the catalogue row when the controller didn't eager-include it
// (e.g. mutation responses that re-fetch without the include).
async function loadAddressEntry(
  row: HerderModel
): Promise<HerderAddressModel | null> {
  if (row.addressEntry) return row.addressEntry;
  if (!row.addressId) return null;
  return await HerderAddressModel.findByPk(row.addressId);
}

export default {
  Herder: {
    // Keeps the legacy `address: String` contract — every prior FE query
    // selecting `address` keeps reading a plain string. The catalogue name
    // wins; the free-form column is the fallback.
    address: async (row: HerderModel) => {
      const entry = await loadAddressEntry(row);
      return entry?.name ?? row.address ?? null;
    },
    addressEntry: async (row: HerderModel) => {
      return await loadAddressEntry(row);
    }
  },
  Query: {
    herders: wrapList('herders', (doc: TListHerders) =>
      HerderController.list(doc)
    ),
    herder: wrapOne('herder', ({ id }: { id: string }) =>
      HerderController.getById(id)
    )
  },
  Mutation: {
    createHerder: wrapOne(
      'herder',
      (doc: TCreateHerder) => HerderController.create(doc),
      'Herder created successfully'
    ),
    updateHerder: wrapOne(
      'herder',
      (doc: TUpdateHerder) => HerderController.update(doc),
      'Herder updated successfully'
    ),
    deleteHerder: wrapVoid('Herder deleted successfully', ({ id }: { id: string }) =>
      HerderController.remove(id)
    )
  }
};
