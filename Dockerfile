# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy all other files
COPY . .

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
