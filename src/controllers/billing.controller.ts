// src/controllers/billing.controller.ts
import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import Invoice from '../models/Invoice';
import Wallet from '../models/Wallet';
import Parcel from '../models/Parcel';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const getWallet = async (req: Request, res: Response) => {
  try {
    let wallet = await Wallet.findOne({ merchantId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        merchantId: req.user._id,
        balance: 0,
        pendingBalance: 0,
        creditLimit: 500000,
        availableCredit: 500000
      });
    }
    
    return res.json(wallet);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateWallet = async (req: Request, res: Response) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { merchantId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    return res.json(wallet);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query: any = { merchantId: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('transactions.transactionId');
    
    const total = await Invoice.countDocuments(query);
    
    return res.json({
      invoices,
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

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      merchantId: req.user._id
    }).populate('transactions.transactionId');
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    return res.json(invoice);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    
    const query: any = { merchantId: req.user._id };
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    const total = await Transaction.countDocuments(query);
    
    return res.json({
      transactions,
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

export const initializeTopUp = async (req: Request, res: Response) => {
  try {
    const { amount, email } = req.body;
    
    if (amount < 1000) {
      return res.status(400).json({ error: 'Minimum top-up amount is ₦1,000' });
    }
    
    const reference = `TOPUP_${uuidv4()}`;
    
    // Initialize Paystack transaction
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amount * 100, // Paystack uses kobo
        reference,
        callback_url: `${process.env.FRONTEND_URL}/dashboard/billing/verify`,
        metadata: {
          merchantId: req.user._id,
          type: 'wallet_topup'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.json({
      authorization_url: response.data.data.authorization_url,
      reference,
      access_code: response.data.data.access_code
    });
  } catch (error: any) {
    console.error('Paystack error:', error.response?.data || error.message);
    return res.status(400).json({ error: 'Failed to initialize payment' });
  }
};

export const verifyTopUp = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    
    // Verify with Paystack
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );
    
    const { status, amount, customer, authorization } = response.data.data;
    
    if (status === 'success') {
      // Get wallet
      const wallet = await Wallet.findOne({ merchantId: req.user._id });
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const amountInNaira = amount / 100;
      
      // Create transaction
      const transaction = await Transaction.create({
        merchantId: req.user._id,
        type: 'credit',
        amount: amountInNaira,
        description: 'Wallet Top-up',
        reference,
        paystackReference: reference,
        status: 'success',
        method: authorization?.card_type ? 'card' : 'bank_transfer',
        balance: wallet.balance + amountInNaira,
        metadata: {
          paystackData: response.data.data
        }
      });
      
      // Update wallet balance
      wallet.balance += amountInNaira;
      wallet.lastTopUp = new Date();
      
      // Save card authorization for auto top-up
      if (authorization && !wallet.paystackAuthorization) {
        wallet.paystackAuthorization = {
          authorization_code: authorization.authorization_code,
          card_type: authorization.card_type,
          last4: authorization.last4,
          exp_month: authorization.exp_month,
          exp_year: authorization.exp_year
        };
      }
      
      await wallet.save();
      
      return res.json({
        success: true,
        transaction,
        wallet
      });
    } else {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error: any) {
    console.error('Verification error:', error);
    return res.status(400).json({ error: 'Failed to verify payment' });
  }
};

export const getCODSummary = async (req: Request, res: Response) => {
  try {
    const merchantId = req.user._id;
    
    const totalCOD = await Parcel.aggregate([
      {
        $match: {
          merchant: merchantId,
          'payment.isCOD': true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.amount' }
        }
      }
    ]);
    
    const collected = await Parcel.aggregate([
      {
        $match: {
          merchant: merchantId,
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
    
    const pending = await Parcel.aggregate([
      {
        $match: {
          merchant: merchantId,
          'payment.isCOD': true,
          'payment.collected': false,
          'delivery.status': { $ne: 'delivery_failed' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.amount' }
        }
      }
    ]);
    
    const overdue = await Parcel.aggregate([
      {
        $match: {
          merchant: merchantId,
          'payment.isCOD': true,
          'payment.collected': false,
          'delivery.status': 'delivery_failed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.amount' }
        }
      }
    ]);
    
    const totalCODValue = totalCOD[0]?.total || 0;
    const collectedValue = collected[0]?.total || 0;
    
    return res.json({
      totalCOD: totalCODValue,
      collected: collectedValue,
      pending: pending[0]?.total || 0,
      overdue: overdue[0]?.total || 0,
      collectionRate: totalCODValue > 0 ? (collectedValue / totalCODValue) * 100 : 0
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// export const getBillingAnalytics = async (req: Request, res: Response) => {
//   try {
//     const merchantId = req.user._id;
    
//     const wallet = await Wallet.findOne({ merchantId });
    
//     const invoices = await Invoice.find({ merchantId });
//     const transactions = await Transaction.find({ merchantId });
    
//     // Get COD summary
//     const codResult = await getCODSummary(req, res);
//     // Note: getCODSummary already sends a response, so we need to handle differently
//     // For now, we'll just calculate directly
    
//     const totalCOD = await Parcel.aggregate([
//       { $match: { merchant: merchantId, 'payment.isCOD': true } },
//       { $group: { _id: null, total: { $sum: '$payment.amount' } } }
//     ]);
    
//     const collectedCOD = await Parcel.aggregate([
//       { $match: { merchant: merchantId, 'payment.isCOD': true, 'payment.collected': true } },
//       { $group: { _id: null, total: { $sum: '$payment.amount' } } }
//     ]);
    
//     const stats = {
//       totalRevenue: invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0),
//       paidAmount: invoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0),
//       pendingAmount: invoices.reduce((sum: number, inv: any) => sum + inv.balance, 0),
//       overdueAmount: invoices
//         .filter((inv: any) => inv.status === 'overdue')
//         .reduce((sum: number, inv: any) => sum + inv.balance, 0),
//       walletBalance: wallet?.balance || 0,
//       pendingBalance: wallet?.pendingBalance || 0,
//       creditLimit: wallet?.creditLimit || 500000,
//       availableCredit: wallet?.availableCredit || 500000,
//       totalCOD: totalCOD[0]?.total || 0,
//       collectedCOD: collectedCOD[0]?.total || 0
//     };
    
//     return res.json(stats);
//   } catch (error: any) {
//     return res.status(400).json({ error: error.message });
//   }
// };



// src/controllers/billing.controller.ts - Fix getBillingAnalytics
export const getBillingAnalytics = async (req: Request, res: Response) => {
  try {
    const merchantId = req.user._id;
    
    const wallet = await Wallet.findOne({ merchantId });
    
    const invoices = await Invoice.find({ merchantId });
    const transactions = await Transaction.find({ merchantId });
    
    // Calculate directly instead of calling getCODSummary which sends a response
    const totalCOD = await Parcel.aggregate([
      { $match: { merchant: merchantId, 'payment.isCOD': true } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    
    const collectedCOD = await Parcel.aggregate([
      { $match: { merchant: merchantId, 'payment.isCOD': true, 'payment.collected': true } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    
    const pendingCOD = await Parcel.aggregate([
      { 
        $match: { 
          merchant: merchantId, 
          'payment.isCOD': true, 
          'payment.collected': false,
          'delivery.status': { $ne: 'delivery_failed' }
        } 
      },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    
    const overdueCOD = await Parcel.aggregate([
      { 
        $match: { 
          merchant: merchantId, 
          'payment.isCOD': true, 
          'payment.collected': false,
          'delivery.status': 'delivery_failed'
        } 
      },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    
    const stats = {
      totalRevenue: invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0),
      paidAmount: invoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0),
      pendingAmount: invoices.reduce((sum: number, inv: any) => sum + inv.balance, 0),
      overdueAmount: invoices
        .filter((inv: any) => inv.status === 'overdue')
        .reduce((sum: number, inv: any) => sum + inv.balance, 0),
      walletBalance: wallet?.balance || 0,
      pendingBalance: wallet?.pendingBalance || 0,
      creditLimit: wallet?.creditLimit || 500000,
      availableCredit: wallet?.availableCredit || 500000,
      totalCOD: totalCOD[0]?.total || 0,
      collectedCOD: collectedCOD[0]?.total || 0,
      pendingCOD: pendingCOD[0]?.total || 0,
      overdueCOD: overdueCOD[0]?.total || 0
    };
    
    // Send ONLY ONE response
    return res.json(stats);
    
  } catch (error: any) {
    console.error('Billing analytics error:', error);
    // Send ONLY ONE error response
    return res.status(400).json({ error: error.message });
  }
};



export const setupAutoTopUp = async (req: Request, res: Response) => {
  try {
    const { enabled, threshold } = req.body;
    
    const wallet = await Wallet.findOneAndUpdate(
      { merchantId: req.user._id },
      {
        autoTopUp: enabled,
        topUpThreshold: threshold
      },
      { new: true }
    );
    
    return res.json(wallet);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};