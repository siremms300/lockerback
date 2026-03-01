// src/routes/admin.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasRole } from '../middleware/authorize.middleware';
import {
  // Merchants
  getAllMerchants,
  getMerchantById,
  updateMerchant,
  updateMerchantStatus,
  deleteMerchant,
  
  // Customers
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  
  // Invitations
  inviteMerchant,
  
  // Dashboard
  getAdminDashboardStats
} from '../controllers/admin.controller';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(hasRole(['admin', 'super_admin']));

// Dashboard
router.get('/dashboard/stats', getAdminDashboardStats);

// Merchant routes
router.get('/merchants', getAllMerchants);
router.get('/merchants/:id', getMerchantById);
router.put('/merchants/:id', updateMerchant);
router.patch('/merchants/:id/status', updateMerchantStatus);
router.delete('/merchants/:id', deleteMerchant);

// Customer routes
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.patch('/customers/:id/status', updateCustomerStatus);
router.delete('/customers/:id', deleteCustomer);

// Invitations
router.post('/invitations', inviteMerchant);

export default router;