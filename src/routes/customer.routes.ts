// src/routes/customer.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPickups,
  getCustomerAnalytics
} from '../controllers/customer.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllCustomers);
router.get('/analytics', getCustomerAnalytics);
router.get('/:id', getCustomerById);
router.get('/:id/pickups', getCustomerPickups);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;