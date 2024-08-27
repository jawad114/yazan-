const nodemailer = require('nodemailer');

async function sendEmail({ email, subject, verificationCode = '', type, firstName = '' }) {
  const transporter = nodemailer.createTransport({
    host: 'laylamp.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.smtp_email,
      pass: process.env.smtp_password,
    },
  });

  let htmlContent = '';

  if (type === 'welcome') {
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color:#2C3E50; text-align: center;">Welcome to Layla!</h2>
        <p style="color: #555;">Dear ${firstName ? firstName : 'User'},</p>
        <p style="color: #555;">Thank you for registering with Layla! We're excited to have you join our community. Your account has been successfully created, and you’re all set to explore everything our platform has to offer.</p>
        <p style="color: #555;">If you have any questions or need assistance, feel free to reach out to our support team at any time.</p>
        <p style="color: #555;">Welcome aboard, and happy browsing!</p>
        <p style="color: #555;">Best regards,<br><strong>The Layla Team</strong></p>
      </div>
    `;
  } else if (type === 'verify') {
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color:#2C3E50; text-align: center;">Reset Your Password</h2>
        <p style="color: #555;">Dear ${firstName ? firstName : 'User'},</p>
        <p style="color: #555;">We received a request to reset your password. Please use the verification code below to proceed with resetting your password:</p>
        <div style="background-color: #f7f7f7; padding: 10px 20px; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; color: #2C3E50;">${verificationCode}</div>
        <p style="color: #555;">This code will expire in 30 minutes. If you did not request a password reset, please disregard this email.</p>
        <p style="color: #555;">If you have any questions or need further assistance, feel free to reach out to our support team.</p>
        <p style="color: #555;">Best regards,<br><strong>Layla Security Team</strong></p>
      </div>
    `;
  } else if (type === 'reset') {
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color:#2C3E50; text-align: center;">Password Reset Confirmation</h2>
        <p style="color: #555;">Dear ${firstName ? firstName : 'User'},</p>
        <p style="color: #555;">Your password has been successfully updated.</p>
        <p style="color: #555;">If you did not make this change, please contact our support team immediately.</p>
        <p style="color: #555;">For your security, do not share your account details with anyone.</p>
        <p style="color: #555;">Best regards,<br><strong>Layla Security Team</strong></p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"Layla Security Team" <${process.env.smtp_email}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email.');
  }
}

module.exports = sendEmail;
