const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Send verification email with OTP
const sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: `"SupplyChain Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to SupplyChain!</h2>
        <p style="color: #555; font-size: 16px;">
          Please verify your email address by entering the following OTP:
        </p>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; margin: 24px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8;">${otp}</span>
        </div>
        <p style="color: #555;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, transporter };
