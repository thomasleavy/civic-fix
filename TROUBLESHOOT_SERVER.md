# Troubleshooting: Backend Server Won't Start

## Current Status
- ❌ Port 5000 is NOT listening
- ❌ Backend server is NOT running
- ✅ Frontend is running on port 3000

## Why the Server Won't Start

The most likely reason is **TypeScript compilation errors**. The server can't start if TypeScript can't compile.

## Solution Steps

### Step 1: Check Your Terminal

Look at the terminal where you ran `npm run dev` or `npm run dev:server`. 

**Do you see TypeScript errors?** Like:
```
TSError: ⨯ Unable to compile TypeScript:
src/controllers/authController.ts(47,23): error TS2769...
```

If YES → The errors need to be fixed first (they should already be fixed, but the server needs to restart).

If NO → Continue to Step 2.

### Step 2: Try Starting the Server Manually

Open a **NEW terminal window** and run:

```powershell
cd "C:\Users\thoma\Desktop\Misc coding\React\civic-fix"
cd server
npm run dev
```

**Watch for:**
- ✅ `🚀 Server running on port 5000` - SUCCESS!
- ❌ TypeScript errors - Need to fix
- ❌ Database connection errors - Check `.env` file

### Step 3: If You See TypeScript Errors

The errors should already be fixed. Try:

1. **Stop the server** (Ctrl+C)
2. **Clear TypeScript cache:**
   ```powershell
   Remove-Item -Recurse -Force server/node_modules/.cache -ErrorAction SilentlyContinue
   ```
3. **Restart:**
   ```powershell
   npm run dev
   ```

### Step 4: If You See Database Errors

Check `server/.env` has:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
```

### Step 5: Test the Server

Once you see "Server running on port 5000", test it:

Open browser: http://localhost:5000/health

Should return: `{"status":"ok","timestamp":"..."}`

## Quick Test Commands

```powershell
# Test if port 5000 is listening
Test-NetConnection -ComputerName localhost -Port 5000

# Check if server process is running
Get-Process -Name node | Where-Object {$_.Path -like "*civic-fix*"}
```

## Alternative: Start Server in Separate Terminal

1. **Terminal 1 - Backend:**
   ```powershell
   cd "C:\Users\thoma\Desktop\Misc coding\React\civic-fix\server"
   npm run dev
   ```

2. **Terminal 2 - Frontend (if not already running):**
   ```powershell
   cd "C:\Users\thoma\Desktop\Misc coding\React\civic-fix\client"
   npm run dev
   ```

## What Success Looks Like

**Backend Terminal:**
```
[nodemon] starting `ts-node src/index.ts`
🚀 Server running on port 5000
📝 Environment: development
✅ Connected to PostgreSQL database
```

**Then try registration again - it should work!**
