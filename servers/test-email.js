const { sendEmail, verifyEmailConfig } = require("./services/emailService");



(async () => {
  await verifyEmailConfig();

  const result = await sendEmail(
    "demo@example.com",
    "welcome",
    { name: "Test User" }
  );

  console.log(result);
})();
