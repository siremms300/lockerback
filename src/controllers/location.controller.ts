// src/controllers/location.controller.ts
import { Request, Response } from 'express';
import { Location, Parcel } from '../models';

export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const locations = await Location.find({});
    return res.json({ locations });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.json(location);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    const location = new Location(req.body);
    await location.save();
    return res.status(201).json(location);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.json(location);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.json({ message: 'Location deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getLocationStats = async (req: Request, res: Response) => {
  try {
    const locationId = req.params.id;
    
    const totalParcels = await Parcel.countDocuments({
      'delivery.location': locationId
    });
    
    const activeParcels = await Parcel.countDocuments({
      'delivery.location': locationId,
      'delivery.status': { $in: ['at_location', 'ready_for_pickup'] }
    });
    
    const completedParcels = await Parcel.countDocuments({
      'delivery.location': locationId,
      'delivery.status': 'picked_up'
    });
    
    return res.json({
      totalParcels,
      activeParcels,
      completedParcels,
      utilization: totalParcels > 0 ? Math.round((activeParcels / totalParcels) * 100) : 0
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};