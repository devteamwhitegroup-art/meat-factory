import { SettingsController } from '../../../controller/settings/settings.controller';

export default {
  Query: {
    settings: async () => {
      try {
        const row = await SettingsController.get();
        return {
          success: true,
          message: 'Success',
          settings: row
        };
      } catch (error) {
        return { success: false, message: error.message, settings: null };
      }
    }
  },
  Mutation: {
    updateSettings: async (_, doc) => {
      try {
        const row = await SettingsController.update(doc);
        return {
          success: true,
          message: 'Тохиргоо хадгалагдлаа',
          settings: row
        };
      } catch (error) {
        return { success: false, message: error.message, settings: null };
      }
    }
  }
};
