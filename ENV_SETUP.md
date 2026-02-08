# Environment Variables Setup

## Quick Setup Guide

You need to create `.env` files in both `server/` and `client/` directories before running the application.

### 1. Backend Environment (`server/.env`)

Create a file named `.env` in the `server/` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - UPDATE THIS WITH YOUR POSTGRESQL CREDENTIALS
DATABASE_URL=postgresql://username:password@localhost:5432/civicfix

# JWT Authentication - CHANGE THIS TO A RANDOM STRING
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Cloudinary (Image Storage) - GET FROM https://cloudinary.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional, for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@civicfix.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend Environment (`client/.env`)

Create a file named `.env` in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Setting Up Each Service

### PostgreSQL Database

1. **Install PostgreSQL** if you haven't already
2. **Create a database:**
   ```sql
   CREATE DATABASE civicfix;
   ```
3. **Update DATABASE_URL** in `server/.env`:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/civicfix
   ```
   - Replace `postgres` with your PostgreSQL username
   - Replace `yourpassword` with your PostgreSQL password
   - Replace `5432` if your PostgreSQL uses a different port

### JWT Secret

Generate a secure random string (at least 32 characters):

**On Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

Or use an online generator: https://randomkeygen.com/

### Cloudinary (Free Tier)

1. **Sign up:** https://cloudinary.com/users/register/free
2. **Get credentials:**
   - Go to Dashboard
   - Copy your:
     - Cloud Name
     - API Key
     - API Secret
3. **Add to `server/.env`**

### Email (Optional - for notifications)

If you want email notifications, set up SMTP:

**Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASS`

**Other providers:**
- Update `EMAIL_HOST` and `EMAIL_PORT` accordingly
- Use your provider's SMTP credentials

## Quick Copy-Paste Setup

**For server/.env:**
```bash
# Copy the example file
cd server
copy .env.example .env
# Then edit .env with your actual values
```

**For client/.env:**
```bash
# Create the file
cd client
echo VITE_API_URL=http://localhost:5000/api > .env
```

## Verification

After setting up your `.env` files:

1. **Test database connection:**
   ```bash
   npm run migrate
   ```
   Should complete without errors.

2. **Test server startup:**
   ```bash
   npm run dev:server
   ```
   Should start on port 5000.

3. **Test frontend:**
   ```bash
   npm run dev:client
   ```
   Should start on port 3000.

## Troubleshooting

### "JWT_SECRET not configured"
- Make sure `JWT_SECRET` is set in `server/.env`
- Restart the server after adding it

### "Database connection error"
- Check PostgreSQL is running: `pg_isready` (Mac/Linux) or check Services (Windows)
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Test connection: `psql -U postgres -d civicfix`

### "Cloudinary upload failed"
- Verify all three Cloudinary variables are set
- Check Cloudinary dashboard for account status
- Ensure images are under 5MB

### CORS errors
- Make sure `FRONTEND_URL` in `server/.env` matches your frontend URL
- Default should be `http://localhost:3000`
