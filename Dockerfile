# Multi-stage build for fullstack banking application
FROM node:18-alpine AS frontend-build

# Build React Frontend
WORKDIR /app/frontend
COPY temp-sulabh-frontend/package*.json ./
RUN npm ci --only=production
COPY temp-sulabh-frontend/ ./
RUN npm run build

# Build Spring Boot Backend
FROM openjdk:21-jdk-slim AS backend-build

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pom.xml ./
COPY src ./src
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

# Build Spring Boot application
RUN mvn clean package -DskipTests

# Production image
FROM openjdk:21-jre-slim

# Install PostgreSQL client for health checks
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built application
COPY --from=backend-build /app/target/sulabh-backend-0.0.1-SNAPSHOT.jar app.jar

# Create non-root user for security
RUN groupadd -r appuser && useradd --no-log-init -r -g appuser appuser
RUN chown appuser:appuser app.jar
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/auth/login || exit 1

EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
