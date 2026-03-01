 
// src/controllers/parcel.controller.ts
import { Request, Response } from 'express';
import { Parcel, Customer } from '../models'; // Make sure to import Customer
 


// Helper type for Parcel document
type ParcelDocument = ReturnType<typeof Parcel.prototype.toObject>;

// export const createParcel = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { customer, items, delivery, payment } = req.body;
    
//     const parcelData = {
//       trackingNumber: 'LKR-' + Date.now(),
//       merchant: req.user?._id,
//       customer: customer || {
//         name: 'Customer',
//         phone: '0000000000'
//       },
//       items: items || [],
//       delivery: {
//         ...delivery,
//         pickupDeadline: delivery?.pickupDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//       },
//       payment: payment || { isCOD: false, amount: 0, collected: false },
//       codes: {
//         customerPin: Math.random().toString(36).substring(2, 8).toUpperCase(),
//         qrCode: 'https://via.placeholder.com/200'
//       },
//       events: [{
//         status: 'created',
//         description: 'Parcel created by merchant',
//         timestamp: new Date()
//       }]
//     };
    
//     const parcel = new Parcel(parcelData);
//     await parcel.save();
    
//     res.status(201).json({
//       success: true,
//       parcel
//     });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

export const getParcels = async (req: Request, res: Response): Promise<void> => {
  try {
    const parcels = await Parcel.find({ merchant: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ parcels });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getParcelById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const parcel = await Parcel.findOne({
      _id: id,
      merchant: req.user?._id
    });
    
    if (!parcel) {
      res.status(404).json({ error: 'Parcel not found' });
      return;
    }
    
    res.json(parcel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// export const updateParcel = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const update = req.body;
    
//     const parcel = await Parcel.findOne({
//       _id: id,
//       merchant: req.user?._id
//     });
    
//     if (!parcel) {
//       res.status(404).json({ error: 'Parcel not found' });
//       return;
//     }
    
//     // Use type assertion to tell TypeScript this is a Parcel document
//     const parcelDoc = parcel as any;
    
//     // Update fields
//     if (update.customer) parcelDoc.customer = update.customer;
//     if (update.items) parcelDoc.items = update.items;
    
//     if (update.delivery) {
//       parcelDoc.delivery = {
//         ...parcelDoc.delivery,
//         ...update.delivery
//       };
//     }
    
//     if (update.payment) {
//       parcelDoc.payment = {
//         ...parcelDoc.payment,
//         ...update.payment
//       };
//     }
    
//     await parcel.save();
    
//     res.json(parcel);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

export const deleteParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const parcel = await Parcel.findOneAndDelete({
      _id: id,
      merchant: req.user?._id
    });
    
    if (!parcel) {
      res.status(404).json({ error: 'Parcel not found' });
      return;
    }
    
    res.json({ success: true, message: 'Parcel deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getParcelAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const parcels = await Parcel.find({
      merchant: req.user?._id,
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Use type assertion for parcels
    const parcelDocs = parcels as any[];
    
    const analytics = {
      total: parcelDocs.length,
      byStatus: parcelDocs.reduce((acc: any, parcel) => {
        const status = parcel.delivery?.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json(analytics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};



export const getParcelsWithFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query: any = { merchant: req.user._id };
    
    // Filter by status
    if (status && status !== 'all') {
      query['delivery.status'] = status;
    }
    
    // Search by tracking number or customer name
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    const parcels = await Parcel.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('delivery.location', 'name address');
    
    const total = await Parcel.countDocuments(query);
    
    res.json({
      parcels,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};





export const createParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer, items, delivery, payment } = req.body;
    
    // 1. Check if customer exists for this merchant
    let customerRecord = await Customer.findOne({
      merchantId: req.user._id,
      phone: customer.phone
    });
    
    if (!customerRecord) {
      // Create new customer
      customerRecord = new Customer({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        merchantId: req.user._id,
        joinedDate: new Date(),
        status: 'new',
        totalParcels: 0,
        completedParcels: 0,
        pendingParcels: 0,
        totalSpent: 0,
        notificationPreference: {
          sms: true,
          whatsapp: false,
          email: !!customer.email
        }
      });
      await customerRecord.save();
      console.log('New customer created:', customerRecord._id);
    } else {
      console.log('Existing customer found:', customerRecord._id);
    }
    
    // 2. Create the parcel
    const parcelData = {
      trackingNumber: 'LKR-' + Date.now(),
      merchant: req.user?._id,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      items: items || [],
      delivery: {
        ...delivery,
        pickupDeadline: delivery?.pickupDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      payment: payment || { isCOD: false, amount: 0, collected: false },
      codes: {
        customerPin: Math.random().toString(36).substring(2, 8).toUpperCase(),
        qrCode: 'https://via.placeholder.com/200'
      },
      events: [{
        status: 'created',
        description: 'Parcel created by merchant',
        timestamp: new Date()
      }]
    };
    
    const parcel = new Parcel(parcelData);
    await parcel.save();
    
    // 3. Update customer statistics
    const totalSpent = items.reduce((sum: number, item: any) => sum + (item.value * item.quantity), 0);
    
    customerRecord.totalParcels += 1;
    customerRecord.pendingParcels += 1;
    customerRecord.totalSpent += payment?.isCOD ? 0 : totalSpent; // Only add if prepaid
    
    // Update status if needed
    if (customerRecord.status === 'new') {
      customerRecord.status = 'active';
    }
    
    customerRecord.lastPickup = new Date();
    await customerRecord.save();
    
    res.status(201).json({
      success: true,
      parcel
    });
  } catch (error: any) {
    console.error('Error creating parcel:', error);
    res.status(400).json({ error: error.message });
  }
};

// Also update the updateParcel function to handle customer updates
export const updateParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const update = req.body;
    
    const parcel = await Parcel.findOne({
      _id: id,
      merchant: req.user?._id
    });
    
    if (!parcel) {
      res.status(404).json({ error: 'Parcel not found' });
      return;
    }
    
    // Check if customer info is being updated
    if (update.customer && (
        update.customer.phone !== parcel.customer.phone ||
        update.customer.name !== parcel.customer.name
    )) {
      // Find or update customer record
      let customerRecord = await Customer.findOne({
        merchantId: req.user._id,
        phone: update.customer.phone
      });
      
      if (!customerRecord) {
        // Create new customer if phone changed
        customerRecord = new Customer({
          name: update.customer.name,
          phone: update.customer.phone,
          email: update.customer.email,
          merchantId: req.user._id,
          joinedDate: new Date(),
          status: 'new',
          totalParcels: 0,
          completedParcels: 0,
          pendingParcels: 0,
          totalSpent: 0
        });
        await customerRecord.save();
      }
    }
    
    // Update parcel fields
    if (update.customer) parcel.customer = update.customer;
    if (update.items) parcel.items = update.items;
    
    if (update.delivery) {
      parcel.delivery = {
        ...parcel.delivery,
        ...update.delivery
      };
    }
    
    if (update.payment) {
      parcel.payment = {
        ...parcel.payment,
        ...update.payment
      };
    }
    
    await parcel.save();
    
    res.json(parcel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};