import { SendMailOptions, createTransport } from "nodemailer";
import logger from "../logger";
import { renderTemplate } from "./_template";
import {
  EMAIL_SENDER,
  EMAIL_SERVICE,
  EMAIL_PASSWORD,
  EMAIL_RECIPIENT,
} from "../../config/variables";

const email_sender: string = EMAIL_SENDER;
const email_recipient: string = EMAIL_RECIPIENT;
const email_password: string = EMAIL_PASSWORD;
const email_service: string = EMAIL_SERVICE;

export async function emailNotification(containerId: string) {
  // Validate email configuration parameters
  if (!email_sender || !email_recipient || !email_password || !email_service) {
    logger.error(
      "Email notification failed: Missing configuration parameters. " +
        "Please ensure EMAIL_SENDER, EMAIL_RECIPIENT, EMAIL_PASSWORD, and EMAIL_SERVICE are set in environment variables.",
    );
    return;
  }

  const email_message: string | null = renderTemplate(containerId);
  if (!email_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  const transporter = createTransport({
    service: email_service,
    auth: {
      user: email_sender,
      pass: email_password,
    },
  });

  const mailOptions: SendMailOptions = {
    from: email_sender,
    to: email_recipient,
    subject: "DockStat",
    text: email_message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}
