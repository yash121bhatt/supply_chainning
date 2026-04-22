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

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

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

const sendDriverInvitationEmail = async (email, name, inviteToken, carrierName) => {
  const setPasswordUrl = `${getClientUrl()}/set-password?token=${inviteToken}`;

  const mailOptions = {
    from: `"SupplyChain Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'You have been invited to join as a Driver',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to SupplyChain, ${name}!</h2>
        <p style="color: #555; font-size: 16px;">
          You have been invited by <strong>${carrierName}</strong> to join as a Driver on our Supply Chain platform.
        </p>
        <p style="color: #555; font-size: 16px;">
          Please click the button below to set up your password and activate your account:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${setPasswordUrl}" style="background-color: #1d4ed8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Set Your Password
          </a>
        </div>
        <p style="color: #555; font-size: 14px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${setPasswordUrl}" style="color: #1d4ed8; word-break: break-all;">${setPasswordUrl}</a>
        </p>
        <p style="color: #888; font-size: 14px; margin-top: 24px;">
          This link will expire in <strong>24 hours</strong>. If you did not expect this invitation, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Supply Chain Platform &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendDriverInvitationReminderEmail = async (email, name, inviteToken, carrierName) => {
  const setPasswordUrl = `${getClientUrl()}/set-password?token=${inviteToken}`;

  const mailOptions = {
    from: `"SupplyChain Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reminder: Complete your driver account setup',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #333;">Reminder: Complete Your Account Setup</h2>
        <p style="color: #555; font-size: 16px;">
          Hi ${name},
        </p>
        <p style="color: #555; font-size: 16px;">
          <strong>${carrierName}</strong> is waiting for you to join as a Driver. Your account is ready - just set your password to get started!
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${setPasswordUrl}" style="background-color: #1d4ed8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Set Your Password
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          This link will expire in <strong>24 hours</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Supply Chain Platform &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendDriverInvitationEmail,
  sendDriverInvitationReminderEmail,
  transporter
};
