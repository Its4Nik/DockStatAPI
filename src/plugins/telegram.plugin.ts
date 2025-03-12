import type { Plugin } from "~/typings/plugin";
import type { ContainerInfo } from "~/typings/docker";
import { logger } from "~/core/utils/logger";

const TELEGRAM_BOT_TOKEN = "CHANGE_ME"; // Replace with your bot token
const TELEGRAM_CHAT_ID = "CHANGE_ME"; // Replace with your chat ID

const TelegramNotificationPlugin: Plugin = {
  name: "Telegram Notification Plugin",
  async onContainerStart(containerInfo: ContainerInfo) {
    const message = `Container Started: ${containerInfo.name} on ${containerInfo.hostId}`;
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
} satisfies Plugin;

export default TelegramNotificationPlugin;
