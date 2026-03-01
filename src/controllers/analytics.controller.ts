// src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { Parcel } from '../models';

// Make sure the function is properly typed
export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's parcels
    const todaysParcels = await Parcel.find({
      merchant: req.user._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Get all parcels for monthly stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyParcels = await Parcel.find({
      merchant: req.user._id,
      createdAt: { $gte: startOfMonth }
    });
    
    // Calculate analytics
    const analytics = {
      overview: {
        totalParcels: monthlyParcels.length,
        deliveredToday: todaysParcels.filter(p => p.delivery.status === 'picked_up').length,
        pendingPickup: todaysParcels.filter(p => 
          ['ready_for_pickup', 'at_location'].includes(p.delivery.status)
        ).length,
        codCollected: monthlyParcels
          .filter(p => p.payment.isCOD && p.payment.collected)
          .reduce((sum, p) => sum + p.payment.amount, 0)
      },
      statusDistribution: monthlyParcels.reduce((acc: any, parcel) => {
        const status = parcel.delivery.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      recentActivity: monthlyParcels
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(p => ({
          id: p._id,
          trackingNumber: p.trackingNumber,
          customer: p.customer.name,
          status: p.delivery.status,
          createdAt: p.createdAt
        }))
    };
    
    res.json(analytics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Make sure to export properly
export default {
  getDashboardAnalytics
};



















































// // src/controllers/analytics.controller.ts
// import { Request, Response } from 'express';
// import { Parcel } from '../models';

// export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     // Get today's parcels
//     const todaysParcels = await Parcel.find({
//       merchant: req.user._id,
//       createdAt: { $gte: today, $lt: tomorrow }
//     });
    
//     // Get all parcels for monthly stats
//     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//     const monthlyParcels = await Parcel.find({
//       merchant: req.user._id,
//       createdAt: { $gte: startOfMonth }
//     });
    
//     // Calculate analytics
//     const analytics = {
//       overview: {
//         totalParcels: monthlyParcels.length,
//         deliveredToday: todaysParcels.filter(p => p.delivery.status === 'picked_up').length,
//         pendingPickup: todaysParcels.filter(p => 
//           ['ready_for_pickup', 'at_location'].includes(p.delivery.status)
//         ).length,
//         codCollected: monthlyParcels
//           .filter(p => p.payment.isCOD && p.payment.collected)
//           .reduce((sum, p) => sum + p.payment.amount, 0)
//       },
//       statusDistribution: monthlyParcels.reduce((acc: any, parcel) => {
//         const status = parcel.delivery.status;
//         acc[status] = (acc[status] || 0) + 1;
//         return acc;
//       }, {}),
//       recentActivity: monthlyParcels
//         .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
//         .slice(0, 10)
//         .map(p => ({
//           id: p._id,
//           trackingNumber: p.trackingNumber,
//           customer: p.customer.name,
//           status: p.delivery.status,
//           createdAt: p.createdAt
//         }))
//     };
    
//     res.json(analytics);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };





