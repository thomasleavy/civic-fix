# Final Steps - Almost Done! 🎉

You've successfully:
- ✅ Set PostgreSQL password to `password`
- ✅ Created database `civicfix`

## Now do these 3 things:

### Step 1: Update server/.env

Open `server/.env` and make sure it has:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
JWT_SECRET=WJKLotfIu3Q7r5GMUPmEsYjlnBkhSVcN
FRONTEND_URL=http://localhost:3000
```

**Important:** Make sure `DATABASE_URL` has `password` (not the old placeholder).

### Step 2: Run Migrations

```powershell
npm run migrate
```

**Expected output:**
```
Running migrations...
✅ Migrations completed successfully
```

If you see errors, check that:
- PostgreSQL is running
- `DATABASE_URL` in `server/.env` is correct
- Database `civicfix` exists

### Step 3: Start the App

```powershell
npm run dev
```

This will start:
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000

Open your browser and go to: **http://localhost:3000**

---

## 🎉 You're Done!

The app should now be running. You can:
- Register a new account
- Log in
- Report issues on the map
- View the admin dashboard (if you create an admin user)

---

## Troubleshooting

**"Database connection error"**
- Check PostgreSQL is running: `Get-Service postgresql-x64-17`
- Verify `DATABASE_URL` in `server/.env`
- Test connection: `psql -U postgres -d civicfix` (password: `password`)

**"JWT_SECRET not configured"**
- Make sure `JWT_SECRET` is set in `server/.env`
- Restart the server after updating `.env`

**"Port already in use"**
- Change `PORT=5000` to `PORT=5001` in `server/.env`
- Update `VITE_API_URL=http://localhost:5001/api` in `client/.env`

---

Enjoy your CivicFix app! 🚀
