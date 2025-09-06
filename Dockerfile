# Multi-stage build for React/Vite application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source code and build
COPY . .
RUN npm run build

# Production stage - serve the built app
FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
