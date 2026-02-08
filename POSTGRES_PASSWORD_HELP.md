# PostgreSQL Password Help

## 🔍 Finding Your PostgreSQL Password

The PostgreSQL password is **NOT** the JWT secret. It's the password you set when you installed PostgreSQL.

### Option 1: Try Common Defaults

Try these common passwords:
- `postgres` (most common default)
- `admin`
- `password`
- `root`
- (empty/blank - just press Enter)

### Option 2: Reset PostgreSQL Password (Windows)

If you forgot your password, you can reset it:

1. **Stop PostgreSQL service:**
   ```powershell
   # Run as Administrator
   net stop postgresql-x64-14
   # (Replace 14 with your version number if different)
   ```

2. **Edit the authentication file:**
   - Navigate to: `C:\Program Files\PostgreSQL\14\data\` (or your version)
   - Open `pg_hba.conf` in a text editor (as Administrator)
   - Find the line: `host all all 127.0.0.1/32 md5`
   - Change `md5` to `trust`
   - Save the file

3. **Start PostgreSQL:**
   ```powershell
   net start postgresql-x64-14
   ```

4. **Connect without password:**
   ```powershell
   psql -U postgres
   ```

5. **Reset password:**
   ```sql
   ALTER USER postgres PASSWORD 'your_new_password';
   ```

6. **Revert pg_hba.conf:**
   - Change `trust` back to `md5`
   - Restart PostgreSQL service

### Option 3: Use Docker (Easiest - Recommended!)

If you can't remember the password, using Docker is much easier:

```powershell
# Install Docker Desktop if you don't have it: https://www.docker.com/products/docker-desktop

# Run PostgreSQL in Docker with a known password
docker run --name civicfix-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=civicfix -p 5432:5432 -d postgres
```

Then use in `server/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
```

### Option 4: Check Windows Credential Manager

Sometimes PostgreSQL stores credentials in Windows Credential Manager:

1. Open **Control Panel** → **Credential Manager**
2. Look for PostgreSQL entries
3. Check stored passwords

---

## ✅ Quick Solution: Use Docker

**This is the easiest option if you're having password issues:**

```powershell
# 1. Install Docker Desktop (if not installed)
# Download from: https://www.docker.com/products/docker-desktop

# 2. Run PostgreSQL container
docker run --name civicfix-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=civicfix -p 5432:5432 -d postgres

# 3. Update server/.env
# DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
```

This gives you a fresh PostgreSQL instance with a known password!

---

## 🎯 What to Do Right Now

**Try these passwords first:**
1. `postgres`
2. `admin`  
3. `password`
4. (blank - just press Enter)

**If none work, use Docker** (Option 3 above) - it's the fastest solution!
