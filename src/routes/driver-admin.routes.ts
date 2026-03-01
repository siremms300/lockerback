// src/routes/driver-admin.routes.ts (Updated)
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/authorize.middleware';
import { Permissions } from '../constants/permissions';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverDeliveries,
  getDriverAnalytics
} from '../controllers/driver-admin.controller';

const router = express.Router();

router.use(authenticate);

// View routes (merchants can view)
router.get('/', hasPermission(Permissions.VIEW_DRIVERS), getAllDrivers);
router.get('/analytics', hasPermission(Permissions.VIEW_DRIVERS), getDriverAnalytics);
router.get('/:id', hasPermission(Permissions.VIEW_DRIVERS), getDriverById);
router.get('/:id/deliveries', hasPermission(Permissions.VIEW_DRIVERS), getDriverDeliveries);

// Write routes (admin only for creation/editing)
router.post('/', hasPermission(Permissions.CREATE_DRIVER), createDriver);
router.put('/:id', hasPermission(Permissions.EDIT_DRIVER), updateDriver);
router.delete('/:id', hasPermission(Permissions.DELETE_DRIVER), deleteDriver);

export default router;













































// // src/routes/driver-admin.routes.ts
// import express from 'express';
// import { authenticate } from '../middleware/auth.middleware';
// import {
//   getAllDrivers,
//   getDriverById,
//   createDriver,
//   updateDriver,
//   deleteDriver,
//   getDriverDeliveries,
//   getDriverAnalytics
// } from '../controllers/driver-admin.controller';

// const router = express.Router();

// router.use(authenticate);

// router.get('/', getAllDrivers);
// router.get('/analytics', getDriverAnalytics);
// router.get('/:id', getDriverById);
// router.get('/:id/deliveries', getDriverDeliveries);
// router.post('/', createDriver);
// router.put('/:id', updateDriver);
// router.delete('/:id', deleteDriver);

// export default router;