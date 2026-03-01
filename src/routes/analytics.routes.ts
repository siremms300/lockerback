// src/routes/analytics.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getDashboardAnalytics } from '../controllers/analytics.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard analytics - Make sure this is a function reference, not a call
router.get('/dashboard', getDashboardAnalytics);

export default router;