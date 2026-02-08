# Quick Setup Steps for CivicFix

## 🚀 Automated Setup (Recommended)

Run the setup script to automatically create `.env` files:

```powershell
.\setup-env.ps1
```

This will:
- ✅ Generate a secure JWT secret
- ✅ Create `server/.env` with all required variables
- ✅ Create `client/.env` with API URL

**Then you just need to:**
1. Update `DATABASE_URL` in `server/.env` with your PostgreSQL credentials
2. Add Cloudinary credentials (optional for now, but needed for image uploads)

---

## 📝 Manual Setup (Alternative)

If you prefer to create the files manually:

### Step 1: Create `server/.env`

Create a file named `.env` in the `server/` folder with this content:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/civicfix
JWT_SECRET=your-random-secret-key-at-least-32-characters
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:3000
```

**Generate JWT Secret (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 2: Create `client/.env`

Create a file named `.env` in the `client/` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ PostgreSQL Setup

### Option A: If PostgreSQL is already installed

1. **Open PostgreSQL command line:**
   ```powershell
   psql -U postgres
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE civicfix;
   \q
   ```

3. **Update `DATABASE_URL` in `server/.env`:**
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/civicfix
   ```
   Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

### Option B: Install PostgreSQL (if not installed)

1. **Download:** https://www.postgresql.org/download/windows/
2. **Install** with default settings
3. **Remember the password** you set during installation
4. **Create database** (see Option A above)

### Option C: Use Docker (Alternative)

```powershell
docker run --name civicfix-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=civicfix -p 5432:5432 -d postgres
```

Then use: `DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix`

---

## ☁️ Cloudinary Setup (Optional but Recommended)

1. **Sign up for free:** https://cloudinary.com/users/register/free
2. **Go to Dashboard**
3. **Copy your credentials:**
   - Cloud Name
   - API Key
   - API Secret
4. **Update `server/.env`** with these values

**Note:** You can skip this for now if you just want to test without image uploads.

---

## ✅ Verify Setup

### 1. Test Database Connection

```powershell
npm run migrate
```

**Expected output:**
```
Running migrations...
✅ Migrations completed successfully
```

**If you get an error:**
- Check PostgreSQL is running (Windows: Services → PostgreSQL)
- Verify `DATABASE_URL` format in `server/.env`
- Make sure database `civicfix` exists

### 2. Start the Application

```powershell
npm run dev
```

**Expected output:**
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000

### 3. Test in Browser

Open: http://localhost:3000

You should see the CivicFix homepage!

---

## 🔧 Troubleshooting

### "Database connection error"
- ✅ PostgreSQL service is running?
- ✅ Database `civicfix` exists?
- ✅ `DATABASE_URL` format is correct?
- ✅ Username/password are correct?

### "JWT_SECRET not configured"
- ✅ Check `server/.env` exists
- ✅ `JWT_SECRET` is set (not empty)
- ✅ Restart server after creating `.env`

### "Port already in use"
- ✅ Change `PORT` in `server/.env` to another port (e.g., 5001)
- ✅ Update `VITE_API_URL` in `client/.env` to match

### "Cannot find module"
- ✅ Run `npm run install:all` to install dependencies

---

## 📋 Checklist

Before running the app, make sure:

- [ ] `server/.env` file exists with `DATABASE_URL` and `JWT_SECRET`
- [ ] `client/.env` file exists with `VITE_API_URL`
- [ ] PostgreSQL is installed and running
- [ ] Database `civicfix` is created
- [ ] Dependencies are installed (`npm run install:all`)
- [ ] Migrations are run (`npm run migrate`)

---

## 🎯 Quick Start (After Setup)

```powershell
# 1. Install dependencies (if not done)
npm run install:all

# 2. Run migrations
npm run migrate

# 3. Start both servers
npm run dev
```

That's it! 🎉
