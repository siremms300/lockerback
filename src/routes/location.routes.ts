// src/routes/location.routes.ts (Updated with authorization)
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/authorize.middleware';
import { Permissions } from '../constants/permissions';
import { 
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationStats
} from '../controllers/location.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public routes (viewable by all authenticated users)
router.get('/', getAllLocations);
router.get('/:id', getLocationById);
router.get('/:id/stats', getLocationStats);

// Protected routes (admin only)
router.post('/', hasPermission(Permissions.CREATE_LOCATION), createLocation);
router.put('/:id', hasPermission(Permissions.EDIT_LOCATION), updateLocation);
router.delete('/:id', hasPermission(Permissions.DELETE_LOCATION), deleteLocation);

export default router;























































// // src/routes/location.routes.ts
// import express from 'express';
// import { authenticate } from '../middleware/auth.middleware';
// import { 
//   getAllLocations,
//   getLocationById,
//   createLocation,
//   updateLocation,
//   deleteLocation,
//   getLocationStats
// } from '../controllers/location.controller';

// const router = express.Router();

// // All routes require authentication
// router.use(authenticate);

// // Location routes
// router.get('/', getAllLocations);
// router.get('/:id', getLocationById);
// router.post('/', createLocation);
// router.put('/:id', updateLocation);
// router.delete('/:id', deleteLocation);
// router.get('/:id/stats', getLocationStats);

// export default router;