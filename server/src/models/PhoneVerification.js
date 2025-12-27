import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true
    },
    codeHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);


