import mongoose, { Schema, InferSchemaType, type Model } from 'mongoose';

const Item = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

type ItemDB = InferSchemaType<typeof Item>;

const InvoiceSchema = new Schema(
  {
    customerId: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: () => new Date(), index: true },
    currency: { type: String, required: true, trim: true },
    items: {
      type: [Item],
      required: true,
      validate: (v: ItemDB[]) => Array.isArray(v) && v.length > 0,
    },
    invoiceTotal: { type: Number, required: true, min: 0 },
  },
  { versionKey: false }
);

InvoiceSchema.index({ createdAt: 1 });

InvoiceSchema.pre('validate', function (next) {
  const self = this as unknown as { items: ItemDB[]; invoiceTotal: number };
  self.invoiceTotal = (self.items || []).reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );
  next();
});

export type InvoiceDoc = InferSchemaType<typeof InvoiceSchema>;

export const InvoiceModel: Model<InvoiceDoc> =
  (mongoose.models.Invoice as Model<InvoiceDoc>) ||
  mongoose.model<InvoiceDoc>('Invoice', InvoiceSchema);
