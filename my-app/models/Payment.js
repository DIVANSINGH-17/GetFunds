import mongoose from "mongoose";
const { Schema, model } = mongoose;

const PaymentSchema = new Schema({
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 60,
  },
  to_user: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  oid: {
    type: String,
    required: true,
    unique: true,
  },
  paymentId: {
    type: String,
    trim: true,
    index: true,
  },
  message: {
    type: String,
    trim: true,
    maxlength: 240,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 100000,
  },
  mode: {
    type: String,
    enum: ["demo", "razorpay", "razorpay-test"],
    default: "demo",
  },
  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "completed",
    index: true,
  },
  done: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

PaymentSchema.index({ creatorId: 1, done: 1, amount: -1 });
PaymentSchema.index({ creatorId: 1, done: 1, createdAt: -1 });
PaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Payment || model("Payment", PaymentSchema);
