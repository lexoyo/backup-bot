#!/bin/bash

# Write the environment variable content to config.yaml
echo "$CONFIG_YAML" > /app/config.yaml
echo "config.yaml:"
cat /app/config.yaml

# Write the SSH private key to /root/.ssh/id_rsa
mkdir -p /root/.ssh
echo "$SSH_PRIVATE_KEY" > /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa

# If the env var CRONJOB is set, run the cron job
if [ -n "$CRONJOB" ]; then
  echo "CRONJOB is set, running the cron job..."
  echo "$CRONJOB" >> /etc/crontab
  # chmod 0644 /etc/cron.d/cronjob
  # crontab /etc/cron.d/cronjob
  # cron -f
else
  echo "CRONJOB is not set, use the file cronjob..."
  cat /etc/cron.d/backup-cron-job >> /etc/crontab
fi

chmod 0644 /etc/cron.d/backup-cron-job
touch /var/log/cron.log


# Write the cron.env file with the environment variables
echo "Writing the cron.env file..."
echo "CONFIG_YAML=\"$CONFIG_YAML\"" >> /app/cron.env
echo "SSH_PRIVATE_KEY=\"$SSH_PRIVATE_KEY\"" >> /app/cron.env

# Run the app once at startup
echo "Running the app at startup..."
npm start

# Call CMD from Dockerfile
exec "$@"
