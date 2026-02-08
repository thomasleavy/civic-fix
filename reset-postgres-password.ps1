# Reset PostgreSQL Password Script
# Run this as Administrator

Write-Host "=== PostgreSQL Password Reset ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs Administrator privileges!" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OR follow manual steps in RESET_POSTGRES_PASSWORD.md" -ForegroundColor Green
    exit
}

$serviceName = "postgresql-x64-17"
$pgDataPath = "C:\Program Files\PostgreSQL\17\data"
$pgHbaPath = Join-Path $pgDataPath "pg_hba.conf"

Write-Host "Service: $serviceName" -ForegroundColor White
Write-Host "Config: $pgHbaPath" -ForegroundColor White
Write-Host ""

# Check if file exists
if (-not (Test-Path $pgHbaPath)) {
    Write-Host "❌ pg_hba.conf not found at: $pgHbaPath" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL installation path" -ForegroundColor Yellow
    exit
}

Write-Host "Step 1: Stopping PostgreSQL service..." -ForegroundColor Yellow
Stop-Service -Name $serviceName -Force
Start-Sleep -Seconds 2
Write-Host "✓ Service stopped" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Backing up pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $pgHbaPath "$pgHbaPath.backup"
Write-Host "✓ Backup created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Modifying pg_hba.conf (changing md5 to trust)..." -ForegroundColor Yellow
$content = Get-Content $pgHbaPath
$newContent = $content -replace '127\.0\.0\.1/32\s+md5', '127.0.0.1/32            trust'
$newContent | Set-Content $pgHbaPath
Write-Host "✓ File modified" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service -Name $serviceName
Start-Sleep -Seconds 3
Write-Host "✓ Service started" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Setting new password..." -ForegroundColor Yellow
$newPassword = "password"
$sqlCommand = "ALTER USER postgres PASSWORD '$newPassword';"
echo $sqlCommand | psql -U postgres
Write-Host "✓ Password set to: $newPassword" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Reverting pg_hba.conf (changing trust back to md5)..." -ForegroundColor Yellow
$content = Get-Content $pgHbaPath
$newContent = $content -replace '127\.0\.0\.1/32\s+trust', '127.0.0.1/32            md5'
$newContent | Set-Content $pgHbaPath
Write-Host "✓ File reverted" -ForegroundColor Green
Write-Host ""

Write-Host "Step 7: Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service -Name $serviceName
Write-Host "✓ Service restarted" -ForegroundColor Green
Write-Host ""

Write-Host "=== Password Reset Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "New password: password" -ForegroundColor Green
Write-Host ""
Write-Host "Update server/.env with:" -ForegroundColor Yellow
Write-Host "DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix" -ForegroundColor White
Write-Host ""
Write-Host "Then create the database:" -ForegroundColor Yellow
$dbCommand = 'psql -U postgres -c "CREATE DATABASE civicfix;"'
Write-Host $dbCommand -ForegroundColor White
