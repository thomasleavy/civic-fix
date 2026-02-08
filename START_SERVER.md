# How to Start the Backend Server

## The Problem

You're seeing `ERR_CONNECTION_REFUSED` because the backend server isn't running. The frontend (localhost:3000) is trying to connect to the backend (localhost:5000), but nothing is listening there.

## Solution: Start the Backend Server

### Option 1: Start Both Servers Together (Recommended)

In your project root directory, run:

```powershell
npm run dev
```

This starts both:
- Backend server on http://localhost:5000
- Frontend server on http://localhost:3000

### Option 2: Start Backend Only

If you only want to start the backend:

```powershell
npm run dev:server
```

Or:

```powershell
cd server
npm run dev
```

## What to Look For

When the server starts successfully, you should see:

```
🚀 Server running on port 5000
📝 Environment: development
✅ Connected to PostgreSQL database
```

## If You See TypeScript Errors

If the server won't start due to TypeScript errors, the errors should already be fixed. If you still see errors:

1. Make sure you're in the project root
2. Try restarting: `Ctrl+C` then `npm run dev` again
3. Check that `server/.env` has the correct `DATABASE_URL`

## Testing Registration

Once the server is running:

1. Go to http://localhost:3000/register
2. Enter:
   - Email: `test@test.com` (or any email format)
   - Password: `123456`
   - Confirm: `123456`
3. Click "Register"
4. Should work! ✅

## Quick Checklist

- [ ] Backend server is running (check terminal for "Server running on port 5000")
- [ ] Frontend is running (check browser at localhost:3000)
- [ ] No TypeScript errors in backend terminal
- [ ] Database connection successful (check for "✅ Connected to PostgreSQL database")

---

**Note:** Emails don't need to be real - any email format will work for testing!
