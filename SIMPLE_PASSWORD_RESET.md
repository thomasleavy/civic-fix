# Simple PostgreSQL Password Reset - Manual Steps

## Step-by-Step Instructions

### Step 1: Stop PostgreSQL Service

Open PowerShell **as Administrator** and run:

```powershell
Stop-Service postgresql-x64-17
```

### Step 2: Edit pg_hba.conf File

1. **Navigate to:** `C:\Program Files\PostgreSQL\17\data\`
2. **Open `pg_hba.conf`** in Notepad (right-click → Open with → Notepad, or run as Administrator)
3. **Find this line** (around line 85-90, look for "IPv4 local connections"):
   ```
   host    all             all             127.0.0.1/32            md5
   ```
4. **Change `md5` to `trust`**:
   ```
   host    all             all             127.0.0.1/32            trust
   ```
5. **Save the file** (Ctrl+S)

### Step 3: Start PostgreSQL Service

```powershell
Start-Service postgresql-x64-17
```

### Step 4: Connect to PostgreSQL (No Password Needed)

```powershell
psql -U postgres
```

You should connect without being asked for a password!

### Step 5: Set New Password

Once connected, type this command:

```sql
ALTER USER postgres PASSWORD 'password';
```

Press Enter. You should see: `ALTER ROLE`

### Step 6: Create the Database

Still in psql, run:

```sql
CREATE DATABASE civicfix;
```

You should see: `CREATE DATABASE`

### Step 7: Exit psql

```sql
\q
```

### Step 8: Revert pg_hba.conf (Important for Security!)

1. **Open `pg_hba.conf` again**
2. **Change `trust` back to `md5`**:
   ```
   host    all             all             127.0.0.1/32            md5
   ```
3. **Save the file**

### Step 9: Restart PostgreSQL

```powershell
Restart-Service postgresql-x64-17
```

### Step 10: Test Connection

```powershell
psql -U postgres
```

Enter password: `password`

If it connects, you're done! ✅

### Step 11: Update server/.env

Open `server/.env` and make sure it has:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
```

---

## That's It!

Now you can run:

```powershell
npm run migrate
```

And then:

```powershell
npm run dev
```

---

## Quick Copy-Paste Commands

Run these in PowerShell (as Administrator):

```powershell
# Stop service
Stop-Service postgresql-x64-17

# Start service (after editing pg_hba.conf)
Start-Service postgresql-x64-17

# Connect (no password needed after step 2)
psql -U postgres

# In psql, run:
# ALTER USER postgres PASSWORD 'password';
# CREATE DATABASE civicfix;
# \q

# Restart service (after reverting pg_hba.conf)
Restart-Service postgresql-x64-17
```
