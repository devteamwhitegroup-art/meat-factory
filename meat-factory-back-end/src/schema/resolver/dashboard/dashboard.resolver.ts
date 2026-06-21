import { DashboardController } from '../../../controller/dashboard/dashboard.controller';
import { TGetDashboard } from '../../../types/dashboard/dashboard.type';
import { wrapOne } from '../../../utils';

export default {
  Query: {
    dashboard: wrapOne('dashboard', (doc: TGetDashboard) =>
      DashboardController.getDashboard(doc)
    )
  }
};
