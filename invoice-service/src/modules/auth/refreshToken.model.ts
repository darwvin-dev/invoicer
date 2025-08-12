import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const RefreshTokenSchema = new Schema(
  {
    jti: { type: String, required: true, unique: true, index: true },
    customerId: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
      ref: "Customer",
    },
    isRevoked: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date(), index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { versionKey: false }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = InferSchemaType<typeof RefreshTokenSchema>;
export const RefreshTokenModel: Model<RefreshTokenDoc> =
  (mongoose.models.RefreshToken as Model<RefreshTokenDoc>) ||
  mongoose.model<RefreshTokenDoc>("RefreshToken", RefreshTokenSchema);
