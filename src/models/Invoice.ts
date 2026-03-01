// src/models/Invoice.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  merchantId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  period: string;
  issueDate: Date;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  amount: number;
  paidAmount: number;
  balance: number;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  transactions: Array<{
    transactionId: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
  }>;
  paystackInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  period: { type: String, required: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['paid', 'pending', 'overdue', 'draft'], default: 'draft' },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true }
  }],
  transactions: [{
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  paystackInvoiceId: { type: String }
}, {
  timestamps: true
});

invoiceSchema.index({ merchantId: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

const InvoiceModel = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema);
export default InvoiceModel;