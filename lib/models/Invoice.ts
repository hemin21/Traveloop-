import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  category: string;
  description: string;
  qty: number;
  unitCost: number;
  amount: number;
}

export interface IInvoice extends Document {
  tripId: mongoose.Types.ObjectId;
  invoiceId: string;
  travelers: string[];
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentStatus: 'pending' | 'paid';
  generatedDate: Date;
}

const InvoiceItemSchema: Schema = new Schema({
  category: { type: String, required: true },
  description: { type: String, required: true },
  qty: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  invoiceId: { type: String, required: true },
  travelers: { type: [String], default: [] },
  items: { type: [InvoiceItemSchema], default: [] },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  generatedDate: { type: Date, default: Date.now },
});

// Indexes for fast lookups
InvoiceSchema.index({ tripId: 1 }, { unique: true }); // one invoice per trip

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
