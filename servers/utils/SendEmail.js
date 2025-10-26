// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(notification) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: notification.userId.email, // Ensure user is populated when used
    subject: notification.title,
    text: notification.message,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, info };
}

module.exports = sendEmail;
