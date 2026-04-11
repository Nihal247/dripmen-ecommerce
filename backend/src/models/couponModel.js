import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    showOnTopBar: {
      type: Boolean,
      default: false,
    },
    tag: {
      type: String,
      enum: ["HOT", "NEW", "LIMITED", ""],
      default: "HOT"
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // Only used for percentage discounts
    },
    isOneTimePerUser: {
      type: Boolean,
      default: false,
    },
    usedByUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ]
  },
  { timestamps: true }
);

// Check if expired
couponSchema.virtual("isExpired").get(function () {
  return Date.now() > this.expiryDate;
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
