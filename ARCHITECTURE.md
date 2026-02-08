# CivicFix Architecture & Approach

## 🎯 Project Philosophy

**CivicFix** is designed as a **scalable, maintainable, and user-friendly** platform. The architecture follows modern best practices for full-stack development.

## 🏗 Architecture Overview

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Pages   │  │Components│  │ Services │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                          │                              │
│                    HTTP/REST API                         │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                    Backend (Node.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Routes  │→ │Controllers│→ │ Services │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                          │                              │
│                    PostgreSQL Database                   │
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

### Backend (`server/`)

```
server/
├── src/
│   ├── config/          # Configuration (database, etc.)
│   ├── controllers/     # Business logic handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/          # API route definitions
│   ├── services/        # External services (Cloudinary, email)
│   ├── migrations/      # Database migrations
│   └── types/           # TypeScript type definitions
├── dist/                # Compiled JavaScript
└── package.json
```

**Key Principles:**
- **Routes** define endpoints and delegate to controllers
- **Controllers** handle request/response and business logic
- **Services** abstract external APIs (Cloudinary, email)
- **Middleware** handles cross-cutting concerns (auth, errors)

### Frontend (`client/`)

```
client/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level components
│   ├── context/         # React Context (auth state)
│   ├── services/        # API service layer
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helper functions
├── public/              # Static assets
└── package.json
```

**Key Principles:**
- **Pages** compose components for full views
- **Components** are reusable and focused
- **Services** handle all API communication
- **Context** manages global state (auth)

## 🔄 Data Flow

### Issue Reporting Flow

```
1. User clicks map → MapView component
2. User fills form → IssueForm component
3. Form submit → issueService.create()
4. API call → POST /api/issues
5. Backend validates → authenticate middleware
6. Controller processes → createIssue()
7. Upload images → Cloudinary service
8. Save to DB → PostgreSQL
9. Return response → Frontend
10. Update UI → React Query cache
```

### Authentication Flow

```
1. User submits login → authService.login()
2. POST /api/auth/login
3. Backend validates credentials
4. Generate JWT token
5. Return token + user data
6. Store in localStorage
7. Add to API headers
8. Protected routes check token
```

## 🗄 Database Design

### Schema Relationships

```
users (1) ────< (many) issues
issues (1) ────< (many) issue_images
```

**Key Design Decisions:**
- **UUIDs** for primary keys (better for distributed systems)
- **Soft deletes** possible (add `deleted_at` column)
- **Indexes** on frequently queried columns
- **Foreign keys** with CASCADE for data integrity

## 🔐 Security Architecture

### Authentication
- **JWT tokens** stored in localStorage
- **Bearer token** in Authorization header
- **Token expiration** (7 days default)
- **Password hashing** with bcrypt (10 rounds)

### Authorization
- **Role-based access** (user/admin)
- **Resource ownership** checks
- **Middleware** protects routes

### Data Protection
- **Input validation** (Joi/Zod)
- **SQL injection** prevention (parameterized queries)
- **XSS protection** (Helmet.js)
- **CORS** configuration
- **Rate limiting** (100 req/15min)

## 🚀 Scalability Considerations

### Current Architecture (MVP)
- Single server instance
- Direct database connections
- File uploads to Cloudinary
- In-memory session (JWT)

### Future Enhancements
- **Caching**: Redis for sessions/cache
- **Load balancing**: Multiple server instances
- **CDN**: For static assets
- **Database**: Read replicas for scaling reads
- **Queue**: Bull/Redis for background jobs (emails)
- **Monitoring**: Logging, error tracking (Sentry)

## 📡 API Design

### RESTful Conventions

```
GET    /api/issues          # List issues
POST   /api/issues          # Create issue
GET    /api/issues/:id      # Get issue
PATCH  /api/issues/:id      # Update issue
DELETE /api/issues/:id      # Delete issue (admin)
```

### Response Format

**Success:**
```json
{
  "message": "Issue created successfully",
  "issue": { ... }
}
```

**Error:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🎨 Frontend Architecture

### State Management
- **React Query**: Server state (caching, refetching)
- **React Context**: Auth state (global)
- **Local State**: Component-specific (useState)

### Component Hierarchy

```
App
├── AuthProvider (Context)
├── Router
│   ├── Navbar
│   ├── Home
│   ├── MapView
│   │   └── IssueForm
│   ├── IssueDetail
│   └── AdminDashboard
```

### Data Fetching Strategy
- **React Query** for all API calls
- **Automatic caching** and refetching
- **Optimistic updates** for better UX
- **Error boundaries** for error handling

## 🔧 Development Workflow

### Backend Development
1. Create migration for schema changes
2. Define route in `routes/`
3. Implement controller logic
4. Add middleware if needed
5. Test with Postman/Thunder Client

### Frontend Development
1. Create component in `components/` or `pages/`
2. Add API service method if needed
3. Use React Query for data fetching
4. Style with Tailwind CSS
5. Test in browser

## 📦 Technology Choices

### Why These Technologies?

**React + TypeScript:**
- Type safety
- Large ecosystem
- Great developer experience

**Node.js + Express:**
- JavaScript everywhere
- Fast development
- Large package ecosystem

**PostgreSQL:**
- Reliable and robust
- Great for structured data
- Excellent performance

**Leaflet:**
- Free and open source
- Lightweight
- Good mobile support

**Cloudinary:**
- Free tier sufficient
- Automatic image optimization
- CDN included

**React Query:**
- Excellent caching
- Automatic refetching
- Great DX

## 🎯 Best Practices Implemented

1. ✅ **TypeScript** for type safety
2. ✅ **Environment variables** for configuration
3. ✅ **Error handling** middleware
4. ✅ **Input validation** on all endpoints
5. ✅ **Password hashing** (bcrypt)
6. ✅ **JWT authentication**
7. ✅ **CORS** configuration
8. ✅ **Rate limiting**
9. ✅ **SQL injection** prevention
10. ✅ **Modular code** organization

## 🚧 Future Enhancements

### Phase 2 Features
- Email notifications
- Comment system
- Issue voting/priority
- User profiles
- Issue search/filtering
- Map clustering for many markers

### Phase 3 Features
- Mobile app (React Native)
- Push notifications
- Real-time updates (WebSockets)
- Analytics dashboard
- Export functionality
- Multi-language support

---

This architecture provides a **solid foundation** for building and scaling CivicFix effectively! 🚀
