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

const router = express.Router();

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
