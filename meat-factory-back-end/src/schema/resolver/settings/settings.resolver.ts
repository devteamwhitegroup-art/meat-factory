import { SettingsController } from '../../../controller/settings/settings.controller';
import { TUpdateSettings } from '../../../types/settings/settings.type';
import { wrapOne } from '../../../utils';

export default {
  Query: {
    settings: wrapOne('settings', () => SettingsController.get())
  },
  Mutation: {
    updateSettings: wrapOne(
      'settings',
      (doc: TUpdateSettings) => SettingsController.update(doc),
      'Тохиргоо хадгалагдлаа'
    )
  }
};
