// src/models/Customer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  merchantId: mongoose.Types.ObjectId;
  totalParcels: number;
  completedParcels: number;
  pendingParcels: number;
  totalSpent: number;
  joinedDate: Date;
  lastPickup?: Date;
  preferredLocation?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'new';
  notificationPreference: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  totalParcels: { type: Number, default: 0 },
  completedParcels: { type: Number, default: 0 },
  pendingParcels: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  joinedDate: { type: Date, default: Date.now },
  lastPickup: { type: Date },
  preferredLocation: { type: Schema.Types.ObjectId, ref: 'Location' },
  status: { type: String, enum: ['active', 'inactive', 'new'], default: 'new' },
  notificationPreference: {
    sms: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },
  rating: { type: Number, min: 0, max: 5 },
  notes: { type: String }
}, {
  timestamps: true
});

// Indexes for efficient queries
customerSchema.index({ merchantId: 1, phone: 1 }, { unique: true });
customerSchema.index({ merchantId: 1, status: 1 });
customerSchema.index({ merchantId: 1, lastPickup: -1 });

const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);
export default CustomerModel;