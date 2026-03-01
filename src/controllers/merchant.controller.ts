// src/controllers/merchant.controller.ts
import { Request, Response } from 'express';
// import Merchant from '../models/Merchant';
import { Merchant } from '../models';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchant = await Merchant.findById(req.user._id).select('-password');
    if (!merchant) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    res.json(merchant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    const merchant = await Merchant.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!merchant) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    
    res.json(merchant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const generateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchant = await Merchant.findById(req.user._id);
    if (!merchant) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    
    const apiKey = merchant.generateApiKey();
    await merchant.save();
    
    res.json({ apiKey });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getBilling = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchant = await Merchant.findById(req.user._id).select('billing');
    if (!merchant) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    res.json(merchant.billing);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};





