# CivicFix Setup Guide

This guide will help you set up and run the CivicFix project locally.

## Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 14+ installed and running
- **Cloudinary account** (free tier is sufficient)
- **Git** (optional)

## Step 1: Database Setup

1. **Create a PostgreSQL database:**
```bash
# Using psql
createdb civicfix

# Or using SQL
psql -U postgres
CREATE DATABASE civicfix;
```

2. **Update database connection string** in `server/.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/civicfix
```

## Step 2: Backend Setup

1. **Navigate to server directory:**
```bash
cd server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and fill in:
# - DATABASE_URL (from step 1)
# - JWT_SECRET (generate a random string)
# - CLOUDINARY credentials (from your Cloudinary dashboard)
# - EMAIL credentials (optional, for notifications)
```

4. **Run database migrations:**
```bash
npm run migrate
```

5. **Start the development server:**
```bash
npm run dev
```

The server should now be running on `http://localhost:5000`

## Step 3: Frontend Setup

1. **Open a new terminal and navigate to client directory:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. **Start the development server:**
```bash
npm run dev
```

The frontend should now be running on `http://localhost:3000`

## Step 4: Cloudinary Setup

1. **Sign up for a free Cloudinary account:** https://cloudinary.com/users/register/free

2. **Get your credentials:**
   - Go to Dashboard
   - Copy your Cloud Name, API Key, and API Secret

3. **Add to `server/.env`:**
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Step 5: Create Admin User (Optional)

To create an admin user, you can either:

**Option 1: Using migration script**
```bash
# In server/.env, add:
CREATE_ADMIN=true
ADMIN_EMAIL=admin@civicfix.com
ADMIN_PASSWORD=your-secure-password

# Then run migrations again
npm run migrate
```

**Option 2: Using SQL**
```sql
-- Hash a password using bcrypt (you'll need to generate this)
-- For testing, you can use an online bcrypt generator
INSERT INTO users (email, password_hash, role)
VALUES ('admin@civicfix.com', '$2a$10$hashedpasswordhere', 'admin');
```

## Step 6: Verify Installation

1. **Check backend health:**
   - Visit: http://localhost:5000/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check frontend:**
   - Visit: http://localhost:3000
   - Should see the CivicFix homepage

3. **Test registration:**
   - Click "Register" and create an account
   - Try logging in

4. **Test issue reporting:**
   - Go to Map view
   - Click on the map to select a location
   - Fill out the issue form and submit

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_isready`
- Check your DATABASE_URL format
- Verify user permissions

### Port Already in Use
- Backend: Change `PORT` in `server/.env`
- Frontend: Vite will automatically use the next available port

### Cloudinary Upload Fails
- Verify credentials in `.env`
- Check Cloudinary dashboard for usage limits
- Ensure images are under 5MB

### CORS Errors
- Ensure `FRONTEND_URL` in `server/.env` matches your frontend URL
- Check browser console for specific CORS errors

## Next Steps

- Customize the map center location in `MapView.tsx`
- Add email notification service
- Configure production environment variables
- Set up deployment

## Development Tips

1. **Backend hot reload:** Nodemon watches for changes automatically
2. **Frontend hot reload:** Vite provides instant HMR
3. **Database changes:** Create new migration files for schema updates
4. **API testing:** Use Postman or Thunder Client to test endpoints

## Project Structure

```
civic-fix/
├── server/          # Node.js/Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Auth, upload, error handling
│   │   └── services/    # External services
│   └── migrations/      # Database migrations
│
└── client/          # React frontend
    └── src/
        ├── components/  # Reusable components
        ├── pages/       # Page components
        ├── services/    # API service layer
        └── context/     # React Context
```

Happy coding! 🚀
