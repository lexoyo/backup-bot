# Use an official Node.js runtime as a parent image
FROM node:20.12.2

# Set the working directory
WORKDIR /app

# Copy the source code into the container
COPY . .

# Install any needed packages specified in package.json
RUN npm install

# Install cron
RUN apt-get update && apt-get install -y cron

# Define the environment variable with the config.yaml content
# Will be copied to /app/cron.env
ARG CONFIG_YAML
ENV CONFIG_YAML $CONFIG_YAML

# SSH keys
# Will be copied to /app/cron.env
ARG SSH_PRIVATE_KEY
ENV SSH_PRIVATE_KEY $SSH_PRIVATE_KEY

# CRON job
ARG CRONJOB
ENV CRONJOB $CRONJOB

# Copy the cron job file into the container
COPY cronjob /etc/cron.d/backup-cron-job

# Startup script
ENTRYPOINT [ "/app/scripts/startup.sh" ]

# Run the command on container startup
CMD cron && tail -f /var/log/cron.log
