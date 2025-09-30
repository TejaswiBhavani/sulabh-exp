# Development build script
Write-Host "🚀 Starting development build..."

# Build frontend
Write-Host "📦 Building frontend..."
Set-Location temp-sulabh-frontend
npm install
npm run build

# Copy to static directory
Write-Host "📂 Copying to Spring Boot..."
Set-Location ..
Copy-Item "temp-sulabh-frontend\dist\*" "src\main\resources\static\" -Recurse -Force

Write-Host "✅ Build complete! Run 'mvnw spring-boot:run' to start the application."
