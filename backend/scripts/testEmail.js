
import "dotenv/config";
import { sendEmail } from "../utils/sendEmail.js";

const testEmail = async () => {
  try {
    const result = await sendEmail({
      to: "aarshi.chanda90@gmail.com",
      subject: "KTJ Email Configuration Test",
      html: `
        <h2>Khao To Jano</h2>
        <p>Your email service is configured and responding.</p>
        <p>This is a test email from the KTJ backend.</p>
      `,
    });

    console.log("Test email accepted by Resend:", result.id);
  } catch (error) {
    console.error("Email test failed:", error.message);
    process.exitCode = 1;
  }
};

testEmail();
