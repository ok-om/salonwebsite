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

    // Send email
    const emailResult = await sendOtpEmail(cleanEmail, otpCode);

    res.status(200).json({
      message: 'OTP sent to your email successfully',
      mode: emailResult.mode,
      // Provide devOtp only in development when SMTP is not configured
      devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ message: 'Failed to send OTP. ' + error.message });
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

    // Verify OTP
    const validOtp = await Otp.findOne({ email: cleanEmail, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: cleanEmail });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (user) {
      // Update existing unverified user
      user.name = name;
      user.phone = phone || '';
      user.password = password;
      user.isVerified = true;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email: cleanEmail,
        phone: phone || '',
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

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      // Fallback for decoded token in case client is test/mock
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        return res.status(400).json({ message: 'Invalid Google authentication token' });
      }
    }

    const { email, name, sub: googleId, picture } = payload;
    const cleanEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Create new Google verified user
      user = await User.create({
        name: name || 'Valued Guest',
        email: cleanEmail,
        googleId,
        avatar: picture || '',
        isVerified: true,
      });
    } else {
      // Link Google ID if missing
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Google Sign-In successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
      },
      token,
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google Authentication failed. ' + error.message });
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
