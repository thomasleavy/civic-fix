# Authentication System Guide

## ✅ Complete Authentication Features

Your CivicFix app has a **fully functional authentication system** with:

### Features Implemented

1. **User Registration (Sign Up)**
   - Email and password registration
   - Password validation (minimum 6 characters)
   - Email format validation
   - Password confirmation
   - Automatic login after registration
   - Data saved to PostgreSQL database

2. **User Login (Sign In)**
   - Email and password authentication
   - Credential validation
   - JWT token generation
   - Automatic token storage

3. **User Logout (Sign Out)**
   - Clears authentication state
   - Removes token from localStorage
   - Redirects to home page

4. **Session Persistence**
   - Token stored in localStorage
   - User data persisted
   - Automatic re-authentication on page refresh
   - Protected routes

---

## 🔄 How It Works

### Sign Up Flow

1. User visits `/register`
2. Fills out form:
   - Email address
   - Password (min 6 characters)
   - Confirm password
3. Form validates input
4. On submit:
   - Frontend sends POST to `/api/auth/register`
   - Backend checks if email exists
   - Password is hashed with bcrypt
   - User record created in PostgreSQL
   - JWT token generated
   - Token and user data returned
   - Frontend stores token in localStorage
   - User automatically logged in
   - Redirected to home page

### Sign In Flow

1. User visits `/login`
2. Enters email and password
3. On submit:
   - Frontend sends POST to `/api/auth/login`
   - Backend finds user by email
   - Password verified with bcrypt
   - JWT token generated
   - Token and user data returned
   - Frontend stores token in localStorage
   - User logged in
   - Redirected to home page

### Sign Out Flow

1. User clicks "Logout" button in navbar
2. `logout()` function called
3. Token removed from localStorage
4. User data cleared
5. Auth state reset
6. Redirected to home page

---

## 📁 File Structure

### Backend (`server/src/`)

- **`routes/auth.ts`** - Authentication routes
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login

- **`controllers/authController.ts`** - Authentication logic
  - `register()` - Creates new user, hashes password, generates JWT
  - `login()` - Validates credentials, generates JWT

- **`middleware/auth.ts`** - Authentication middleware
  - `authenticate` - Verifies JWT token
  - `requireAdmin` - Checks admin role

- **`migrations/001_initial_schema.sql`** - Database schema
  - `users` table with email, password_hash, role

### Frontend (`client/src/`)

- **`pages/Register.tsx`** - Registration form
- **`pages/Login.tsx`** - Login form
- **`context/AuthContext.tsx`** - Authentication state management
- **`services/api.ts`** - API service layer
- **`components/Navbar.tsx`** - Navigation with auth buttons

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Unique user identifier (UUID)
- `email` - User email (unique, required)
- `password_hash` - Hashed password (bcrypt)
- `role` - User role ('user' or 'admin')
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

---

## 🔐 Security Features

1. **Password Hashing**
   - Passwords hashed with bcrypt (10 rounds)
   - Never stored in plain text

2. **JWT Tokens**
   - Secure token-based authentication
   - Token expires after 7 days (configurable)
   - Stored in localStorage

3. **Input Validation**
   - Email format validation
   - Password length requirements
   - Server-side validation

4. **Protected Routes**
   - API endpoints protected with JWT middleware
   - Frontend routes can check `isAuthenticated`

---

## 🧪 Testing the Authentication

### Test Sign Up

1. Go to http://localhost:3000/register
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm: `password123`
3. Click "Register"
4. Should redirect to home page
5. Check navbar - should show email and "Logout" button

### Test Sign Out

1. Click "Logout" button
2. Should redirect to home page
3. Navbar should show "Login" and "Register" buttons

### Test Sign In

1. Go to http://localhost:3000/login
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Sign in"
4. Should redirect to home page
5. Should be logged in

### Verify Database

```sql
-- Connect to PostgreSQL
psql -U postgres -d civicfix

-- Check users table
SELECT id, email, role, created_at FROM users;

-- You should see your registered user!
```

---

## 🎯 Current Status

✅ **Fully Functional!**

All authentication features are implemented and working:
- ✅ Sign up with email/password
- ✅ Sign in with credentials
- ✅ Sign out
- ✅ Data saved to PostgreSQL
- ✅ Session persistence
- ✅ Protected routes

---

## 🚀 Next Steps (Optional Enhancements)

1. **Email Verification** - Send verification email on registration
2. **Password Reset** - Forgot password functionality
3. **Remember Me** - Extended session option
4. **Social Login** - OAuth with Google/GitHub
5. **Two-Factor Authentication** - Extra security layer
6. **User Profile** - Edit profile, change password

---

## 📝 API Endpoints

### Register
```
POST /api/auth/register
Body: { email: string, password: string }
Response: { token: string, user: { id, email, role } }
```

### Login
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: { id, email, role } }
```

---

**Your authentication system is ready to use!** 🎉
