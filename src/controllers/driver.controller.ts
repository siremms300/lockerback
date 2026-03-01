import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Driver, Parcel } from '../models'

// Driver login
export const driverLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, pin } = req.body
    
    if (!phone || !pin) {
      res.status(400).json({ error: 'Phone and PIN are required' })
      return
    }
    
    const driver = await Driver.findOne({ phone })
    if (!driver) {
      res.status(401).json({ error: 'Driver not found' })
      return
    }
    
    // Compare PIN (hashed in production)
    if (driver.pin !== pin) {
      res.status(401).json({ error: 'Invalid PIN' })
      return
    }
    
    // Update last login
    driver.lastLogin = new Date()
    await driver.save()
    
    // Generate token
    const token = jwt.sign(
      { id: driver._id, role: 'driver' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )
    
    res.json({
      success: true,
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicle: driver.vehicle,
        isActive: driver.isActive
      }
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// Get today's deliveries
export const getTodayDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const parcels = await Parcel.find({
      status: { $in: ['created', 'in_transit'] }
    })
      .populate('location', 'name address coordinates')
      .populate('merchant', 'businessName')
      .sort({ createdAt: -1 })
      .limit(50)
    
    // Format response
    const formattedParcels = parcels.map(parcel => ({
      id: parcel._id,
      trackingNumber: parcel.trackingNumber,
      customer: parcel.customer,
      location: parcel.location,
      status: parcel.delivery.status,
      payment: parcel.payment,
      createdAt: parcel.createdAt
    }))
    
    res.json({
      success: true,
      count: parcels.length,
      parcels: formattedParcels
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// Sync offline data
export const syncOfflineData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scans = [], parcels: newParcels = [] } = req.body
    
    const results = {
      scansProcessed: 0,
      parcelsCreated: 0,
      errors: [] as string[]
    }
    
    // Process scans
    for (const scan of scans) {
      try {
        const parcel = await Parcel.findById(scan.parcelId)
        if (parcel) {
          parcel.delivery.status = scan.scanType === 'delivery' ? 'delivered' : 'in_transit'
          
          if (scan.scanType === 'delivery' && parcel.payment.isCOD) {
            parcel.payment.collected = true
          }
          
          parcel.events.push({
            status: parcel.delivery.status,
            description: `Scanned by driver (offline sync)`,
            timestamp: new Date(scan.scanTime || Date.now())
          })
          
          await parcel.save()
          results.scansProcessed++
        }
      } catch (error: any) {
        results.errors.push(`Scan ${scan.parcelId}: ${error.message}`)
      }
    }
    
    // Process new parcels (created offline)
    for (const parcelData of newParcels) {
      try {
        // In production, validate and sanitize data
        const parcel = new Parcel({
          ...parcelData,
          merchant: req.user._id,
          createdAt: new Date(parcelData.createdAt || Date.now())
        })
        
        await parcel.save()
        results.parcelsCreated++
      } catch (error: any) {
        results.errors.push(`Parcel creation: ${error.message}`)
      }
    }
    
    res.json({
      success: true,
      message: 'Sync completed',
      results
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// Scan parcel
export const scanParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingNumber, scanType = 'delivery', locationId } = req.body
    
    if (!trackingNumber) {
      res.status(400).json({ error: 'Tracking number is required' })
      return
    }
    
    const parcel = await Parcel.findOne({ trackingNumber })
    if (!parcel) {
      res.status(404).json({ error: 'Parcel not found' })
      return
    }
    
    // Update parcel status
    const newStatus = scanType === 'delivery' ? 'delivered' : 'at_location'
    parcel.delivery.status = newStatus
    
    // If delivery, mark COD as collected
    if (scanType === 'delivery' && parcel.payment.isCOD) {
      parcel.payment.collected = true
    }
    
    // Add location if provided
    if (locationId) {
      parcel.delivery.location = locationId
    }
    
    // Log the event
    parcel.events.push({
      status: newStatus,
      description: `Scanned by driver ${req.user.name || ''}`,
      timestamp: new Date()
    })
    
    await parcel.save()
    
    // Real-time update for merchant
    // You would emit socket event here
    
    res.json({ 
      success: true, 
      message: `Parcel marked as ${newStatus}`,
      parcel: {
        id: parcel._id,
        trackingNumber: parcel.trackingNumber,
        status: parcel.delivery.status,
        customer: parcel.customer,
        payment: parcel.payment
      }
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// Update driver location
export const updateDriverLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body
    
    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' })
      return
    }
    
    await Driver.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          lat,
          lng,
          lastUpdated: new Date()
        }
      },
      { new: true }
    )
    
    res.json({ 
      success: true, 
      message: 'Location updated',
      location: { lat, lng, timestamp: new Date() }
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// Get driver profile
export const getDriverProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await Driver.findById(req.user._id).select('-pin')
    
    if (!driver) {
      res.status(404).json({ error: 'Driver not found' })
      return
    }
    
    // Get stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaysDeliveries = await Parcel.countDocuments({
      'delivery.status': 'delivered',
      updatedAt: { $gte: today }
    })
    
    const pendingDeliveries = await Parcel.countDocuments({
      'delivery.status': { $in: ['created', 'in_transit', 'at_location'] }
    })
    
    const codToCollect = await Parcel.aggregate([
      {
        $match: {
          'payment.isCOD': true,
          'payment.collected': false,
          'delivery.status': { $in: ['in_transit', 'at_location'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.amount' }
        }
      }
    ])
    
    res.json({
      success: true,
      driver,
      stats: {
        todaysDeliveries,
        pendingDeliveries,
        codToCollect: codToCollect[0]?.total || 0
      }
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// Update driver profile
export const updateDriverProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body
    
    // Remove sensitive fields
    delete updates.pin
    delete updates._id
    delete updates.createdAt
    delete updates.updatedAt
    
    const driver = await Driver.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-pin')
    
    if (!driver) {
      res.status(404).json({ error: 'Driver not found' })
      return
    }
    
    res.json({
      success: true,
      message: 'Profile updated',
      driver
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}




