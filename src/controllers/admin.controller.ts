// src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import Merchant from '../models/Merchant';
import Customer from '../models/Customer';
import Parcel from '../models/Parcel';

// ==================== MERCHANT MANAGEMENT ====================

export const getAllMerchants = async (req: Request, res: Response) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    
    const query: any = {};
    
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    const merchants = await Merchant.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-password');
    
    const total = await Merchant.countDocuments(query);
    
    // Get stats for each merchant
    const merchantsWithStats = await Promise.all(
      merchants.map(async (merchant) => {
        const totalParcels = await Parcel.countDocuments({ merchant: merchant._id });
        const activeParcels = await Parcel.countDocuments({ 
          merchant: merchant._id,
          'delivery.status': { $in: ['created', 'in_transit', 'at_location', 'ready_for_pickup'] }
        });
        const completedParcels = await Parcel.countDocuments({ 
          merchant: merchant._id,
          'delivery.status': 'picked_up'
        });
        
        return {
          ...merchant.toObject(),
          stats: {
            totalParcels,
            activeParcels,
            completedParcels
          }
        };
      })
    );
    
    return res.json({
      merchants: merchantsWithStats,
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

export const getMerchantById = async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.params.id).select('-password');
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    // Get merchant stats
    const totalParcels = await Parcel.countDocuments({ merchant: merchant._id });
    const activeParcels = await Parcel.countDocuments({ 
      merchant: merchant._id,
      'delivery.status': { $in: ['created', 'in_transit', 'at_location', 'ready_for_pickup'] }
    });
    const completedParcels = await Parcel.countDocuments({ 
      merchant: merchant._id,
      'delivery.status': 'picked_up'
    });
    
    const recentParcels = await Parcel.find({ merchant: merchant._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return res.json({
      merchant,
      stats: {
        totalParcels,
        activeParcels,
        completedParcels
      },
      recentParcels
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateMerchant = async (req: Request, res: Response) => {
  try {
    const { businessName, email, phone, businessType, role, isActive } = req.body;
    
    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      {
        businessName,
        email,
        phone,
        businessType,
        role,
        isActive
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    return res.json(merchant);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateMerchantStatus = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    
    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    return res.json(merchant);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteMerchant = async (req: Request, res: Response) => {
  try {
    // Check if merchant has any parcels
    const parcelCount = await Parcel.countDocuments({ merchant: req.params.id });
    
    if (parcelCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete merchant with existing parcels. Deactivate instead.' 
      });
    }
    
    const merchant = await Merchant.findByIdAndDelete(req.params.id);
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    return res.json({ message: 'Merchant deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// ==================== CUSTOMER MANAGEMENT ====================

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
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
    const customer = await Customer.findById(req.params.id)
      .populate('preferredLocation', 'name address');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get customer's parcels
    const parcels = await Parcel.find({
      'customer.phone': customer.phone
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('delivery.location', 'name');
    
    return res.json({ customer, parcels });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    
    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone });
    
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this phone already exists' });
    }
    
    const customer = new Customer({
      name,
      email,
      phone,
      joinedDate: new Date(),
      status: 'new',
      totalParcels: 0,
      completedParcels: 0,
      totalSpent: 0
    });
    
    await customer.save();
    
    return res.status(201).json(customer);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, status } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, status },
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

export const updateCustomerStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
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
    // Check if customer has any parcels
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const parcelCount = await Parcel.countDocuments({
      'customer.phone': customer.phone
    });
    
    if (parcelCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing parcels. Deactivate instead.' 
      });
    }
    
    await Customer.findByIdAndDelete(req.params.id);
    
    return res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// ==================== INVITATIONS ====================

export const inviteMerchant = async (req: Request, res: Response) => {
  try {
    const { email, businessName, phone, role = 'merchant' } = req.body;
    
    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({ email });
    
    if (existingMerchant) {
      return res.status(400).json({ error: 'Merchant with this email already exists' });
    }
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    
    // Create merchant
    const merchant = new Merchant({
      businessName,
      email,
      phone,
      password: tempPassword, // Will be hashed by pre-save hook
      businessType: 'Pending',
      role,
      isActive: false,
      settings: {
        defaultLockerSize: 'medium',
        smsNotifications: true,
        emailNotifications: true,
        autoApproveReturns: false
      }
    });
    
    await merchant.save();
    
    // TODO: Send invitation email with temp password
    console.log(`Invitation sent to ${email} with temp password: ${tempPassword}`);
    
    return res.status(201).json({
      message: 'Invitation sent successfully',
      merchant: {
        id: merchant._id,
        email: merchant.email,
        businessName: merchant.businessName
      }
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// ==================== DASHBOARD STATS ====================

export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalMerchants = await Merchant.countDocuments();
    const activeMerchants = await Merchant.countDocuments({ isActive: true });
    
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    const newCustomers = await Customer.countDocuments({ status: 'new' });
    
    const totalParcels = await Parcel.countDocuments();
    const activeParcels = await Parcel.countDocuments({
      'delivery.status': { $in: ['created', 'in_transit', 'at_location', 'ready_for_pickup'] }
    });
    const completedParcels = await Parcel.countDocuments({
      'delivery.status': 'picked_up'
    });
    
    const totalCOD = await Parcel.aggregate([
      { $match: { 'payment.isCOD': true } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    
    const collectedCOD = await Parcel.aggregate([
      { $match: { 'payment.isCOD': true, 'payment.collected': true } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    
    return res.json({
      merchants: {
        total: totalMerchants,
        active: activeMerchants
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        new: newCustomers
      },
      parcels: {
        total: totalParcels,
        active: activeParcels,
        completed: completedParcels
      },
      cod: {
        total: totalCOD[0]?.total || 0,
        collected: collectedCOD[0]?.total || 0
      }
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};