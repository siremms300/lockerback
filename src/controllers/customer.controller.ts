// src/controllers/customer.controller.ts
import { Request, Response } from 'express';
import Customer from '../models/Customer';
import Parcel from '../models/Parcel';

export const getAllCustomers = async (req: Request, res: Response) => {
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
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('preferredLocation', 'name');
    
    const total = await Customer.countDocuments(query);
    
    return res.json({
      customers,
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

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      merchantId: req.user._id
    }).populate('preferredLocation', 'name address');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get customer's parcels
    const parcels = await Parcel.find({
      merchant: req.user._id,
      'customer.phone': customer.phone
    }).sort({ createdAt: -1 }).limit(10);
    
    return res.json({ customer, parcels });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const existingCustomer = await Customer.findOne({
      merchantId: req.user._id,
      phone: req.body.phone
    });
    
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this phone already exists' });
    }
    
    const customer = new Customer({
      ...req.body,
      merchantId: req.user._id,
      joinedDate: new Date(),
      status: 'new'
    });
    
    await customer.save();
    return res.status(201).json(customer);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    return res.json(customer);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.user._id
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    return res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getCustomerPickups = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      merchantId: req.user._id
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const pickups = await Parcel.find({
      merchant: req.user._id,
      'customer.phone': customer.phone
    })
      .sort({ createdAt: -1 })
      .populate('delivery.location', 'name type')
      .limit(50);
    
    interface EventType {
      status: string;
      timestamp: Date;
      description: string;
    }

    const formattedPickups = pickups.map(p => ({
      id: p._id,
      trackingNumber: p.trackingNumber,
      parcelId: p._id,
      location: (p.delivery.location as any)?.name || 'Unknown',
      locationType: p.delivery.pickupType,
      status: p.delivery.status,
      scheduledTime: p.delivery.pickupDeadline,
      pickupTime: (p.events as EventType[]).find(e => e.status === 'picked_up')?.timestamp,
      pickupCode: p.codes.customerPin,
      qrCode: p.codes.qrCode,
      items: p.items,
      payment: p.payment,
      notifications: [] // You'd get these from a notifications service
    }));
    
    return res.json(formattedPickups);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getCustomerAnalytics = async (req: Request, res: Response) => {
  try {
    const merchantId = req.user._id;
    
    const totalCustomers = await Customer.countDocuments({ merchantId });
    const activeCustomers = await Customer.countDocuments({ merchantId, status: 'active' });
    const newCustomers = await Customer.countDocuments({ 
      merchantId, 
      status: 'new',
      createdAt: { $gte: new Date(new Date().setDate(1)) } // This month
    });
    
    const totalRevenueResult = await Customer.aggregate([
      { $match: { merchantId } },
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]);
    
    const avgRatingResult = await Customer.aggregate([
      { $match: { merchantId, rating: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    
    // Customer segments
    const highValue = await Customer.countDocuments({ 
      merchantId, 
      totalSpent: { $gt: 100000 } 
    });
    
    const regular = await Customer.countDocuments({ 
      merchantId, 
      totalSpent: { $gte: 10000, $lte: 100000 } 
    });
    
    const lowValue = await Customer.countDocuments({ 
      merchantId, 
      totalSpent: { $lt: 10000 } 
    });
    
    return res.json({
      overview: {
        totalCustomers,
        activeCustomers,
        newCustomers,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        avgRating: avgRatingResult[0]?.avg || 0
      },
      segments: {
        highValue,
        regular,
        lowValue
      }
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

































// // src/controllers/customer.controller.ts
// import { Request, Response } from 'express';
// import Customer from '../models/Customer';
// import Parcel from '../models/Parcel';

// export const getAllCustomers = async (req: Request, res: Response) => {
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
//         { email: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     const customers = await Customer.find(query)
//       .sort({ createdAt: -1 })
//       .skip((Number(page) - 1) * Number(limit))
//       .limit(Number(limit))
//       .populate('preferredLocation', 'name');
    
//     const total = await Customer.countDocuments(query);
    
//     res.json({
//       customers,
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

// export const getCustomerById = async (req: Request, res: Response) => {
//   try {
//     const customer = await Customer.findOne({
//       _id: req.params.id,
//       merchantId: req.user._id
//     }).populate('preferredLocation', 'name address');
    
//     if (!customer) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }
    
//     // Get customer's parcels
//     const parcels = await Parcel.find({
//       merchant: req.user._id,
//       'customer.phone': customer.phone
//     }).sort({ createdAt: -1 }).limit(10);
    
//     res.json({ customer, parcels });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const createCustomer = async (req: Request, res: Response) => {
//   try {
//     const existingCustomer = await Customer.findOne({
//       merchantId: req.user._id,
//       phone: req.body.phone
//     });
    
//     if (existingCustomer) {
//       return res.status(400).json({ error: 'Customer with this phone already exists' });
//     }
    
//     const customer = new Customer({
//       ...req.body,
//       merchantId: req.user._id,
//       joinedDate: new Date(),
//       status: 'new'
//     });
    
//     await customer.save();
//     res.status(201).json(customer);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const updateCustomer = async (req: Request, res: Response) => {
//   try {
//     const customer = await Customer.findOneAndUpdate(
//       { _id: req.params.id, merchantId: req.user._id },
//       req.body,
//       { new: true, runValidators: true }
//     );
    
//     if (!customer) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }
    
//     res.json(customer);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const deleteCustomer = async (req: Request, res: Response) => {
//   try {
//     const customer = await Customer.findOneAndDelete({
//       _id: req.params.id,
//       merchantId: req.user._id
//     });
    
//     if (!customer) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }
    
//     res.json({ message: 'Customer deleted successfully' });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getCustomerPickups = async (req: Request, res: Response) => {
//   try {
//     const customer = await Customer.findOne({
//       _id: req.params.id,
//       merchantId: req.user._id
//     });
    
//     if (!customer) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }
    
//     const pickups = await Parcel.find({
//       merchant: req.user._id,
//       'customer.phone': customer.phone
//     })
//       .sort({ createdAt: -1 })
//       .populate('delivery.location', 'name type')
//       .limit(50);
    
//     const formattedPickups = pickups.map(p => ({
//       id: p._id,
//       trackingNumber: p.trackingNumber,
//       parcelId: p._id,
//       location: p.delivery.location?.name || 'Unknown',
//       locationType: p.delivery.pickupType,
//       status: p.delivery.status,
//       scheduledTime: p.delivery.pickupDeadline,
//       pickupTime: p.events.find(e => e.status === 'picked_up')?.timestamp,
//       pickupCode: p.codes.customerPin,
//       qrCode: p.codes.qrCode,
//       items: p.items,
//       payment: p.payment,
//       notifications: [] // You'd get these from a notifications service
//     }));
    
//     res.json(formattedPickups);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getCustomerAnalytics = async (req: Request, res: Response) => {
//   try {
//     const merchantId = req.user._id;
    
//     const totalCustomers = await Customer.countDocuments({ merchantId });
//     const activeCustomers = await Customer.countDocuments({ merchantId, status: 'active' });
//     const newCustomers = await Customer.countDocuments({ 
//       merchantId, 
//       status: 'new',
//       createdAt: { $gte: new Date(new Date().setDate(1)) } // This month
//     });
    
//     const totalRevenue = await Customer.aggregate([
//       { $match: { merchantId } },
//       { $group: { _id: null, total: { $sum: '$totalSpent' } } }
//     ]);
    
//     const avgRating = await Customer.aggregate([
//       { $match: { merchantId, rating: { $exists: true } } },
//       { $group: { _id: null, avg: { $avg: '$rating' } } }
//     ]);
    
//     // Customer segments
//     const highValue = await Customer.countDocuments({ 
//       merchantId, 
//       totalSpent: { $gt: 100000 } 
//     });
    
//     const regular = await Customer.countDocuments({ 
//       merchantId, 
//       totalSpent: { $gte: 10000, $lte: 100000 } 
//     });
    
//     const lowValue = await Customer.countDocuments({ 
//       merchantId, 
//       totalSpent: { $lt: 10000 } 
//     });
    
//     res.json({
//       overview: {
//         totalCustomers,
//         activeCustomers,
//         newCustomers,
//         totalRevenue: totalRevenue[0]?.total || 0,
//         avgRating: avgRating[0]?.avg || 0
//       },
//       segments: {
//         highValue,
//         regular,
//         lowValue
//       }
//     });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };