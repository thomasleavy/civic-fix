# Reset PostgreSQL Password - Step by Step

## Method 1: Reset via pg_hba.conf (Windows)

### Step 1: Stop PostgreSQL Service

Open PowerShell **as Administrator** and run:

```powershell
# Find your PostgreSQL service name first
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Stop the service (replace with your actual service name)
net stop postgresql-x64-14
# OR
Stop-Service postgresql-x64-14
```

Common service names:
- `postgresql-x64-14`
- `postgresql-x64-15`
- `postgresql-x64-16`
- `postgresql-x64-13`

### Step 2: Edit pg_hba.conf

1. Navigate to PostgreSQL data directory:
   - Usually: `C:\Program Files\PostgreSQL\14\data\`
   - Or: `C:\Program Files\PostgreSQL\15\data\`
   - (Replace 14/15 with your version)

2. Open `pg_hba.conf` in Notepad **as Administrator**

3. Find this line (around line 85-90):
   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            md5
   ```

4. Change `md5` to `trust`:
   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            trust
   ```

5. **Save the file**

### Step 3: Start PostgreSQL

```powershell
net start postgresql-x64-14
# OR
Start-Service postgresql-x64-14
```

### Step 4: Connect Without Password

```powershell
psql -U postgres
```

You should now connect without being asked for a password!

### Step 5: Set New Password

Once connected, run:

```sql
ALTER USER postgres PASSWORD 'password';
\q
```

### Step 6: Revert pg_hba.conf

1. Open `pg_hba.conf` again
2. Change `trust` back to `md5`
3. Save the file
4. Restart PostgreSQL service

### Step 7: Test Connection

```powershell
psql -U postgres -d postgres
# Enter password: password
```

---

## Method 2: Use pgAdmin (GUI Method)

1. **Open pgAdmin** (usually in Start Menu)
2. **Connect to server** (you might need to enter password - try common ones)
3. **Right-click on "Login/Group Roles"** → **postgres** → **Properties**
4. **Go to "Definition" tab**
5. **Enter new password** → **Save**

---

## Method 3: Start Docker Desktop (If Installed)

If Docker Desktop is installed but not running:

1. **Open Docker Desktop** from Start Menu
2. **Wait for it to start** (whale icon in system tray)
3. **Then run:**
   ```powershell
   docker run --name civicfix-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=civicfix -p 5432:5432 -d postgres
   ```

---

## Quick Check: Is PostgreSQL Running?

```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

This shows if PostgreSQL is installed and running.
