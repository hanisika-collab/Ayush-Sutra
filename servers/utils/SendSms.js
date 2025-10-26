// utils/sendSMS.js
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(notification) {
  const message = await client.messages.create({
    body: `${notification.title}\n${notification.message}`,
    from: process.env.TWILIO_PHONE,
    to: notification.userId.phone,
  });

  return { success: true, sid: message.sid };
}

module.exports = sendSMS;
