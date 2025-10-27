// services/emailService.js
const nodemailer = require('nodemailer');

// Configure email transporter
// For development, you can use services like Gmail, Mailtrap, or SendGrid
const transporter = nodemailer.createTransport({
  // Option 1: Gmail (for testing)
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password' // Use App Password, not regular password
  }
  
  // Option 2: Mailtrap (for testing)
  // host: "smtp.mailtrap.io",
  // port: 2525,
  // auth: {
  //   user: process.env.MAILTRAP_USER,
  //   pass: process.env.MAILTRAP_PASS
  // }
  
  // Option 3: SendGrid (for production)
  // host: 'smtp.sendgrid.net',
  // port: 587,
  // auth: {
  //   user: 'apikey',
  //   pass: process.env.SENDGRID_API_KEY
  // }
});

// Email templates
const emailTemplates = {
  'pre-therapy': (data) => ({
    subject: `Reminder: Your ${data.therapyType} session tomorrow`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🌿 Ayush Wellness Center</h2>
        <h3>Upcoming Therapy Session Reminder</h3>
        <p>Dear ${data.patientName},</p>
        <p>This is a friendly reminder about your upcoming therapy session:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Therapy Type:</strong> ${data.therapyType}</p>
          <p><strong>Date & Time:</strong> ${data.sessionTime}</p>
          <p><strong>Therapist:</strong> ${data.therapistName}</p>
          <p><strong>Room:</strong> ${data.roomName || 'TBA'}</p>
        </div>
        <h4>Pre-Therapy Guidelines:</h4>
        <ul>
          <li>Please arrive 10 minutes before your scheduled time</li>
          <li>Wear comfortable, loose clothing</li>
          <li>Avoid heavy meals 2 hours before the session</li>
          <li>Stay hydrated throughout the day</li>
        </ul>
        <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>Ayush Wellness Team</strong></p>
      </div>
    `
  }),
  
  'post-therapy': (data) => ({
    subject: `Post-Therapy Care Instructions - ${data.therapyType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🌿 Ayush Wellness Center</h2>
        <h3>Post-Therapy Care Instructions</h3>
        <p>Dear ${data.patientName},</p>
        <p>Thank you for completing your ${data.therapyType} session today.</p>
        <h4>Important Post-Therapy Guidelines:</h4>
        <ul>
          <li>Rest for at least 30 minutes after the therapy</li>
          <li>Drink plenty of warm water throughout the day</li>
          <li>Avoid cold foods and beverages for 24 hours</li>
          <li>Take a warm shower after 2-3 hours (not immediately)</li>
          <li>Avoid strenuous physical activities for the rest of the day</li>
          <li>Get adequate sleep tonight</li>
        </ul>
        <p>If you experience any unusual symptoms, please contact us immediately.</p>
        <p><strong>Next Session:</strong> ${data.nextSession || 'To be scheduled'}</p>
        <p style="margin-top: 30px;">Wishing you wellness,<br><strong>Ayush Wellness Team</strong></p>
      </div>
    `
  }),
  
  'daily-tip': (data) => ({
    subject: `Daily Wellness Tip: ${data.tipTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🌿 Daily Ayurvedic Wisdom</h2>
        <h3 style="color: #17a2b8;">${data.tipTitle}</h3>
        <div style="background: #e7f5ff; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p style="font-size: 16px; line-height: 1.6;">${data.tipContent}</p>
        </div>
        ${data.additionalInfo ? `<p>${data.additionalInfo}</p>` : ''}
        <p style="margin-top: 20px; font-style: italic; color: #666;">
          "The secret of health for both mind and body is not to mourn for the past, 
          worry about the future, but to live in the present moment wisely and earnestly."
        </p>
        <p style="margin-top: 30px;">Stay healthy,<br><strong>Ayush Wellness Team</strong></p>
      </div>
    `
  }),
  
  'appointment-reminder': (data) => ({
    subject: `Appointment Reminder - ${data.therapyType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🌿 Ayush Wellness Center</h2>
        <h3>Appointment Reminder</h3>
        <p>Dear ${data.patientName},</p>
        <p>You have an appointment scheduled:</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>🗓️ Date & Time:</strong> ${data.sessionTime}</p>
          <p><strong>💆 Therapy:</strong> ${data.therapyType}</p>
          <p><strong>👨‍⚕️ Therapist:</strong> ${data.therapistName}</p>
        </div>
        <p>Please arrive on time. Looking forward to seeing you!</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>Ayush Wellness Team</strong></p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    if (!emailTemplates[template]) {
      throw new Error(`Template '${template}' not found`);
    }
    
    const { subject, html } = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"Ayush Wellness Center" <${process.env.EMAIL_USER || 'noreply@ayushwellness.com'}>`,
      to: to,
      subject: subject,
      html: html
    };
    
    console.log(`📧 Sending email to ${to} with template: ${template}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send error:`, error);
    return { success: false, error: error.message };
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  emailTemplates
};