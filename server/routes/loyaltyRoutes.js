import express from 'express';
import {
  addVisitStamp,
  getAllCustomers,
  getVisitHistory,
  getMyLoyalty,
  redeemCoupon,
} from '../controllers/loyaltyController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// User endpoints
router.get('/my-stamps', protect, getMyLoyalty);
router.get('/visits/:userId?', protect, getVisitHistory);

// Admin endpoints
router.post('/add-stamp', protect, adminOnly, addVisitStamp);
router.get('/customers', protect, adminOnly, getAllCustomers);
router.post('/redeem-coupon', protect, adminOnly, redeemCoupon);

export default router;
