# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy the source code into the container
COPY . .

# Install any needed packages specified in package.json
RUN npm install

# Install cron
RUN apt-get update && apt-get install -y cron

# Copy the cron job file into the container
COPY cronjob /etc/cron.d/backup-bot-cron-job

# Give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/backup-bot-cron-job

# Apply cron job
RUN crontab /etc/cron.d/backup-bot-cron-job

# Create the log file to be able to run tail
RUN touch /var/log/cron.log

# Run the command on container startup
CMD cron && tail -f /var/log/cron.log
