import type { Plugin } from "~/core/plugins/plugin-manager";
import { logger } from "~/core/utils/logger";

const TELEGRAM_BOT_TOKEN = "CHANGE_ME"; // Replace with your bot token
const TELEGRAM_CHAT_ID = "CHANGE_ME"; // Replace with your chat ID

const TelegramNotificationPlugin: Plugin = {
  name: "Telegram Notification Plugin",
  async onContainerStart(containerName: string) {
    const message = `Container Started: ${containerName}`;
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
          }),
        },
      );
      if (!response.ok) {
        logger.error(`HTTP error ${response.status}`);
      }
      logger.info("Telegram notification sent.");
    } catch (error) {
      logger.error("Failed to send Telegram notification", error as string);
    }
  },
};

export default TelegramNotificationPlugin;
