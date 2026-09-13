import express from 'express';
import {
  addVisitStamp,
  getAllCustomers,
  getVisitHistory,
  getMyLoyalty,
  redeemCoupon,
  deleteCustomer,
  getDeletedCustomers,
  restoreCustomer,
  permanentDeleteCustomer,
  updateCustomerByAdmin,
} from '../controllers/loyaltyController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { registerRealtimeClient } from '../services/realtimeService.js';

const router = express.Router();

// Real-time Live-Stream endpoint (SSE for zero-reload updates)
router.get('/live-stream', async (req, res) => {
  let user = null;
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'classic_cut_super_secure_secret_2026');
      user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Proceed as guest
    }
  }
  registerRealtimeClient(req, res, user);
});

// User endpoints
router.get('/my-stamps', protect, getMyLoyalty);
router.get('/visits/:userId?', protect, getVisitHistory);

// Admin endpoints
router.post('/add-stamp', protect, adminOnly, addVisitStamp);
router.get('/customers', protect, adminOnly, getAllCustomers);
router.put('/customers/:id', protect, adminOnly, updateCustomerByAdmin);
router.post('/redeem-coupon', protect, adminOnly, redeemCoupon);

// Customer soft delete & 24h recovery endpoints
router.delete('/customers/:id', protect, adminOnly, deleteCustomer);
router.get('/deleted-customers', protect, adminOnly, getDeletedCustomers);
router.post('/customers/:id/restore', protect, adminOnly, restoreCustomer);
router.delete('/customers/:id/permanent', protect, adminOnly, permanentDeleteCustomer);

export default router;
