// src/routes/merchant.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  getProfile, 
  updateProfile, 
  generateApiKey, 
  getBilling 
} from '../controllers/merchant.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get merchant profile
router.get('/profile', getProfile);

// Update merchant profile
router.put('/profile', updateProfile);

// Generate API key
router.post('/api-key', generateApiKey);

// Get billing info
router.get('/billing', getBilling);

export default router;