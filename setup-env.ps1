# CivicFix Environment Setup Script
# This script helps you create the .env files needed for the project

Write-Host "=== CivicFix Environment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Generate JWT Secret
Write-Host "Generating JWT secret..." -ForegroundColor Yellow
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
Write-Host "Generated JWT Secret: $jwtSecret" -ForegroundColor Green
Write-Host ""

# Server .env file
Write-Host "Creating server/.env file..." -ForegroundColor Yellow
$serverEnvContent = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - REPLACE WITH YOUR POSTGRESQL CREDENTIALS
# Format: postgresql://username:password@localhost:port/database
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix

# JWT Authentication
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d

# Cloudinary (Image Storage) - GET FROM https://cloudinary.com
# Sign up at: https://cloudinary.com/users/register/free
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@civicfix.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
"@

$serverPath = Join-Path "server" ".env"
$serverEnvContent | Out-File -FilePath $serverPath -Encoding utf8
Write-Host "✓ Created server/.env" -ForegroundColor Green
Write-Host ""

# Client .env file
Write-Host "Creating client/.env file..." -ForegroundColor Yellow
$clientEnvContent = @"
# Frontend API Configuration
VITE_API_URL=http://localhost:5000/api
"@

$clientPath = Join-Path "client" ".env"
$clientEnvContent | Out-File -FilePath $clientPath -Encoding utf8
Write-Host "✓ Created client/.env" -ForegroundColor Green
Write-Host ""

Write-Host "=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Edit server/.env and update:" -ForegroundColor White
Write-Host "   - DATABASE_URL (with your PostgreSQL credentials)" -ForegroundColor Gray
Write-Host "   - CLOUDINARY credentials (get from https://cloudinary.com)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Make sure PostgreSQL is running and create the database:" -ForegroundColor White
Write-Host "   CREATE DATABASE civicfix;" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run migrations:" -ForegroundColor White
Write-Host "   npm run migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start the app:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
