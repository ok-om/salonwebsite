import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp) => {
  try {
    const smtpHost = process.env.EMAIL_HOST;
    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"The Classic Cut Salon" <${smtpUser}>`,
        to: email,
        subject: `Your Verification Code: ${otp} - The Classic Cut Salon`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border-radius: 12px; background-color: #12141a; color: #f4f4f6;">
            <h2 style="color: #d4af37; text-align: center; margin-bottom: 5px;">THE CLASSIC CUT SALON</h2>
            <p style="text-align: center; color: #a0a5b5; font-size: 14px;">Gentleman Grooming & Luxury Barber</p>
            <div style="margin: 30px 0; padding: 20px; background: #1c1f26; text-align: center; border-radius: 8px; border: 1px dashed #d4af37;">
              <p style="margin: 0; font-size: 14px; color: #cbd5e1;">Your 6-Digit Verification Code:</p>
              <h1 style="font-size: 36px; letter-spacing: 6px; color: #ffffff; margin: 10px 0;">${otp}</h1>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">Valid for 10 minutes only. Do not share this code.</p>
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`✉️ Real OTP email sent successfully to ${email}`);
      return { success: true, mode: 'smtp' };
    } else {
      // Development mode fallback: Log OTP prominently to terminal
      console.log(`\n======================================================`);
      console.log(`🔑 DEV MODE OTP for [${email}]: >>> ${otp} <<<`);
      console.log(`(Configure EMAIL_HOST, EMAIL_USER, EMAIL_PASS in server/.env for live delivery)`);
      console.log(`======================================================\n`);
      return { success: true, mode: 'dev_mock', otp };
    }
  } catch (error) {
    console.error(`Error sending OTP email: ${error.message}`);
    // Still log OTP in development so user isn't stuck
    console.log(`🔑 FALLBACK OTP for [${email}]: >>> ${otp} <<<`);
    return { success: false, error: error.message, fallbackOtp: otp };
  }
};
