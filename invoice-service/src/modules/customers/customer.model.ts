import mongoose, { Schema, InferSchemaType, type Model, type HydratedDocument } from 'mongoose';

const CustomerSchema = new Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date(), index: true },
}, { versionKey: false });

export type CustomerDoc = InferSchemaType<typeof CustomerSchema>;         
export type CustomerEntity = HydratedDocument<CustomerDoc>;            

export const CustomerModel: Model<CustomerDoc> =
  (mongoose.models.Customer as Model<CustomerDoc>) ||
  mongoose.model<CustomerDoc>('Customer', CustomerSchema);
