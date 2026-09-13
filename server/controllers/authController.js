import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { sendOtpEmail } from '../config/email.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'classic_cut_super_secure_secret_2026', {
    expiresIn: '30d',
  });
};

// 1. Send OTP for Email Verification
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'User already registered with this email. Please login.' });
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Save new OTP
    await Otp.create({
      email: cleanEmail,
      otp: otpCode,
    });

    console.log(`🔑 [OTP DISPATCH] Generated 6-digit code for ${cleanEmail}: ${otpCode}`);

    // Send email
    const emailResult = await sendOtpEmail(cleanEmail, otpCode);
    if (!emailResult.success) {
      console.error(`❌ [OTP DISPATCH] Outbound email failed for ${cleanEmail}: ${emailResult.error}`);
      // Strictly delete OTP from MongoDB so unverified requests cannot bypass security
      await Otp.deleteMany({ email: cleanEmail });
      return res.status(500).json({
        success: false,
        message: 'Failed to deliver verification code to this email address. Please check your email configuration or try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email inbox.',
    });
  } catch (error) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};

// 2. Register User with OTP
export const registerWithOtp = async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password, and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp || '').trim().replace(/[^0-9]/g, '');

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit OTP.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: cleanEmail });
    if (user && user.isVerified && !user.isDeleted) {
      return res.status(400).json({ message: 'User already exists with this email. Please login instead.' });
    }

    // Verify OTP: Match against active, unexpired OTPs
    const matchingOtp = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!matchingOtp) {
      // Determine exact reason to give clear, non-misleading feedback
      const latestOtp = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
      if (!latestOtp) {
        return res.status(400).json({
          message: 'No active OTP found for this email. Please request a new verification code.',
        });
      }
      if (new Date() > new Date(latestOtp.expiresAt)) {
        return res.status(400).json({
          message: 'Your verification code has expired. Please click Resend OTP for a fresh code.',
        });
      }
      return res.status(400).json({
        message: 'Incorrect OTP code. Please check the 6-digit code in your email and try again.',
      });
    }

    // Validate and sanitize phone number if provided
    let cleanPhone = '';
    if (phone && phone.trim()) {
      if (/[a-zA-Z]/.test(phone)) {
        return res.status(400).json({ message: 'Mobile number cannot contain alphabets/letters. Please enter a valid 10-digit number.' });
      }
      const digits = String(phone).replace(/[^0-9]/g, '');
      const validDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
      if (validDigits.length !== 10) {
        return res.status(400).json({ message: 'Mobile number must be a valid 10-digit number.' });
      }
      cleanPhone = '+91 ' + validDigits;
    }

    if (user) {
      // Update existing unverified user or reactivate soft-deleted account
      user.name = name;
      user.phone = cleanPhone;
      user.password = password;
      user.isVerified = true;
      if (user.isDeleted) {
        user.isDeleted = false;
        user.deletedAt = null;
        user.restoreExpiresAt = null;
        user.currentStamps = 0;
        user.archivedStamps = 0;
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password,
        isVerified: true,
      });
    }

    // Cleanup OTP
    await Otp.deleteMany({ email: cleanEmail });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful! Welcome to The Classic Cut Salon.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
      },
      token,
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Registration failed. ' + error.message });
  }
};

// 3. User & Admin Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Ensure admin role if matches configured admin email
    const adminEmail = (process.env.ADMIN_EMAIL || 'ok8023361@gmail.com').toLowerCase().trim();
    if ((cleanEmail === adminEmail || cleanEmail === 'ok8023361@gmail.com') && user.role !== 'admin') {
      user.role = 'admin';
    }

    // If customer account was in deleted state, allow login but restart Coupon Stamps from 0
    if (user.isDeleted) {
      user.isDeleted = false;
      user.deletedAt = null;
      user.restoreExpiresAt = null;
      user.currentStamps = 0;
      user.archivedStamps = 0;
    }
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
      },
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Login failed. ' + error.message });
  }
};

// 4. Google OAuth Login / Register
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential token is required' });
    }

    // Strictly verify token against Google OAuth servers
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Invalid or expired Google authentication token' });
    }

    const { email, name, sub: googleId } = payload;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user is configured as Admin
    const adminEmail = (process.env.ADMIN_EMAIL || 'ok8023361@gmail.com').toLowerCase().trim();
    const isAdmin = cleanEmail === adminEmail || cleanEmail === 'ok8023361@gmail.com';

    let user = await User.findOne({ email: cleanEmail });
    const isNewUser = !user;

    if (!user) {
      // Create new Google verified user with real name and email from Google (NO avatar stored)
      user = await User.create({
        name: name || 'Valued Guest',
        email: cleanEmail,
        googleId,
        role: isAdmin ? 'admin' : 'user',
        isVerified: true,
      });
    } else {
      // Ensure admin privileges if email matches admin
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (name) {
        user.name = name;
      }
      // If customer account was in deleted state, allow login but restart Coupon Stamps from 0
      if (user.isDeleted) {
        user.isDeleted = false;
        user.deletedAt = null;
        user.restoreExpiresAt = null;
        user.currentStamps = 0;
        user.archivedStamps = 0;
      }
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: isNewUser ? 'Account registered with Google' : 'Welcome back! Signed in with Google',
      isNewUser,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
        isNewUser,
        needsPhone: isNewUser && !user.phone, // ONLY true for brand-new users without a phone
      },
      token,
    });
  } catch (error) {
    console.error('Google Auth Verification Error:', error.message);
    res.status(401).json({ message: 'Google Authentication failed: ' + error.message });
  }
};

// 5. Get Current Authenticated User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// 6. Update User Profile (e.g., Mobile Number, Name)
export const updateProfile = async (req, res) => {
  try {
    const { phone, name } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (phone !== undefined) {
      if (phone.trim()) {
        if (/[a-zA-Z]/.test(phone)) {
          return res.status(400).json({ message: 'Mobile number cannot contain alphabets/letters. Please enter a valid 10-digit number.' });
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
    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
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
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
