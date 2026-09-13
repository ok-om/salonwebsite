import mongoose from 'mongoose';

const offerCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Exclusive 5-Stamp Reward Offer',
    },
    discountType: {
      type: String,
      default: '30% to 40% OFF Luxury Grooming',
    },
    isRedeemed: {
      type: Boolean,
      default: false,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days validity
    },
  },
  { timestamps: true }
);

// MongoDB TTL index to automatically purge expired coupons after 35 days
offerCouponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OfferCoupon = mongoose.model('OfferCoupon', offerCouponSchema);
