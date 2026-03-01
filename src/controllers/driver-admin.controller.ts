// src/controllers/driver-admin.controller.ts
import { Request, Response } from 'express';
import Driver from '../models/Driver';
import Parcel from '../models/Parcel';

export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query: any = { merchantId: req.user._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'vehicle.plateNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    const drivers = await Driver.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    const total = await Driver.countDocuments(query);
    
    // Get stats for each driver
    const driversWithStats = await Promise.all(drivers.map(async (driver) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completedToday = await Parcel.countDocuments({
        driverId: driver._id,
        'delivery.status': 'picked_up',
        updatedAt: { $gte: today }
      });
      
      const totalDeliveries = await Parcel.countDocuments({
        driverId: driver._id,
        'delivery.status': 'picked_up'
      });
      
      const codCollected = await Parcel.aggregate([
        {
          $match: {
            driverId: driver._id,
            'payment.isCOD': true,
            'payment.collected': true
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$payment.amount' }
          }
        }
      ]);
      
      return {
        ...driver.toObject(),
        stats: {
          totalDeliveries,
          completedToday,
          rating: driver.rating || 4.5,
          totalEarnings: codCollected[0]?.total || 0
        }
      };
    }));
    
    return res.json({
      drivers: driversWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getDriverById = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findOne({
      _id: req.params.id,
      merchantId: req.user._id
    });
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    // Get driver's deliveries
    const deliveries = await Parcel.find({
      driverId: driver._id
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('delivery.location', 'name');
    
    return res.json({ driver, deliveries });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const existingDriver = await Driver.findOne({
      merchantId: req.user._id,
      phone: req.body.phone
    });
    
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver with this phone already exists' });
    }
    
    const driver = new Driver({
      ...req.body,
      merchantId: req.user._id,
      status: 'inactive',
      joinedDate: new Date()
    });
    
    await driver.save();
    return res.status(201).json(driver);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    return res.json(driver);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.user._id
    });
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    return res.json({ message: 'Driver deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getDriverDeliveries = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findOne({
      _id: req.params.id,
      merchantId: req.user._id
    });
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    const deliveries = await Parcel.find({
      driverId: driver._id,
      'delivery.status': { $in: ['in_transit', 'at_location', 'ready_for_pickup'] }
    })
      .sort({ createdAt: -1 })
      .populate('delivery.location', 'name address coordinates');
    
    const formattedDeliveries = deliveries.map(p => ({
      id: p._id,
      trackingNumber: p.trackingNumber,
      status: p.delivery.status,
      location: (p.delivery.location as any)?.name || 'Unknown',
      codAmount: p.payment.isCOD ? p.payment.amount : 0,
      collected: p.payment.collected,
      items: p.items,
      customer: p.customer
    }));
    
    return res.json(formattedDeliveries);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getDriverAnalytics = async (req: Request, res: Response) => {
  try {
    const merchantId = req.user._id;
    
    const totalDrivers = await Driver.countDocuments({ merchantId });
    const activeDrivers = await Driver.countDocuments({ 
      merchantId, 
      status: { $in: ['active', 'on_delivery'] }
    });
    const onDelivery = await Driver.countDocuments({ merchantId, status: 'on_delivery' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalParcelsToday = await Parcel.countDocuments({
      merchant: merchantId,
      driverId: { $exists: true },
      updatedAt: { $gte: today }
    });
    
    const codPending = await Parcel.aggregate([
      {
        $match: {
          merchant: merchantId,
          driverId: { $exists: true },
          'payment.isCOD': true,
          'payment.collected': false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.amount' }
        }
      }
    ]);
    
    const deliveriesCompleted = await Parcel.countDocuments({
      merchant: merchantId,
      driverId: { $exists: true },
      'delivery.status': 'picked_up'
    });
    
    const totalDeliveries = await Parcel.countDocuments({
      merchant: merchantId,
      driverId: { $exists: true }
    });
    
    const completionRate = totalDeliveries > 0 
      ? Math.round((deliveriesCompleted / totalDeliveries) * 100) 
      : 0;
    
    return res.json({
      overview: {
        totalDrivers,
        activeDrivers,
        onDelivery,
        totalParcelsToday,
        codPending: codPending[0]?.total || 0,
        completionRate
      },
      performance: {
        avgDeliveryTime: '2.4 hours',
        onTimeRate: '94%',
        fuelEfficiency: '18km/L',
        codCollectionRate: '96%',
        customerRating: '4.8/5'
      }
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};



























































// // src/controllers/driver-admin.controller.ts
// import { Request, Response } from 'express';
// import Driver from '../models/Driver';
// import Parcel from '../models/Parcel';

// export const getAllDrivers = async (req: Request, res: Response) => {
//   try {
//     const { status, search, page = 1, limit = 20 } = req.query;
    
//     const query: any = { merchantId: req.user._id };
    
//     if (status && status !== 'all') {
//       query.status = status;
//     }
    
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { phone: { $regex: search, $options: 'i' } },
//         { 'vehicle.plateNumber': { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     const drivers = await Driver.find(query)
//       .sort({ createdAt: -1 })
//       .skip((Number(page) - 1) * Number(limit))
//       .limit(Number(limit));
    
//     const total = await Driver.countDocuments(query);
    
//     // Get stats for each driver
//     const driversWithStats = await Promise.all(drivers.map(async (driver) => {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       const completedToday = await Parcel.countDocuments({
//         driverId: driver._id,
//         'delivery.status': 'picked_up',
//         updatedAt: { $gte: today }
//       });
      
//       const totalDeliveries = await Parcel.countDocuments({
//         driverId: driver._id,
//         'delivery.status': 'picked_up'
//       });
      
//       const codCollected = await Parcel.aggregate([
//         {
//           $match: {
//             driverId: driver._id,
//             'payment.isCOD': true,
//             'payment.collected': true
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: '$payment.amount' }
//           }
//         }
//       ]);
      
//       return {
//         ...driver.toObject(),
//         stats: {
//           totalDeliveries,
//           completedToday,
//           rating: driver.rating || 4.5,
//           totalEarnings: codCollected[0]?.total || 0
//         }
//       };
//     }));
    
//     res.json({
//       drivers: driversWithStats,
//       pagination: {
//         page: Number(page),
//         limit: Number(limit),
//         total,
//         pages: Math.ceil(total / Number(limit))
//       }
//     });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getDriverById = async (req: Request, res: Response) => {
//   try {
//     const driver = await Driver.findOne({
//       _id: req.params.id,
//       merchantId: req.user._id
//     });
    
//     if (!driver) {
//       return res.status(404).json({ error: 'Driver not found' });
//     }
    
//     // Get driver's deliveries
//     const deliveries = await Parcel.find({
//       driverId: driver._id
//     })
//       .sort({ createdAt: -1 })
//       .limit(20)
//       .populate('delivery.location', 'name');
    
//     res.json({ driver, deliveries });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const createDriver = async (req: Request, res: Response) => {
//   try {
//     const existingDriver = await Driver.findOne({
//       merchantId: req.user._id,
//       phone: req.body.phone
//     });
    
//     if (existingDriver) {
//       return res.status(400).json({ error: 'Driver with this phone already exists' });
//     }
    
//     const driver = new Driver({
//       ...req.body,
//       merchantId: req.user._id,
//       status: 'inactive',
//       joinedDate: new Date()
//     });
    
//     await driver.save();
//     res.status(201).json(driver);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const updateDriver = async (req: Request, res: Response) => {
//   try {
//     const driver = await Driver.findOneAndUpdate(
//       { _id: req.params.id, merchantId: req.user._id },
//       req.body,
//       { new: true, runValidators: true }
//     );
    
//     if (!driver) {
//       return res.status(404).json({ error: 'Driver not found' });
//     }
    
//     res.json(driver);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const deleteDriver = async (req: Request, res: Response) => {
//   try {
//     const driver = await Driver.findOneAndDelete({
//       _id: req.params.id,
//       merchantId: req.user._id
//     });
    
//     if (!driver) {
//       return res.status(404).json({ error: 'Driver not found' });
//     }
    
//     res.json({ message: 'Driver deleted successfully' });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getDriverDeliveries = async (req: Request, res: Response) => {
//   try {
//     const driver = await Driver.findOne({
//       _id: req.params.id,
//       merchantId: req.user._id
//     });
    
//     if (!driver) {
//       return res.status(404).json({ error: 'Driver not found' });
//     }
    
//     const deliveries = await Parcel.find({
//       driverId: driver._id,
//       'delivery.status': { $in: ['in_transit', 'at_location', 'ready_for_pickup'] }
//     })
//       .sort({ createdAt: -1 })
//       .populate('delivery.location', 'name address coordinates');
    
//     const formattedDeliveries = deliveries.map(p => ({
//       id: p._id,
//       trackingNumber: p.trackingNumber,
//       status: p.delivery.status,
//       location: p.delivery.location?.name || 'Unknown',
//       codAmount: p.payment.isCOD ? p.payment.amount : 0,
//       collected: p.payment.collected,
//       items: p.items,
//       customer: p.customer
//     }));
    
//     res.json(formattedDeliveries);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getDriverAnalytics = async (req: Request, res: Response) => {
//   try {
//     const merchantId = req.user._id;
    
//     const totalDrivers = await Driver.countDocuments({ merchantId });
//     const activeDrivers = await Driver.countDocuments({ 
//       merchantId, 
//       status: { $in: ['active', 'on_delivery'] }
//     });
//     const onDelivery = await Driver.countDocuments({ merchantId, status: 'on_delivery' });
    
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const totalParcelsToday = await Parcel.countDocuments({
//       merchant: merchantId,
//       driverId: { $exists: true },
//       updatedAt: { $gte: today }
//     });
    
//     const codPending = await Parcel.aggregate([
//       {
//         $match: {
//           merchant: merchantId,
//           driverId: { $exists: true },
//           'payment.isCOD': true,
//           'payment.collected': false
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$payment.amount' }
//         }
//       }
//     ]);
    
//     const deliveriesCompleted = await Parcel.countDocuments({
//       merchant: merchantId,
//       driverId: { $exists: true },
//       'delivery.status': 'picked_up'
//     });
    
//     const totalDeliveries = await Parcel.countDocuments({
//       merchant: merchantId,
//       driverId: { $exists: true }
//     });
    
//     const completionRate = totalDeliveries > 0 
//       ? Math.round((deliveriesCompleted / totalDeliveries) * 100) 
//       : 0;
    
//     res.json({
//       overview: {
//         totalDrivers,
//         activeDrivers,
//         onDelivery,
//         totalParcelsToday,
//         codPending: codPending[0]?.total || 0,
//         completionRate
//       },
//       performance: {
//         avgDeliveryTime: '2.4 hours',
//         onTimeRate: '94%',
//         fuelEfficiency: '18km/L',
//         codCollectionRate: '96%',
//         customerRating: '4.8/5'
//       }
//     });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };