# Profile System - Complete Guide

## ✅ What's Implemented

### Profile Fields
- **First Name** - Required on creation, read-only after
- **Surname** - Required on creation, read-only after  
- **Date of Birth** - Required on creation, read-only after
- **Address** - Can be updated anytime
- **PPSN** - Optional for testing, read-only after creation
- **Civic Interests** - Can be updated anytime (multi-select)

### Security Rules
- ✅ Name, Surname, PPSN **cannot be changed** after initial creation
- ✅ Address and Civic Interests **can be updated** anytime
- ✅ All profile operations require authentication

## 🔧 Setup Required

### Step 1: Run Database Migration

The `user_profiles` table needs to be created:

```powershell
npm run migrate
```

This will create the `user_profiles` table in your database.

### Step 2: Restart Server

After running migrations, restart your server:

```powershell
# In server terminal
# Press Ctrl+C to stop, then:
npm run dev
```

## 📋 How It Works

### First Time (Profile Creation)
1. User registers → Redirected to `/profile`
2. User fills in **all fields**:
   - First Name (required)
   - Surname (required)
   - Date of Birth (required)
   - Address (required)
   - PPSN (optional for testing)
   - Civic Interests (select multiple)
3. Clicks "Save Profile"
4. Profile created in database

### Subsequent Visits (Profile Update)
1. User clicks "Profile" in navbar
2. Sees their existing profile
3. **Name, Surname, PPSN, Date of Birth** are **disabled/read-only**
4. Can only update:
   - Address
   - Civic Interests
5. Clicks "Save Profile"
6. Only address and interests are updated

## 🐛 Troubleshooting

### Error 500: "Profile table does not exist"
**Solution:** Run migrations:
```powershell
npm run migrate
```

### Error 500: Database connection
**Check:**
- PostgreSQL is running
- `DATABASE_URL` in `server/.env` is correct
- Database `civicfix` exists

### Fields not disabled after creation
**Check:**
- Profile was successfully created
- Browser cache (try hard refresh: Ctrl+F5)
- Check browser console for errors

## 🎯 Testing

1. **Register a new user**
2. **Fill in profile** (all fields)
3. **Save** - Should see success message
4. **Navigate away and come back**
5. **Check that Name, Surname, PPSN are disabled**
6. **Update Address and Interests**
7. **Save** - Should work!

## 📝 API Endpoints

### Get Profile
```
GET /api/profile
Headers: Authorization: Bearer <token>
Response: { profile: {...} | null }
```

### Create/Update Profile
```
PUT /api/profile
Headers: Authorization: Bearer <token>
Body: {
  firstName, surname, dateOfBirth, address, ppsn, civicInterests
}
```

**Note:** On update, only `address` and `civicInterests` are actually updated. Other fields are ignored.

---

**The profile system is ready! Just run the migration first!** 🚀
