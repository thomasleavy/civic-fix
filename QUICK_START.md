# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

**From root directory (recommended):**
```bash
npm run install:all
```

**OR install separately:**
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Set Up Database

```bash
# Create database
createdb civicfix

# Or using psql
psql -U postgres -c "CREATE DATABASE civicfix;"
```

### 3. Configure Environment

**Backend (`server/.env`):**
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicfix
JWT_SECRET=your-random-secret-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:3000
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Migrations

```bash
cd server
npm run migrate
```

### 5. Start Servers

**Option 1: Run both from root (recommended):**
```bash
npm run dev
```

**Option 2: Run separately:**
```bash
# Terminal 1 - Backend
npm run dev:server
# OR: cd server && npm run dev

# Terminal 2 - Frontend
npm run dev:client
# OR: cd client && npm run dev
```

### 6. Open Browser

Visit: http://localhost:3000

## ✅ What You Get

- ✅ Full-stack application structure
- ✅ User authentication (JWT)
- ✅ Map-based issue reporting (Leaflet)
- ✅ Image uploads (Cloudinary)
- ✅ Admin dashboard
- ✅ Status tracking workflow
- ✅ RESTful API
- ✅ TypeScript support
- ✅ Modern React with hooks
- ✅ Responsive UI (Tailwind CSS)

## 📝 Next Steps

1. Register a user account
2. Report an issue on the map
3. Log in as admin to manage issues
4. Customize categories and features

See `SETUP.md` for detailed configuration.
