# Next Steps - You're Connected! ✅

You're now connected to PostgreSQL! Here's what to do:

## In the psql prompt (where you are now):

Run these commands **one at a time**:

### 1. Set the password:
```sql
ALTER USER postgres PASSWORD 'password';
```
You should see: `ALTER ROLE`

### 2. Create the database:
```sql
CREATE DATABASE civicfix;
```
You should see: `CREATE DATABASE`

### 3. Exit psql:
```sql
\q
```

---

## After exiting psql:

### 4. Update server/.env

Open `server/.env` and make sure it has:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
JWT_SECRET=WJKLotfIu3Q7r5GMUPmEsYjlnBkhSVcN
```

### 5. Run migrations:

```powershell
npm run migrate
```

Expected output:
```
Running migrations...
✅ Migrations completed successfully
```

### 6. Start the app:

```powershell
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

---

## 🎉 You're Almost There!

Just run those 3 SQL commands in psql, then update the .env file and run migrations!
