import express from 'express';
import {
  requestOtp,
  registerWithOtp,
  login,
  googleAuth,
  getProfile,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/request-otp', otpLimiter, requestOtp);
router.post('/register', authLimiter, registerWithOtp);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
