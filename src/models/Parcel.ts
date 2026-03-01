// src/models/Parcel.ts
import mongoose, { Schema, Document } from 'mongoose';

export type ParcelStatus = 
  | 'created' 
  | 'in_transit' 
  | 'at_location' 
  | 'ready_for_pickup' 
  | 'picked_up' 
  | 'delivery_failed'
  | 'return_requested'
  | 'returned'
  | 'expired'
  | 'cancelled';

export interface IParcel extends Document {
  trackingNumber: string;
  merchant: mongoose.Types.ObjectId;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
  }>;
  delivery: {
    pickupType: 'locker' | 'staffed_hub';
    location?: mongoose.Types.ObjectId;
    assignedCompartment?: string;
    lockerSize?: 'small' | 'medium' | 'large';
    status: ParcelStatus;
    pickupDeadline: Date;
  };
  payment: {
    isCOD: boolean;
    amount: number;
    collected: boolean;
  };
  codes: {
    customerPin: string;
    qrCode: string;
  };
  events: Array<{
    status: ParcelStatus;
    description: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const parcelSchema = new Schema<IParcel>({
  trackingNumber: { type: String, required: true, unique: true },
  merchant: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    value: { type: Number, required: true },
    weight: { type: Number, required: true }
  }],
  delivery: {
    pickupType: { type: String, enum: ['locker', 'staffed_hub'], default: 'locker' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    assignedCompartment: { type: String },
    lockerSize: { type: String, enum: ['small', 'medium', 'large'] },
    status: { 
      type: String, 
      enum: ['created', 'in_transit', 'at_location', 'ready_for_pickup', 'picked_up', 'delivery_failed', 'return_requested', 'returned', 'expired', 'cancelled'],
      default: 'created'
    },
    pickupDeadline: { type: Date, required: true }
  },
  payment: {
    isCOD: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    collected: { type: Boolean, default: false }
  },
  codes: {
    customerPin: { type: String, required: true },
    qrCode: { type: String, required: true }
  },
  events: [{
    status: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true
});

// Check if model already exists before compiling
const ParcelModel = mongoose.models.Parcel || mongoose.model<IParcel>('Parcel', parcelSchema);

export default ParcelModel;























































// // src/models/Merchant.ts
// import mongoose, { Schema, Document } from 'mongoose';
// import bcrypt from 'bcryptjs';

// export interface IMerchant extends Document {
//   businessName: string;
//   email: string;
//   phone: string;
//   password: string;
//   businessType: string;
//   address?: {
//     street: string;
//     city: string;
//     state: string;
//     country: string;
//     postalCode: string;
//   };
//   billing?: {
//     walletBalance: number;
//     creditLimit: number;
//     paymentMethod: string;
//     autoTopUp: boolean;
//     topUpThreshold: number;
//   };
//   settings?: {
//     defaultLockerSize: string;
//     smsNotifications: boolean;
//     emailNotifications: boolean;
//     autoApproveReturns: boolean;
//   };
//   apiKey?: string;
//   webhookUrl?: string;
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   comparePassword(candidatePassword: string): Promise<boolean>;
//   generateApiKey(): string;
// }

// const merchantSchema = new Schema<IMerchant>({
//   businessName: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   phone: { type: String, required: true },
//   password: { type: String, required: true },
//   businessType: { type: String, required: true },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     country: { type: String, default: 'Nigeria' },
//     postalCode: String
//   },
//   billing: {
//     walletBalance: { type: Number, default: 0 },
//     creditLimit: { type: Number, default: 1000 },
//     paymentMethod: { type: String, default: 'wallet' },
//     autoTopUp: { type: Boolean, default: false },
//     topUpThreshold: { type: Number, default: 100 }
//   },
//   settings: {
//     defaultLockerSize: { type: String, default: 'medium' },
//     smsNotifications: { type: Boolean, default: true },
//     emailNotifications: { type: Boolean, default: true },
//     autoApproveReturns: { type: Boolean, default: false }
//   },
//   apiKey: { type: String, unique: true, sparse: true },
//   webhookUrl: { type: String },
//   isActive: { type: Boolean, default: true }
// }, { 
//   timestamps: true  // This enables createdAt and updatedAt
// });

// // Hash password before saving
// merchantSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Compare password method
// merchantSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// }; 

// // Generate API key
// merchantSchema.methods.generateApiKey = function(): string {
//   const crypto = require('crypto');
//   this.apiKey = `lk_${crypto.randomBytes(32).toString('hex')}`;
//   return this.apiKey;
// };

// export default mongoose.model<IMerchant>('Merchant', merchantSchema);










































//  // src/models/Parcel.ts
// import mongoose, { Schema, Document } from 'mongoose';

// export type ParcelStatus = 
//   | 'created' 
//   | 'in_transit' 
//   | 'at_location' 
//   | 'ready_for_pickup' 
//   | 'picked_up' 
//   | 'delivery_failed'
//   | 'return_requested'
//   | 'returned'
//   | 'expired'
//   | 'cancelled';

// export interface IParcel extends Document {
//   trackingNumber: string;
//   merchant: mongoose.Types.ObjectId;
//   customer: {
//     name: string;
//     phone: string;
//     email?: string;
//   };
//   items: Array<{
//     description: string;
//     quantity: number;
//     value: number;
//     weight: number;
//   }>;
//   delivery: {
//     pickupType: 'locker' | 'staffed_hub';
//     location?: mongoose.Types.ObjectId;
//     assignedCompartment?: string;
//     lockerSize?: 'small' | 'medium' | 'large';
//     status: ParcelStatus;
//     pickupDeadline: Date;
//   };
//   payment: {
//     isCOD: boolean;
//     amount: number;
//     collected: boolean;
//   };
//   codes: {
//     customerPin: string;
//     qrCode: string;
//   };
//   events: Array<{
//     status: ParcelStatus;
//     description: string;
//     timestamp: Date;
//   }>;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const parcelSchema = new Schema<IParcel>({
//   trackingNumber: { type: String, required: true, unique: true },
//   merchant: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
//   customer: {
//     name: { type: String, required: true },
//     phone: { type: String, required: true },
//     email: { type: String }
//   },
//   items: [{
//     description: { type: String, required: true },
//     quantity: { type: Number, default: 1 },
//     value: { type: Number, required: true },
//     weight: { type: Number, required: true }
//   }],
//   delivery: {
//     pickupType: { type: String, enum: ['locker', 'staffed_hub'], default: 'locker' },
//     location: { type: Schema.Types.ObjectId, ref: 'Location' },
//     assignedCompartment: { type: String },
//     lockerSize: { type: String, enum: ['small', 'medium', 'large'] },
//     status: { 
//       type: String, 
//       enum: ['created', 'in_transit', 'at_location', 'ready_for_pickup', 'picked_up', 'delivery_failed', 'return_requested', 'returned', 'expired', 'cancelled'],
//       default: 'created'
//     },
//     pickupDeadline: { type: Date, required: true }
//   },
//   payment: {
//     isCOD: { type: Boolean, default: false },
//     amount: { type: Number, default: 0 },
//     collected: { type: Boolean, default: false }
//   },
//   codes: {
//     customerPin: { type: String, required: true },
//     qrCode: { type: String, required: true }
//   },
//   events: [{
//     status: { type: String, required: true },
//     description: { type: String, required: true },
//     timestamp: { type: Date, default: Date.now }
//   }]
// }, { 
//   timestamps: true  // This enables createdAt and updatedAt
// });

// export default mongoose.model<IParcel>('Parcel', parcelSchema);












































// // backend/src/models/Parcel.ts
// import mongoose, { Schema, Document } from 'mongoose';

// export type ParcelStatus = 
//   | 'created' 
//   | 'in_transit' 
//   | 'at_location' 
//   | 'ready_for_pickup' 
//   | 'picked_up' 
//   | 'delivery_failed'
//   | 'return_requested'
//   | 'returned'
//   | 'expired'
//   | 'cancelled';

// export interface IParcel extends Document {
//   trackingNumber: string;
//   merchant: mongoose.Types.ObjectId;
//   customer: {
//     name: string;
//     phone: string;
//     email?: string;
//     alternativePhone?: string;
//   };
//   items: Array<{
//     description: string;
//     quantity: number;
//     value: number;
//     weight: number;
//     sku?: string;
//   }>;
//   delivery: {
//     pickupType: 'locker' | 'staffed_hub';
//     location: mongoose.Types.ObjectId;
//     assignedCompartment?: string;
//     lockerSize: 'small' | 'medium' | 'large';
//     status: ParcelStatus;
//     driver?: mongoose.Types.ObjectId;
//     estimatedDelivery: Date;
//     actualDelivery?: Date;
//     pickupDeadline: Date;
//   };
//   payment: {
//     isCOD: boolean;
//     amount: number;
//     currency: string;
//     collected: boolean;
//     collectionDate?: Date;
//     paymentMethod?: 'cash' | 'card' | 'mobile_money';
//   };
//   codes: {
//     customerPin: string;
//     qrCode: string;
//     driverCode?: string;
//     returnCode?: string;
//   };
//   metadata: {
//     notes?: string;
//     insurance: boolean;
//     fragile: boolean;
//     signatureRequired: boolean;
//   };
//   events: Array<{
//     status: ParcelStatus;
//     description: string;
//     location?: string;
//     timestamp: Date;
//     actor?: string;
//   }>;
// }

// const parcelSchema = new Schema<IParcel>({
//   trackingNumber: { type: String, required: true, unique: true },
//   merchant: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
//   customer: {
//     name: { type: String, required: true },
//     phone: { type: String, required: true },
//     email: { type: String },
//     alternativePhone: { type: String }
//   },
//   items: [{
//     description: { type: String, required: true },
//     quantity: { type: Number, default: 1 },
//     value: { type: Number, required: true },
//     weight: { type: Number, required: true },
//     sku: { type: String }
//   }],
//   delivery: {
//     pickupType: { type: String, enum: ['locker', 'staffed_hub'], required: true },
//     location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
//     assignedCompartment: { type: String },
//     lockerSize: { type: String, enum: ['small', 'medium', 'large'] },
//     status: { 
//       type: String, 
//       enum: ['created', 'in_transit', 'at_location', 'ready_for_pickup', 'picked_up', 'delivery_failed', 'return_requested', 'returned', 'expired', 'cancelled'],
//       default: 'created'
//     },
//     driver: { type: Schema.Types.ObjectId, ref: 'Driver' },
//     estimatedDelivery: { type: Date },
//     actualDelivery: { type: Date },
//     pickupDeadline: { type: Date, required: true }
//   },
//   payment: {
//     isCOD: { type: Boolean, default: false },
//     amount: { type: Number, default: 0 },
//     currency: { type: String, default: 'NGN' },
//     collected: { type: Boolean, default: false },
//     collectionDate: { type: Date },
//     paymentMethod: { type: String, enum: ['cash', 'card', 'mobile_money'] }
//   },
//   codes: {
//     customerPin: { type: String, required: true },
//     qrCode: { type: String, required: true },
//     driverCode: { type: String },
//     returnCode: { type: String }
//   },
//   metadata: {
//     notes: { type: String },
//     insurance: { type: Boolean, default: false },
//     fragile: { type: Boolean, default: false },
//     signatureRequired: { type: Boolean, default: false }
//   },
//   events: [{
//     status: { type: String, required: true },
//     description: { type: String, required: true },
//     location: { type: String },
//     timestamp: { type: Date, default: Date.now },
//     actor: { type: String }
//   }]
// }, { timestamps: true });

// // Indexes for performance
// parcelSchema.index({ merchant: 1, createdAt: -1 });
// parcelSchema.index({ trackingNumber: 1 });
// parcelSchema.index({ 'delivery.status': 1 });
// parcelSchema.index({ 'delivery.pickupDeadline': 1 });

// export default mongoose.model<IParcel>('Parcel', parcelSchema);


































// // src/models/Parcel.ts
// import mongoose, { Schema, Document } from 'mongoose';

// export type ParcelStatus = 
//   | 'created' 
//   | 'in_transit' 
//   | 'at_location' 
//   | 'ready_for_pickup' 
//   | 'picked_up' 
//   | 'delivery_failed'
//   | 'return_requested'
//   | 'returned'
//   | 'expired'
//   | 'cancelled';

// export interface IParcel extends Document {
//   trackingNumber: string;
//   merchant: mongoose.Types.ObjectId;
//   customer: {
//     name: string;
//     phone: string;
//     email?: string;
//   };
//   items: Array<{
//     description: string;
//     quantity: number;
//     value: number;
//     weight: number;
//   }>;
//   delivery: {
//     pickupType: 'locker' | 'staffed_hub';
//     location: mongoose.Types.ObjectId;
//     assignedCompartment?: string;
//     lockerSize: 'small' | 'medium' | 'large';
//     status: ParcelStatus;
//     pickupDeadline: Date;
//   };
//   payment: {
//     isCOD: boolean;
//     amount: number;
//     collected: boolean;
//   };
//   codes: {
//     customerPin: string;
//     qrCode: string;
//   };
//   events: Array<{
//     status: ParcelStatus;
//     description: string;
//     timestamp: Date;
//   }>;
// }

// const parcelSchema = new Schema<IParcel>({
//   trackingNumber: { type: String, required: true, unique: true },
//   merchant: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
//   customer: {
//     name: { type: String, required: true },
//     phone: { type: String, required: true },
//     email: { type: String }
//   },
//   items: [{
//     description: { type: String, required: true },
//     quantity: { type: Number, default: 1 },
//     value: { type: Number, required: true },
//     weight: { type: Number, required: true }
//   }],
//   delivery: {
//     pickupType: { type: String, enum: ['locker', 'staffed_hub'], required: true },
//     location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
//     assignedCompartment: { type: String },
//     lockerSize: { type: String, enum: ['small', 'medium', 'large'] },
//     status: { 
//       type: String, 
//       enum: ['created', 'in_transit', 'at_location', 'ready_for_pickup', 'picked_up', 'delivery_failed', 'return_requested', 'returned', 'expired', 'cancelled'],
//       default: 'created'
//     },
//     pickupDeadline: { type: Date, required: true }
//   },
//   payment: {
//     isCOD: { type: Boolean, default: false },
//     amount: { type: Number, default: 0 },
//     collected: { type: Boolean, default: false }
//   },
//   codes: {
//     customerPin: { type: String, required: true },
//     qrCode: { type: String, required: true }
//   },
//   events: [{
//     status: { type: String, required: true },
//     description: { type: String, required: true },
//     timestamp: { type: Date, default: Date.now }
//   }]
// }, { timestamps: true });

// export default mongoose.model<IParcel>('Parcel', parcelSchema);






