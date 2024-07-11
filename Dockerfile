FROM node:14-slim

# Install dependencies
RUN apt-get update && apt-get install -y zip

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json /app/package.json
RUN npm install

# Copy script and config
COPY app/ /app/
COPY config.yaml /app/config.yaml

# Run the script
CMD ["npm", "start"]
