// src/routes/driver.routes.ts (you already have this)
import express from 'express'
import { 
  driverLogin,
  getTodayDeliveries,
  syncOfflineData,
  scanParcel,
  updateDriverLocation,
  getDriverProfile,
  updateDriverProfile
} from '../controllers/driver.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = express.Router()

// Public routes
router.post('/login', driverLogin)

// Protected routes
router.use(authenticate)
router.get('/deliveries/today', getTodayDeliveries)
router.post('/scan', scanParcel)
router.post('/sync', syncOfflineData)
router.post('/location', updateDriverLocation)
router.get('/profile', getDriverProfile)
router.put('/profile', updateDriverProfile)

export default router