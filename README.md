# CivicFix

This is a prototype app that lets users report issues and suggestions in their local area to the local government. It’s an exercise in direct democracy, civic participation, and giving people a clear voice—map-based reporting, case tracking, and optional public sharing, so the community and admins can see what matters locally.

## Tech stack 

- **Frontend:** React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Tailwind CSS, Leaflet/React-Leaflet, ReCAPTCHA.
- **Backend:** Node.js, Express, TypeScript, JWT auth, PostgreSQL (with raw SQL and migrations), Multer (uploads), Nodemailer, optional Cloudinary.
- **Notable implementation:** County-scoped admin roles and locations, ban system, theme persistence per user, i.e. dark/lightmode, admin inbox with unread count, multi-image upload (issues/suggestions) with carousel, public/private visibility for submissions, appraisals (likes), trending and analytics, rate limiting, CORS handling, Weather API, News API.

## Get it running locally

**Prerequisites:** Node.js 18+, PostgreSQL 14+, npm.

1. **Clone and install**
   ```bash
   git clone https://github.com/thomasleavy/civic-fix.git
   cd civic-fix
   npm run install:all
   ```

2. **Environment**
   - In `server/`: copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, and any optional keys (Cloudinary, email, etc.).
   - In `client/`: copy `.env.example` to `.env` and set `VITE_API_URL` (e.g. `http://localhost:5000`) and, for registration, `VITE_RECAPTCHA_SITE_KEY`.

3. **Database**
   ```bash
   npm run migrate
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   - API: http://localhost:5000  
   - App: http://localhost:3000 (landing at `/civicfix`)

Landing page videos are NOT in the repo because of size limit. These visually enhance the site, but are not present here. Add `landing-page-video.mp4` and `landing-page-video-2.mp4` into `client/public/videos/`; download from the links in that folder’s README (Pexels blocks direct embedding, so files MUST be local for the scope of this prototype).

## Deploy to GitHub Pages

From the repo root run:

```bash
npm run deploy:gh
```

Then in the repo **Settings → Pages** set **Source** to **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**. The app will be at `https://<username>.github.io/civic-fix/` (landing at `/civic-fix/civicfix`). The backend and database are not deployed; the GitHub Pages build is for the front-end only (e.g. demo or docs).

## Licence

MIT.
