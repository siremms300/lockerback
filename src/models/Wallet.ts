// src/models/Wallet.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  merchantId: mongoose.Types.ObjectId;
  balance: number;
  pendingBalance: number;
  creditLimit: number;
  availableCredit: number;
  autoTopUp: boolean;
  topUpThreshold: number;
  lastTopUp?: Date;
  paystackCustomerCode?: string;
  paystackAuthorization?: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, unique: true },
  balance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 500000 },
  availableCredit: { type: Number, default: 500000 },
  autoTopUp: { type: Boolean, default: false },
  topUpThreshold: { type: Number, default: 50000 },
  lastTopUp: { type: Date },
  paystackCustomerCode: { type: String },
  paystackAuthorization: {
    authorization_code: { type: String },
    card_type: { type: String },
    last4: { type: String },
    exp_month: { type: String },
    exp_year: { type: String }
  }
}, {
  timestamps: true
});

const WalletModel = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', walletSchema);
export default WalletModel;