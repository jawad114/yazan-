const nodemailer = require('nodemailer');

async function sendEmail({ email, subject, verificationCode = '', type, firstName = '' }) {
  const transporter = nodemailer.createTransport({
    host: 'layla-res.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.smtp_email,
      pass: process.env.smtp_password,
    },
  });

  let htmlContent = '';

  if (type === 'verify') {
    htmlContent = `
      <h2 style="color:#2C3E50;">Welcome to Layla!</h2>
      <p>Dear ${firstName ? firstName : 'User'},</p>
      <p>Thank you for registering with us. Please use the verification code below to complete your registration:</p>
      <p style="font-size: 18px;"><strong>${verificationCode}</strong></p>
      <p>This code will expire in 30 minutes. If you did not request this, please disregard this email.</p>
      <p>We’re excited to have you on board!</p>
      <p>Best regards,<br>Layla Security Team</p>
    `;
  } else if (type === 'reset') {
    htmlContent = `
      <h2 style="color:#2C3E50;">Password Reset Confirmation</h2>
      <p>Dear ${firstName ? firstName : 'User'},</p>
      <p>Your password has been successfully updated.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
      <p>For your security, do not share your account details with anyone.</p>
      <p>Best regards,<br>Layla Security Team</p>
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
