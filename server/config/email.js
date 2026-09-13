import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp) => {
  try {
    const smtpUser = process.env.EMAIL_USER || 'ok8023362@gmail.com';
    const smtpPass = process.env.EMAIL_PASS || 'dvbpxcgxdmfudmpe';
    const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';

    // If using Gmail, use Nodemailer's built-in 'gmail' service which automatically connects
    // via SMTPS on port 465, completely bypassing Render/cloud port 587 blocks.
    const isGmail = smtpHost.includes('gmail') || smtpUser.includes('@gmail.com');

    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 12000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          }
        : {
            host: smtpHost,
            port: Number(process.env.EMAIL_PORT) || 465,
            secure: process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 12000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          }
    );

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
    return { success: true, mode: isGmail ? 'gmail-service' : 'smtp' };
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

