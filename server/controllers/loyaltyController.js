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

    // Clean up any accounts past their 24h restore window
    await purgeExpiredDeletedUsers();

    const query = { role: 'user', isDeleted: { $ne: true } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

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
    // Purge any previously redeemed coupons permanently from database
    await OfferCoupon.deleteMany({ isRedeemed: true });

    const user = await User.findById(req.user._id).select('name email phone currentStamps lifetimeVisits');
    const coupons = await OfferCoupon.find({ user: req.user._id, isRedeemed: { $ne: true } }).sort({ createdAt: -1 });
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
      return res.status(404).json({ message: 'Invalid coupon code or already used & cleared' });
    }

    if (coupon.isRedeemed) {
      // Remove it from DB if it wasn't purged
      await OfferCoupon.findByIdAndDelete(coupon._id);
      return res.status(400).json({
        message: 'This coupon was already redeemed and has now been removed.',
      });
    }

    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    const customerName = coupon.user?.name || 'Customer';
    const couponCode = coupon.code;

    // Permanently remove redeemed coupon from DB as requested
    await OfferCoupon.findByIdAndDelete(coupon._id);

    res.status(200).json({
      message: `✅ Coupon ${couponCode} redeemed successfully for ${customerName} and cleared from system!`,
      coupon: { ...coupon.toObject(), isRedeemed: true },
    });
  } catch (error) {
    console.error('Redeem Coupon Error:', error);
    res.status(500).json({ message: 'Failed to redeem coupon' });
  }
};

// 6. Helper: Automatically Purge Users Whose 24-Hour Restore Window Expired
export const purgeExpiredDeletedUsers = async () => {
  try {
    const expiredUsers = await User.find({
      isDeleted: true,
      restoreExpiresAt: { $lte: new Date() },
    });

    for (const u of expiredUsers) {
      // Cascade delete all associated data
      await VisitLog.deleteMany({ user: u._id });
      await OfferCoupon.deleteMany({ user: u._id });
      await User.findByIdAndDelete(u._id);
      console.log(`🗑️ Permanently purged expired user: ${u.email} (24-hour recovery window ended)`);
    }
  } catch (err) {
    console.error('Purge Expired Users Error:', err.message);
  }
};

// 7. Admin: Soft Delete Customer with 24-Hour Recovery Window
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Protect Admin accounts from deletion
    if (user.role === 'admin' || user.email === 'ok8023361@gmail.com') {
      return res.status(403).json({ message: 'Admin account cannot be deleted' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    // 24 hours recovery window
    user.restoreExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Archive current stamps and visits so they can be restored within 24 hours
    user.archivedStamps = user.currentStamps || 0;
    user.archivedVisits = user.lifetimeVisits || 0;
    // Reset active stamps so if customer accesses while deleted, stamps restart from 0
    user.currentStamps = 0;
    await user.save();

    res.status(200).json({
      message: `Customer ${user.name} moved to 24-Hour Recovery. You can restore this account anytime within 24 hours.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        deletedAt: user.deletedAt,
        restoreExpiresAt: user.restoreExpiresAt,
      },
    });
  } catch (error) {
    console.error('Delete Customer Error:', error);
    res.status(500).json({ message: 'Failed to delete customer: ' + error.message });
  }
};

// 8. Admin: Get List of Deleted Customers in 24-Hour Recovery
export const getDeletedCustomers = async (req, res) => {
  try {
    // Purge any accounts that exceeded 24 hours
    await purgeExpiredDeletedUsers();

    const deletedUsers = await User.find({ isDeleted: true })
      .select('-password')
      .sort({ deletedAt: -1 });

    const recoveryList = deletedUsers.map((u) => {
      const remainingMs = Math.max(0, new Date(u.restoreExpiresAt) - new Date());
      const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
      const minsLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        ...u.toObject(),
        remainingHours: hoursLeft,
        remainingMinutes: minsLeft,
        timeLeftFormatted: `${hoursLeft}h ${minsLeft}m remaining`,
      };
    });

    res.status(200).json(recoveryList);
  } catch (error) {
    console.error('Get Deleted Customers Error:', error);
    res.status(500).json({ message: 'Failed to fetch recovery accounts' });
  }
};

// 9. Admin: Restore Soft-Deleted Customer Within 24 Hours
export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Customer record not found or already permanently purged' });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.restoreExpiresAt = null;
    // Restore previous stamps and visits
    user.currentStamps = Math.max(user.currentStamps || 0, user.archivedStamps || 0);
    user.lifetimeVisits = Math.max(user.lifetimeVisits || 0, user.archivedVisits || 0);
    await user.save();

    res.status(200).json({
      message: `Account for ${user.name} (${user.email}) has been fully restored with ${user.currentStamps}/5 Coupe Stamps!`,
      user,
    });
  } catch (error) {
    console.error('Restore Customer Error:', error);
    res.status(500).json({ message: 'Failed to restore customer' });
  }
};

// 10. Admin: Permanent Delete Customer (Manual Immediate Purge)
export const permanentDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (user.role === 'admin' || user.email === 'ok8023361@gmail.com') {
      return res.status(403).json({ message: 'Admin account cannot be deleted' });
    }

    // Cascade delete all associated data
    await VisitLog.deleteMany({ user: user._id });
    await OfferCoupon.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      message: `Customer ${user.name} and all associated records permanently purged from database.`,
    });
  } catch (error) {
    console.error('Permanent Delete Customer Error:', error);
    res.status(500).json({ message: 'Failed to permanently delete customer' });
  }
};

// 11. Admin: Update Customer Details (Name & Mobile Number Only - Email is protected)
export const updateCustomerByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Name update
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Customer name cannot be empty' });
      }
      user.name = name.trim();
    }

    // Phone update with validation
    if (phone !== undefined) {
      if (phone.trim()) {
        if (/[a-zA-Z]/.test(phone)) {
          return res.status(400).json({ message: 'Mobile number cannot contain letters.' });
        }
        const digits = String(phone).replace(/[^0-9]/g, '');
        const validDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
        if (validDigits.length !== 10) {
          return res.status(400).json({ message: 'Mobile number must be a valid 10-digit number.' });
        }
        user.phone = '+91 ' + validDigits;
      } else {
        user.phone = '';
      }
    }

    // Email is strictly non-editable as required by owner

    await user.save();

    res.status(200).json({
      message: `Customer ${user.name} updated successfully!`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
      },
    });
  } catch (error) {
    console.error('Update Customer Error:', error);
    res.status(500).json({ message: 'Failed to update customer: ' + error.message });
  }
};

