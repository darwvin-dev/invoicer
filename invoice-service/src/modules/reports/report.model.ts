import mongoose, { Schema, InferSchemaType, type Model } from 'mongoose';

const ReportItem = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    totalQuantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ReportSchema = new Schema(
  {
    type: { type: String, required: true, enum: ['daily_sales_report'] },
    dateRange: {
      from: { type: String, required: true },
      to:   { type: String, required: true },
      tz:   { type: String, required: true },
    },
    totalSalesAmount: { type: Number, required: true, min: 0 },
    items: { type: [ReportItem], required: true, default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

ReportSchema.index({ 'dateRange.from': 1 }, { unique: true });

export type ReportDoc = InferSchemaType<typeof ReportSchema>;

export const ReportModel: Model<ReportDoc> =
  mongoose.models.Report || mongoose.model<ReportDoc>('Report', ReportSchema);
