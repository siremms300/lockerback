// src/models/Merchant.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IMerchant extends Document {
  businessName: string;
  email: string;
  phone: string;
  password: string;
  businessType: string;
  role: 'admin' | 'merchant' | 'super_admin';  // ADD THIS
  permissions?: string[];  // ADD THIS (optional for granular control)
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  billing?: {
    walletBalance: number;
    creditLimit: number;
    paymentMethod: string;
    autoTopUp: boolean;
    topUpThreshold: number;
  };
  settings?: {
    defaultLockerSize: string;
    smsNotifications: boolean;
    emailNotifications: boolean;
    autoApproveReturns: boolean;
  };
  apiKey?: string;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateApiKey(): string;
  hasPermission(permission: string): boolean;  // ADD THIS
}

const merchantSchema = new Schema<IMerchant>({
  businessName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  businessType: { type: String, required: true },
  // ADD ROLE FIELD
  role: { 
    type: String, 
    enum: ['admin', 'merchant', 'super_admin'],
    default: 'merchant'  // Default to merchant for new signups
  },
  // ADD PERMISSIONS FIELD (optional)
  permissions: [{ 
    type: String,
    enum: [
      'locations:create',
      'locations:edit',
      'locations:delete',
      'drivers:create',
      'drivers:edit',
      'drivers:delete',
      'users:manage',
      'roles:manage'
    ]
  }],
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Nigeria' },
    postalCode: String
  },
  billing: {
    walletBalance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 1000 },
    paymentMethod: { type: String, default: 'wallet' },
    autoTopUp: { type: Boolean, default: false },
    topUpThreshold: { type: Number, default: 100 }
  },
  settings: {
    defaultLockerSize: { type: String, default: 'medium' },
    smsNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    autoApproveReturns: { type: Boolean, default: false }
  },
  apiKey: { type: String, unique: true, sparse: true },
  webhookUrl: { type: String },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true
});

// Hash password before saving
merchantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
merchantSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate API key
merchantSchema.methods.generateApiKey = function(): string {
  const crypto = require('crypto');
  this.apiKey = `lk_${crypto.randomBytes(32).toString('hex')}`;
  return this.apiKey;
};

// ADD PERMISSION CHECK METHOD
merchantSchema.methods.hasPermission = function(permission: string): boolean {
  // Admins and super_admins have all permissions
  if (this.role === 'admin' || this.role === 'super_admin') {
    return true;
  }
  
  // Merchants have limited permissions based on the permissions array
  return this.permissions?.includes(permission) || false;
};

// Check if model already exists before compiling
const MerchantModel = mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', merchantSchema);

export default MerchantModel;





































































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
//   timestamps: true
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

// // Check if model already exists before compiling
// const MerchantModel = mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', merchantSchema);

// export default MerchantModel;









































// // src/models/Merchant.ts
// import mongoose, { Schema, Document } from 'mongoose';
// import bcrypt from 'bcryptjs';

// export interface IMerchant extends Document {
//   businessName: string;
//   email: string;
//   phone: string;
//   password: string;
//   businessType: string;
//   address: {
//     street: string;
//     city: string;
//     state: string;
//     country: string;
//     postalCode: string;
//   };
//   billing: {
//     walletBalance: number;
//     creditLimit: number;
//     paymentMethod: 'wallet' | 'card' | 'bank_transfer';
//     autoTopUp: boolean;
//     topUpThreshold: number;
//   };
//   settings: {
//     defaultLockerSize: 'small' | 'medium' | 'large';
//     smsNotifications: boolean;
//     emailNotifications: boolean;
//     autoApproveReturns: boolean;
//     preferredLocations: mongoose.Types.ObjectId[];
//   };
//   apiKey?: string;
//   webhookUrl?: string;
//   isActive: boolean;
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
//     country: String,
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
//     autoApproveReturns: { type: Boolean, default: false },
//     preferredLocations: [{ type: Schema.Types.ObjectId, ref: 'Location' }]
//   },
//   apiKey: { type: String, unique: true, sparse: true },
//   webhookUrl: { type: String },
//   isActive: { type: Boolean, default: true }
// }, { timestamps: true });

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












































// // backend/src/models/Merchant.ts
// import mongoose, { Schema, Document } from 'mongoose';
// import bcrypt from 'bcryptjs';

// export interface IMerchant extends Document {
//   businessName: string;
//   email: string;
//   phone: string;
//   password: string;
//   businessType: string;
//   website?: string;
//   address: {
//     street: string;
//     city: string;
//     state: string;
//     country: string;
//     postalCode: string;
//   };
//   billing: {
//     walletBalance: number;
//     creditLimit: number;
//     paymentMethod: 'wallet' | 'card' | 'bank_transfer';
//     autoTopUp: boolean;
//     topUpThreshold: number;
//   };
//   settings: {
//     defaultLockerSize: 'small' | 'medium' | 'large';
//     smsNotifications: boolean;
//     emailNotifications: boolean;
//     autoApproveReturns: boolean;
//     preferredLocations: mongoose.Types.ObjectId[];
//   };
//   apiKey?: string;
//   webhookUrl?: string;
//   isActive: boolean;
//   comparePassword(candidatePassword: string): Promise<boolean>;
//   generateApiKey(): string;
// }

// const merchantSchema = new Schema<IMerchant>({
//   businessName: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   phone: { type: String, required: true },
//   password: { type: String, required: true },
//   businessType: { type: String, required: true },
//   website: { type: String },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     country: String,
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
//     autoApproveReturns: { type: Boolean, default: false },
//     preferredLocations: [{ type: Schema.Types.ObjectId, ref: 'Location' }]
//   },
//   apiKey: { type: String, unique: true, sparse: true },
//   webhookUrl: { type: String },
//   isActive: { type: Boolean, default: true }
// }, { timestamps: true });

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