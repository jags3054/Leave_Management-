const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendMail = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: `"Leave System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
};
