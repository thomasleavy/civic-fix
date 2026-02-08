# Manual PostgreSQL Password Reset (Step-by-Step)

Since you have PostgreSQL 17 running, here's how to reset the password:

## Quick Method (Recommended)

### Step 1: Stop PostgreSQL

Open PowerShell **as Administrator** and run:

```powershell
Stop-Service postgresql-x64-17
```

### Step 2: Edit pg_hba.conf

1. Navigate to: `C:\Program Files\PostgreSQL\17\data\`
2. Open `pg_hba.conf` in Notepad **as Administrator**
3. Find this line (around line 85-90):
   ```
   host    all             all             127.0.0.1/32            md5
   ```
4. Change `md5` to `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   ```
5. **Save the file**

### Step 3: Start PostgreSQL

```powershell
Start-Service postgresql-x64-17
```

### Step 4: Connect and Set Password

```powershell
psql -U postgres
```

Once connected (no password needed), run:

```sql
ALTER USER postgres PASSWORD 'password';
\q
```

### Step 5: Revert pg_hba.conf

1. Open `pg_hba.conf` again
2. Change `trust` back to `md5`
3. Save
4. Restart service:
   ```powershell
   Restart-Service postgresql-x64-17
   ```

### Step 6: Create Database

```powershell
psql -U postgres -c "CREATE DATABASE civicfix;"
# Enter password: password
```

### Step 7: Update server/.env

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
```

---

## Alternative: Use the Script

I've created a PowerShell script that does all this automatically:

```powershell
# Run PowerShell as Administrator
.\reset-postgres-password.ps1
```

---

## Or: Start Docker Desktop

If you prefer Docker:

1. Open **Docker Desktop** from Start Menu
2. Wait for it to start
3. Run:
   ```powershell
   docker run --name civicfix-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=civicfix -p 5432:5432 -d postgres
   ```

---

**Choose whichever method you prefer!** The manual method works with your existing PostgreSQL installation.
