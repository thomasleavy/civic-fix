# Quick Fix: Server Not Running

## The Problem
You're seeing `ERR_CONNECTION_REFUSED` because the backend server is **not running** on port 5000.

## Solution: Start the Server

### Step 1: Open a Terminal
Open PowerShell or Command Prompt.

### Step 2: Navigate to Server Directory
```powershell
cd "C:\Users\thoma\Desktop\Misc coding\React\civic-fix\server"
```

### Step 3: Start the Server
```powershell
npm run dev
```

### Step 4: Watch for Success Message
You should see:
```
🚀 Server running on port 5000
📝 Environment: development
✅ Connected to PostgreSQL database
```

**If you see TypeScript errors instead:**
- The errors should be fixed now
- The server should auto-restart when files change
- If not, press `Ctrl+C` and run `npm run dev` again

### Step 5: Test the Server
Open in browser: http://localhost:5000/health

Should return: `{"status":"ok","timestamp":"..."}`

### Step 6: Try Registration Again
1. Go to http://localhost:3000/register
2. Enter email and password
3. Click Register
4. Should work! ✅

## Keep the Server Running
**Important:** Keep the terminal window open where the server is running. If you close it, the server stops.

## Running Both Servers
You need **TWO terminal windows**:

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd client
npm run dev
```

Or use one terminal with:
```powershell
npm run dev
```
(from project root - starts both)

---

**The server MUST be running for registration to work!**
