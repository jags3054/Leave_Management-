const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your mail service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password
  },
});

/**
 * Sends an email with optional HTML formatting.
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject of the email
 * @param {string} text - Plain text fallback
 * @param {string} [html] - Optional HTML body
 */
const sendMail = async (to, subject, text, html = '') => {
  if (!to) {
    console.warn('🚫 No recipient email provided. Skipping email send.');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html: html || undefined,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}:`, info.response);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
};

module.exports = sendMail;
