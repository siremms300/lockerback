// src/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import { Parcel } from '../models';
import { emitParcelUpdate } from '../socket/socket';

export const handleLockerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data, signature } = req.body;
    
    // Verify webhook signature (if provided by locker vendor)
    if (process.env.LOCKER_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.LOCKER_WEBHOOK_SECRET)
        .update(JSON.stringify(data))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }
    
    console.log('Locker webhook received:', { event, data });
    
    // Handle different locker events
    switch (event) {
      case 'parcel_delivered':
        // Update parcel status
        if (data.parcelId) {
          const parcel = await Parcel.findById(data.parcelId);
          if (parcel) {
            parcel.delivery.status = 'at_location';
            parcel.events.push({
              status: 'at_location',
              description: `Parcel delivered to locker at ${data.lockerId}`,
              timestamp: new Date()
            });
            await parcel.save();
            
            emitParcelUpdate(parcel._id.toString(), {
              status: 'at_location',
              lockerId: data.lockerId,
              timestamp: new Date()
            });
          }
        }
        break;
        
      case 'parcel_picked_up':
        if (data.parcelId) {
          const parcel = await Parcel.findById(data.parcelId);
          if (parcel) {
            parcel.delivery.status = 'picked_up';
            parcel.payment.collected = true;
            if (data.paymentMethod) {
              parcel.payment.paymentMethod = data.paymentMethod;
            }
            parcel.events.push({
              status: 'picked_up',
              description: 'Parcel picked up by customer',
              timestamp: new Date()
            });
            await parcel.save();
            
            emitParcelUpdate(parcel._id.toString(), {
              status: 'picked_up',
              timestamp: new Date()
            });
          }
        }
        break;
        
      case 'locker_status':
        // Handle locker status updates (online/offline)
        console.log(`Locker ${data.lockerId} status: ${data.status}`);
        break;
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data } = req.body;
    
    console.log('Payment webhook received:', { event, data });
    
    // Handle payment events
    switch (event) {
      case 'charge.success':
        // Update merchant wallet
        if (data.customer && data.amount) {
          // Here you would update merchant's wallet balance
          console.log(`Payment of ${data.amount} received from ${data.customer}`);
        }
        break;
        
      case 'transfer.success':
        // Handle successful transfers to merchants
        console.log(`Transfer completed: ${data.reference}`);
        break;
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('Payment webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};




