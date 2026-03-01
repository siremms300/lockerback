// routes/parcel.routes.ts - Add filter endpoint
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  createParcel, 
  getParcelsWithFilters, 
  getParcelById, 
  updateParcel, 
  deleteParcel,
  getParcelAnalytics 
} from '../controllers/parcel.controller';

const router = express.Router();

router.use(authenticate);

// New filtered endpoint
router.get('/', getParcelsWithFilters);

router.post('/', createParcel);
router.get('/analytics', getParcelAnalytics);
router.get('/:id', getParcelById);
router.put('/:id', updateParcel);
router.delete('/:id', deleteParcel);

export default router;

























































// // src/routes/parcel.routes.ts
// import express from 'express';
// import { authenticate } from '../middleware/auth.middleware';
// import { 
//   createParcel, 
//   getParcels, 
//   getParcelById, 
//   updateParcel, 
//   deleteParcel,
//   getParcelAnalytics 
// } from '../controllers/parcel.controller';

// const router = express.Router();

// // All routes require authentication
// router.use(authenticate);

// // Create a new parcel
// router.post('/', createParcel);

// // Get all parcels with optional filtering
// router.get('/', getParcels);

// // Get parcel analytics
// router.get('/analytics', getParcelAnalytics);

// // Get single parcel by ID
// router.get('/:id', getParcelById);

// // Update parcel
// router.put('/:id', updateParcel);

// // Delete parcel
// router.delete('/:id', deleteParcel);

// export default router;



