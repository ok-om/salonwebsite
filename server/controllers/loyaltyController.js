import { User } from '../models/User.js';
import { VisitLog } from '../models/VisitLog.js';
import { OfferCoupon } from '../models/OfferCoupon.js';
import { SiteConfig } from '../models/SiteConfig.js';

// Helper: Generate unique coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CUT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 1. Admin Awards +1 Visit Stamp to Customer
export const addVisitStamp = async (req, res) => {
  try {
    const { userId, serviceName, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Record visit log
    const visit = await VisitLog.create({
      user: user._id,
      admin: req.user._id,
      serviceName: serviceName || 'Salon Grooming & Haircut',
      notes: notes || '',
      stampAwarded: 1,
      visitedAt: new Date(),
    });

    user.currentStamps = (user.currentStamps || 0) + 1;
    user.lifetimeVisits = (user.lifetimeVisits || 0) + 1;

    let offerUnlocked = false;
    let newCoupon = null;

    // Check if 5 stamps milestone reached
    if (user.currentStamps >= 5) {
      offerUnlocked = true;

      // Get salon default offer settings from CMS
      const siteConfig = await SiteConfig.findOne();
      const offerTitle = siteConfig?.defaultOfferTitle || 'Complimentary Royal Haircut & Beard Sculpting';
      const offerDiscount = siteConfig?.defaultOfferDiscount || '100% OFF / FREE SERVICE';

      // Generate unique coupon
      let uniqueCode = generateCouponCode();
      while (await OfferCoupon.findOne({ code: uniqueCode })) {
        uniqueCode = generateCouponCode();
      }

      newCoupon = await OfferCoupon.create({
        code: uniqueCode,
        user: user._id,
        title: offerTitle,
        discountType: offerDiscount,
      });

      // RESET active stamps to 0 for next cycle
      user.currentStamps = 0;
    }

    await user.save();

    res.status(200).json({
      message: offerUnlocked
        ? '🎉 Congratulations! 5th Stamp reached! 1x Special Offer Coupon awarded and stamps reset to 0.'
        : `Stamp awarded successfully! Customer now has ${user.currentStamps}/5 stamps.`,
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      offerUnlocked,
      coupon: newCoupon,
      visit,
    });
  } catch (error) {
    console.error('Add Stamp Error:', error);
    res.status(500).json({ message: 'Failed to add visit stamp. ' + error.message });
  }
};

// 2. Admin: Get All Customers with Stamp Counts & Filters
export const getAllCustomers = async (req, res) => {
  try {
    const { search = '' } = req.query;

    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ updatedAt: -1 });

    // Attach latest visit and coupon counts to each customer
    const customerData = await Promise.all(
      users.map(async (u) => {
        const lastVisit = await VisitLog.findOne({ user: u._id }).sort({ visitedAt: -1 });
        const couponsCount = await OfferCoupon.countDocuments({ user: u._id, isRedeemed: false });
        return {
          ...u.toObject(),
          lastVisitDate: lastVisit?.visitedAt || null,
          lastServiceName: lastVisit?.serviceName || 'N/A',
          activeCouponsCount: couponsCount,
        };
      })
    );

    res.status(200).json(customerData);
  } catch (error) {
    console.error('Get Customers Error:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
};

// 3. User & Admin: Get Visit History for a User
export const getVisitHistory = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id;

    // Security: Only admin or the user themselves can view this
    if (req.user.role !== 'admin' && req.user._id.toString() !== targetUserId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this history' });
    }

    const visits = await VisitLog.find({ user: targetUserId })
      .populate('admin', 'name')
      .sort({ visitedAt: -1 });

    res.status(200).json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch visit history' });
  }
};

// 4. User: Get Current User's Loyalty Profile & Coupons
export const getMyLoyalty = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email phone currentStamps lifetimeVisits');
    const coupons = await OfferCoupon.find({ user: req.user._id }).sort({ createdAt: -1 });
    const recentVisits = await VisitLog.find({ user: req.user._id }).sort({ visitedAt: -1 }).limit(5);

    res.status(200).json({
      user,
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      stampsNeeded: 5 - user.currentStamps,
      coupons,
      recentVisits,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loyalty status' });
  }
};

// 5. Admin: Redeem a Coupon Code
export const redeemCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await OfferCoupon.findOne({ code: code.toUpperCase().trim() }).populate('user', 'name phone email');

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (coupon.isRedeemed) {
      return res.status(400).json({
        message: `This coupon was already redeemed on ${new Date(coupon.redeemedAt).toLocaleDateString()}`,
        coupon,
      });
    }

    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    coupon.isRedeemed = true;
    coupon.redeemedAt = new Date();
    coupon.redeemedBy = req.user._id;
    await coupon.save();

    res.status(200).json({
      message: `✅ Coupon ${coupon.code} redeemed successfully for ${coupon.user.name}!`,
      coupon,
    });
  } catch (error) {
    console.error('Redeem Coupon Error:', error);
    res.status(500).json({ message: 'Failed to redeem coupon' });
  }
};
