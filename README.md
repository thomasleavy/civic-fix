# CivicFix – Community Issue Reporting Platform

A lightweight, map-based platform for reporting and tracking local community issues (potholes, broken lights, litter, etc.).

## 🎯 Project Approach & Architecture

### Core Principles
1. **Separation of Concerns**: Clear split between frontend (React) and backend (Node.js/Express)
2. **RESTful API**: Standard REST endpoints for all operations
3. **Database-First**: PostgreSQL with proper schema design and migrations
4. **Scalable Structure**: Modular code organization for easy maintenance
5. **Type Safety**: TypeScript for both frontend and backend (recommended)

### Architecture Overview

```
civic-fix/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── context/       # React Context (auth, state)
│   │   ├── utils/         # Helper functions
│   │   └── types/         # TypeScript types
│   └── public/
│
├── server/          # Node.js/Express backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── services/      # External services (Cloudinary, email)
│   │   ├── utils/         # Helper functions
│   │   └── config/        # Configuration
│   └── migrations/        # Database migrations
│
├── shared/          # Shared types/utilities (optional)
└── docs/            # Additional documentation
```

## 🛠 Tech Stack

### Frontend
- **React 18+** with TypeScript
- **React Router** for navigation
- **Leaflet** + **React-Leaflet** for maps
- **Axios** for API calls
- **React Query** (TanStack Query) for data fetching/caching
- **Tailwind CSS** or **Material-UI** for styling
- **React Hook Form** for form handling

### Backend
- **Node.js** with **Express**
- **TypeScript** (recommended)
- **PostgreSQL** with **pg** or **Prisma** ORM
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Cloudinary SDK** for image management

### DevOps
- **Docker** (optional, for easy deployment)
- **Environment variables** (.env files)

## 📋 Features Implementation Plan

### Phase 1: Core Infrastructure
1. ✅ Project structure setup
2. Database schema design
3. Basic API endpoints (CRUD for issues)
4. Authentication system (JWT)
5. File upload to Cloudinary

### Phase 2: Frontend Foundation
1. React app setup with routing
2. Map integration (Leaflet)
3. Issue submission form
4. Issue list/view components
5. Basic admin panel

### Phase 3: Advanced Features
1. Status tracking workflow
2. Email notifications
3. Category filtering
4. Search and pagination
5. Image gallery

### Phase 4: Polish & Deploy
1. Error handling & validation
2. Loading states & UX improvements
3. Responsive design
4. Testing
5. Deployment setup

## 🗄 Database Schema

### Users Table
- id (UUID, primary key)
- email (unique)
- password_hash
- role (user/admin)
- created_at, updated_at

### Issues Table
- id (UUID, primary key)
- user_id (foreign key)
- title
- description
- category (pothole, lighting, litter, etc.)
- status (reported, in_progress, resolved, closed)
- latitude, longitude
- address (optional, geocoded)
- created_at, updated_at

### Issue_Images Table
- id (UUID, primary key)
- issue_id (foreign key)
- cloudinary_url
- cloudinary_public_id
- created_at

### Comments Table (optional, for future)
- id (UUID, primary key)
- issue_id (foreign key)
- user_id (foreign key)
- content
- created_at

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Install all dependencies:**
```bash
# From root directory - installs both server and client dependencies
npm run install:all

# OR install separately:
cd server && npm install
cd ../client && npm install
```

2. **Set up environment variables:**
- Copy `.env.example` to `.env` in both `client/` and `server/`
- Fill in database credentials, Cloudinary keys, JWT secret, etc.

3. **Set up database:**
```bash
# From root directory
npm run migrate

# OR from server directory
cd server
npm run migrate
```

4. **Start development servers:**

**Option 1: Run both from root (recommended):**
```bash
npm run dev  # Runs both server and client concurrently
```

**Option 2: Run separately in two terminals:**
```bash
# Terminal 1: Backend
npm run dev:server
# OR
cd server && npm run dev

# Terminal 2: Frontend
npm run dev:client
# OR
cd client && npm run dev
```

## 📝 Development Best Practices

1. **API Design**: Follow RESTful conventions
   - GET `/api/issues` - List issues
   - POST `/api/issues` - Create issue
   - GET `/api/issues/:id` - Get issue
   - PATCH `/api/issues/:id` - Update issue (admin)
   - DELETE `/api/issues/:id` - Delete issue (admin)

2. **Error Handling**: Consistent error responses
   ```json
   {
     "error": "Error message",
     "code": "ERROR_CODE",
     "details": {}
   }
   ```

3. **Validation**: Validate all inputs (use Joi or Zod)

4. **Security**:
   - Hash passwords (bcrypt)
   - Sanitize inputs
   - Rate limiting
   - CORS configuration
   - Environment variables for secrets

5. **Code Organization**:
   - Keep components small and focused
   - Extract reusable logic into hooks/services
   - Use TypeScript for type safety
   - Follow consistent naming conventions

## 🎨 UI/UX Considerations

- **Map-first design**: Make map prominent, easy to click to report
- **Photo upload**: Drag & drop, preview before submit
- **Status indicators**: Color-coded badges (red/yellow/green)
- **Mobile responsive**: Many users will report on mobile
- **Feedback**: Clear success/error messages
- **Loading states**: Show progress during uploads

## 📦 Deployment Strategy

1. **Frontend**: Vercel, Netlify, or static hosting
2. **Backend**: Railway, Render, Heroku, or VPS
3. **Database**: Managed PostgreSQL (Supabase, Railway, or AWS RDS)
4. **Images**: Cloudinary (free tier: 25GB storage, 25GB bandwidth/month)

## 🔐 Environment Variables

### Server (.env)
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/civicfix
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token (optional, for better tiles)
```

## 📚 Next Steps

1. Review this architecture
2. Set up the project structure
3. Initialize Git repository
4. Start with database schema
5. Build API endpoints incrementally
6. Connect frontend to backend
7. Test each feature as you build

## 🤝 Contributing

This is a learning project. Focus on:
- Clean, readable code
- Good error handling
- User-friendly interface
- Scalable architecture

---

**Happy coding! 🚀**
