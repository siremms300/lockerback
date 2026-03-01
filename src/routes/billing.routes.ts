// src/routes/billing.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getWallet,
  updateWallet,
  getInvoices,
  getInvoiceById,
  getTransactions,
  initializeTopUp,
  verifyTopUp,
  getCODSummary,
  getBillingAnalytics,
  setupAutoTopUp
} from '../controllers/billing.controller';

const router = express.Router();

router.use(authenticate);

// Wallet
router.get('/wallet', getWallet);
router.put('/wallet', updateWallet);
router.post('/wallet/topup/initialize', initializeTopUp);
router.get('/wallet/topup/verify/:reference', verifyTopUp);
router.post('/wallet/autotopup', setupAutoTopUp);

// Invoices
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);

// Transactions
router.get('/transactions', getTransactions);

// COD
router.get('/cod/summary', getCODSummary);

// Analytics
router.get('/analytics', getBillingAnalytics);

export default router;