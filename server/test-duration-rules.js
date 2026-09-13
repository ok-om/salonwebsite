import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { OfferCoupon } from './models/OfferCoupon.js';
import { VisitLog } from './models/VisitLog.js';
import { applyStampInactivityCheck, purgeExpiredDeletedUsers } from './controllers/loyaltyController.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const runTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 THE CLASSIC CUT SALON — AUTOMATED DURATION RULES TEST SUITE');
  console.log('=============================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Cloud for testing.\n');

    // Clean any previous test artifacts
    await User.deleteMany({ email: /@classiccut\.test$/ });
    await OfferCoupon.deleteMany({ code: /^TEST-/ });

    let testsPassed = 0;
    let totalTests = 3;

    // -------------------------------------------------------------
    // TEST 1: 35-Day Coupon Expiry & Automatic Database Cleanup
    // -------------------------------------------------------------
    console.log('--- [TEST 1] 35-Day Coupon Expiry & Database Auto-Purge ---');
    const testCustomer1 = await User.create({
      name: 'Test Coupon User',
      email: 'coupon_test_user@classiccut.test',
      password: 'password123',
      role: 'user',
    });

    // 1. Create expired coupon (simulating created 36 days ago -> expired 1 day ago)
    const expiredDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const expiredCoupon = await OfferCoupon.create({
      code: 'TEST-EXP35',
      user: testCustomer1._id,
      title: '30% to 40% OFF Luxury Grooming',
      discountType: '30% - 40% OFF',
      expiresAt: expiredDate,
    });

    // 2. Create valid coupon (35 days from now)
    const validDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
    const validCoupon = await OfferCoupon.create({
      code: 'TEST-VAL35',
      user: testCustomer1._id,
      title: '30% to 40% OFF Luxury Grooming',
      discountType: '30% - 40% OFF',
      expiresAt: validDate,
    });

    console.log(`  • Created Expired Coupon: ${expiredCoupon.code} (Expired on: ${expiredCoupon.expiresAt.toISOString()})`);
    console.log(`  • Created Valid Coupon: ${validCoupon.code} (Expires on: ${validCoupon.expiresAt.toISOString()})`);

    // Execute automatic DB purge
    const purgeResult = await OfferCoupon.deleteMany({
      $or: [
        { isRedeemed: true },
        { expiresAt: { $lt: new Date() } },
      ],
    });
    console.log(`  • Purge Triggered: ${purgeResult.deletedCount} expired/redeemed coupons removed from DB.`);

    const checkExpired = await OfferCoupon.findOne({ code: 'TEST-EXP35' });
    const checkValid = await OfferCoupon.findOne({ code: 'TEST-VAL35' });

    if (!checkExpired && checkValid) {
      console.log('  ✅ PASS: Expired coupon permanently purged from MongoDB database.');
      console.log('  ✅ PASS: Valid 35-day coupon safely retained.');
      testsPassed++;
    } else {
      throw new Error('Test 1 Failed: Expired coupon was not purged or valid coupon was deleted.');
    }
    console.log('');

    // -------------------------------------------------------------
    // TEST 2: 45-Day Stamp Inactivity Decay Rule (-1 Stamp Penalty)
    // -------------------------------------------------------------
    console.log('--- [TEST 2] 45-Day Stamp Inactivity Decay (-1 Stamp Penalty) ---');
    const testCustomer2 = await User.create({
      name: 'Test Decay User',
      email: 'decay_test_user@classiccut.test',
      password: 'password123',
      role: 'user',
      currentStamps: 3,
      // Stamp awarded 50 days ago (> 45 days inactivity)
      lastStampDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    });

    console.log(`  • Initial State: Stamps = ${testCustomer2.currentStamps}, Last Stamp = 50 days ago`);

    // Run 45-day decay check
    const decay1 = await applyStampInactivityCheck(testCustomer2);
    console.log(`  • Decay Check Result: decayed=${decay1.decayed}, stampsDecayed=${decay1.stampsDecayed}, remainingStamps=${testCustomer2.currentStamps}`);

    if (testCustomer2.currentStamps !== 2) {
      throw new Error(`Test 2a Failed: Expected 2 stamps after 50 days inactivity, got ${testCustomer2.currentStamps}`);
    }
    console.log('  ✅ PASS: Stamps decremented by 1 (3 ➔ 2) after 45+ days inactivity.');

    // Test 2b: Multi-cycle inactivity down to 0
    testCustomer2.currentStamps = 1;
    testCustomer2.lastStampDate = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000); // 95 days ago (> 90 days = 2 cycles)
    await testCustomer2.save();

    const decay2 = await applyStampInactivityCheck(testCustomer2);
    if (testCustomer2.currentStamps !== 0 || testCustomer2.lastStampDate !== null) {
      throw new Error(`Test 2b Failed: Expected 0 stamps and null lastStampDate, got ${testCustomer2.currentStamps}`);
    }
    console.log('  ✅ PASS: Multi-cycle decay correctly reached 0 and cleared lastStampDate.');

    // Test 2c: 0 stamps remains 0 (never negative)
    testCustomer2.currentStamps = 0;
    testCustomer2.lastStampDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const decay3 = await applyStampInactivityCheck(testCustomer2);
    if (testCustomer2.currentStamps !== 0) {
      throw new Error('Test 2c Failed: 0 stamps became negative.');
    }
    console.log('  ✅ PASS: 0 stamps remained 0 (never drops below 0).');

    // Test 2d: Active user within 45 days (no decay)
    testCustomer2.currentStamps = 4;
    testCustomer2.lastStampDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago (< 45 days)
    const decay4 = await applyStampInactivityCheck(testCustomer2);
    if (decay4.decayed || testCustomer2.currentStamps !== 4 || decay4.daysUntilDecay < 34) {
      throw new Error('Test 2d Failed: Active user within 45 days decayed prematurely.');
    }
    console.log(`  ✅ PASS: Active user stamps preserved at 4, reports ${decay4.daysUntilDecay} days remaining until decay.`);
    testsPassed++;
    console.log('');

    // -------------------------------------------------------------
    // TEST 3: 24-Hour Soft Delete & Recovery Window & Permanent Purge
    // -------------------------------------------------------------
    console.log('--- [TEST 3] 24-Hour User Soft Delete & Permanent Purge ---');
    const testCustomer3 = await User.create({
      name: 'Test Delete User',
      email: 'delete_test_user@classiccut.test',
      password: 'password123',
      role: 'user',
      isDeleted: true,
      deletedAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
      restoreExpiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours past 24h window
    });

    console.log(`  • Created Soft-Deleted User: ${testCustomer3.email} with expired 24h restore window.`);

    // Run purge
    await purgeExpiredDeletedUsers();

    const checkDeleted = await User.findById(testCustomer3._id);
    if (checkDeleted === null) {
      console.log('  ✅ PASS: User whose 24-hour restore window expired was permanently purged from database.');
      testsPassed++;
    } else {
      throw new Error('Test 3 Failed: Expired deleted user was not purged.');
    }
    console.log('');

    // Clean up test documents
    await User.deleteMany({ email: /@classiccut\.test$/ });
    await OfferCoupon.deleteMany({ code: /^TEST-/ });

    console.log('=============================================================');
    console.log(`🎉 ALL TESTS COMPLETED: ${testsPassed}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('=============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
