#!/bin/bash

# Version
VERSION="$(cat ./package.json | grep version | cut -d '"' -f 4)"

# Automatic Stack environment management
AUTOMATIC_ENVIRONMENT_FILE_MANAGEMENT="${AUTOMATIC_ENVIRONMENT_FILE_MANAGEMENT:-true}"

# Docker
if grep -q '/docker' /proc/1/cgroup 2>/dev/null || [ -f /.dockerenv ]; then
    RUNNING_IN_DOCKER="true"
else
    RUNNING_IN_DOCKER="false"
fi

# Default dev log level
LOG_LEVEL="${LOG_LEVEL:-debug}"

echo -n "\
{
    \"VERSION\": \"${VERSION}\",
    \"RUNNING_IN_DOCKER\": \"${RUNNING_IN_DOCKER}\",
    \"TRUSTED_PROXIES\": \"${TRUSTED_PROXIES}\",
    \"HA_MASTER\": \"${HA_MASTER}\",
    \"HA_MASTER_IP\": \"${HA_MASTER_IP}\",
    \"HA_NODE\": \"${HA_NODE}\",
    \"HA_UNSAFE\": \"${HA_UNSAFE}\",
    \"DISCORD_WEBHOOK_URL\": \"${DISCORD_WEBHOOK_URL}\",
    \"EMAIL_SENDER\": \"${EMAIL_SENDER}\",
    \"EMAIL_RECIPIENT\": \"${EMAIL_RECIPIENT}\",
    \"EMAIL_PASSWORD\": \"${EMAIL_PASSWORD}\",
    \"EMAIL_SERVICE\": \"${EMAIL_SERVICE}\",
    \"PUSHBULLET_ACCESS_TOKEN\": \"${PUSHBULLET_ACCESS_TOKEN}\",
    \"PUSHOVER_USER_KEY\": \"${PUSHOVER_USER_KEY}\",
    \"PUSHOVER_API_TOKEN\": \"${PUSHOVER_API_TOKEN}\",
    \"SLACK_WEBHOOK_URL\": \"${SLACK_WEBHOOK_URL}\",
    \"TELEGRAM_BOT_TOKEN\": \"${TELEGRAM_BOT_TOKEN}\",
    \"TELEGRAM_CHAT_ID\": \"${TELEGRAM_CHAT_ID}\",
    \"WHATSAPP_API_URL\": \"${WHATSAPP_API_URL}\",
    \"WHATSAPP_RECIPIENT\": \"${WHATSAPP_RECIPIENT}\",
    \"AUTOMATIC_ENVIRONMENT_FILE_MANAGEMENT\": \"${AUTOMATIC_ENVIRONMENT_FILE_MANAGEMENT}\",
    \"LOG_LEVEL\": \"${LOG_LEVEL}\"
} \
" > ./src/data/variables.json || exit 1
