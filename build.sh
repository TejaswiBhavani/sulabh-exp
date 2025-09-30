#!/bin/bash

echo "🚀 Building Fullstack Banking Application..."

# Build React Frontend
echo "📦 Building React frontend..."
cd temp-sulabh-frontend
npm install
npm run build

# Copy frontend build to Spring Boot static resources
echo "📁 Copying frontend build to Spring Boot..."
cd ..
rm -rf src/main/resources/static/*
cp -r temp-sulabh-frontend/dist/* src/main/resources/static/

# Build Spring Boot Application
echo "🏗️ Building Spring Boot application..."
./mvnw clean package -DskipTests

echo "✅ Build completed successfully!"
echo "🌐 Application ready for deployment at target/sulabh-backend-0.0.1-SNAPSHOT.jar"
