# ✅ Environment Files Created!

The `.env` files have been created automatically. Now you need to update them with your actual credentials.

## 🔧 What to Do Next

### 1. Update `server/.env`

Open `server/.env` and update these values:

**Required:**
- `DATABASE_URL` - Replace with your PostgreSQL connection string
  - Format: `postgresql://username:password@localhost:5432/civicfix`
  - Example: `postgresql://postgres:mypassword@localhost:5432/civicfix`

- `JWT_SECRET` - Replace with a random secret (I generated one for you: `WJKLotfIu3Q7r5GMUPmEsYjlnBkhSVcN`)
  - Or generate your own using PowerShell:
    ```powershell
    -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
    ```

**Optional (for image uploads):**
- `CLOUDINARY_CLOUD_NAME` - Get from https://cloudinary.com
- `CLOUDINARY_API_KEY` - Get from https://cloudinary.com
- `CLOUDINARY_API_SECRET` - Get from https://cloudinary.com

### 2. `client/.env` is Ready! ✅

The client `.env` file is already configured correctly. No changes needed.

---

## 🗄️ PostgreSQL Setup

### If PostgreSQL is Already Installed:

1. **Open PostgreSQL:**
   ```powershell
   psql -U postgres
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE civicfix;
   \q
   ```

3. **Update `DATABASE_URL` in `server/.env`:**
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/civicfix
   ```

### If PostgreSQL is NOT Installed:

**Option 1: Install PostgreSQL**
- Download: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set
- Create database as shown above

**Option 2: Use Docker (Easier)**
```powershell
docker run --name civicfix-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=civicfix -p 5432:5432 -d postgres
```
Then use: `DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix`

---

## ✅ Test Your Setup

After updating `server/.env`:

```powershell
# 1. Test database connection
npm run migrate

# 2. If successful, start the app
npm run dev
```

**Expected output from migrate:**
```
Running migrations...
✅ Migrations completed successfully
```

**Expected output from dev:**
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## 🎯 Quick Checklist

- [ ] Updated `DATABASE_URL` in `server/.env`
- [ ] Updated `JWT_SECRET` in `server/.env` (or use the one I generated)
- [ ] PostgreSQL is running
- [ ] Database `civicfix` exists
- [ ] Ran `npm run migrate` successfully
- [ ] Ready to run `npm run dev`!

---

## 🆘 Troubleshooting

**"Database connection error"**
- Check PostgreSQL service is running (Windows: Services → PostgreSQL)
- Verify username/password in `DATABASE_URL`
- Make sure database `civicfix` exists

**"JWT_SECRET not configured"**
- Make sure `JWT_SECRET` in `server/.env` is not empty
- Restart server after updating `.env`

**"Port already in use"**
- Change `PORT=5000` to `PORT=5001` in `server/.env`
- Update `VITE_API_URL=http://localhost:5001/api` in `client/.env`

---

You're almost there! Just update the `DATABASE_URL` and you're ready to go! 🚀
