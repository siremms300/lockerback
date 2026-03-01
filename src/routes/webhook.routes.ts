// src/routes/webhook.routes.ts
import express from 'express';
import { 
  handleLockerStatus, 
  handlePaymentWebhook 
} from '../controllers/webhook.controller';

const router = express.Router();

// Locker status webhook (public endpoint)
router.post('/locker-status', handleLockerStatus);

// Payment webhook (public endpoint)
router.post('/payment', handlePaymentWebhook);

export default router;