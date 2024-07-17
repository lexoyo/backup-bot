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
  (crontab -l ; echo "$CRONJOB") | crontab -
else
  echo "CRONJOB is not set, use the file cronjob..."
  (crontab -l ; cat ./cronjob) | crontab -
fi

touch /var/log/cron.log

# Print the current crontab (for debugging purposes)
echo "Current crontab:"
crontab -l


# Write the cron.env file with the environment variables
echo "Writing the cron.env file..."
echo "export S3_ENDPOINT=$S3_ENDPOINT" >> /app/cron.env
echo "export S3_BUCKET=$S3_BUCKET" >> /app/cron.env
echo "export S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID" >> /app/cron.env
echo "export S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY" >> /app/cron.env
echo "export S3_REGION=$S3_REGION" >> /app/cron.env
echo "export SMTP_SERVER=$SMTP_SERVER" >> /app/cron.env
echo "export SMTP_PORT=$SMTP_PORT" >> /app/cron.env
echo "export SMTP_USERNAME=$SMTP_USERNAME" >> /app/cron.env
echo "export SMTP_PASSWORD=$SMTP_PASSWORD" >> /app/cron.env
echo "export MAIL_FROM=$MAIL_FROM" >> /app/cron.env
echo "export MAIL_TO=$MAIL_TO" >> /app/cron.env

# # Run the app once at startup
# echo "Running the app at startup..."
# npm start

# Call CMD from Dockerfile
exec "$@"
