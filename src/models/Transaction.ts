// src/models/Transaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  merchantId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  paystackReference?: string;
  status: 'pending' | 'success' | 'failed';
  method: 'card' | 'bank_transfer' | 'wallet' | 'cash';
  balance: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  reference: { type: String, required: true, unique: true },
  paystackReference: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  method: { type: String, enum: ['card', 'bank_transfer', 'wallet', 'cash'], required: true },
  balance: { type: Number, required: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

transactionSchema.index({ merchantId: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 }, { unique: true });

const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export default TransactionModel;